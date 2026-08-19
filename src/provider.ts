import { join } from "node:path";
import * as command from "./command.ts";
import type { ModelAdapterType } from "./model.ts";
import {
  type JudgeRequestType,
  JudgeResponseSchema,
  type JudgeResponseType,
  type RolloutRequestType,
  RolloutResponseSchema,
  type RolloutResponseType,
} from "./protocol.ts";
import * as hash from "./hash.ts";

/** Maximum normalized response document accepted from one provider adapter. */
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
/** Maximum diagnostic bytes retained independently from stdout and stderr. */
const MAX_OUTPUT_BYTES = 1024 * 1024;

/** Request shapes that can be sent through the provider-adapter protocol. */
export type RequestType = RolloutRequestType | JudgeRequestType;
/** Response shapes returned by the provider-adapter protocol. */
export type ResponseType = RolloutResponseType | JudgeResponseType;

/** Provider call result retained by the repository evaluator. */
export interface CallType<T extends ResponseType = ResponseType> {
  /** Parsed normalized response when the adapter produced a valid document. */
  readonly response?: T;
  /** Bounded stdout retained for diagnostics and the redacted trace. */
  readonly stdout: string;
  /** Bounded stderr retained for diagnostics and the redacted trace. */
  readonly stderr: string;
  /** Wall-clock provider-adapter duration in milliseconds. */
  readonly durationMs: number;
  /** Secret environment values that must be removed from persisted evidence. */
  readonly secrets: Readonly<Record<string, string | undefined>>;
  /** Stable provider failure summary when the call cannot be trusted. */
  readonly error?: string;
}

/** Append one failure detail without erasing an earlier, more primary fault. */
function addError(current: string | undefined, detail: string): string {
  return current ? `${current}; ${detail}` : detail;
}

/** Substitute only the request and response file placeholders owned by SkillOpt. */
function getCommand(
  parts: readonly string[],
  request: string,
  response: string,
): string[] {
  return parts.map((part) =>
    part.replaceAll("{request}", request).replaceAll("{response}", response)
  );
}

/** Read only environment variables explicitly admitted by the model registry. */
function getEnvironment(names: readonly string[]): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value !== undefined) environment[name] = value;
  }
  return environment;
}

/** Select allowed environment values that the registry classifies as secrets. */
function getSecrets(
  environment: Readonly<Record<string, string>>,
  names: readonly string[],
): Record<string, string | undefined> {
  return Object.fromEntries(names.map((name) => [name, environment[name]]));
}

/** Read one bounded adapter response before JSON materialization. */
async function readJson(path: string): Promise<unknown> {
  const stat = await Deno.lstat(path);
  if (!stat.isFile || stat.isSymlink) {
    throw new Error("Adapter response must be a regular file, not a link");
  }
  if (stat.size > MAX_RESPONSE_BYTES) {
    throw new Error(`Adapter response exceeds ${MAX_RESPONSE_BYTES} bytes`);
  }
  return JSON.parse(await Deno.readTextFile(path));
}

/** Parse the response schema corresponding to the request kind. */
async function readResponse(
  path: string,
  kind: RequestType["kind"],
): Promise<ResponseType> {
  const value = await readJson(path);
  return kind === "rollout"
    ? RolloutResponseSchema.parse(value)
    : JudgeResponseSchema.parse(value);
}

/**
 * Invoke one configured provider adapter through the normalized file protocol.
 *
 * The request is written before process creation and its SHA-256 is checked
 * again after the process exits. The adapter receives only registry-approved
 * environment variables. Its diagnostics are drained completely but retained
 * under fixed byte limits so a noisy provider cannot create unbounded evaluator
 * memory growth. A malformed response remains a provider failure rather than
 * being guessed from stdout.
 */
export function call(
  model: ModelAdapterType,
  request: RolloutRequestType,
  protocolRoot: string,
  cwd: string,
): Promise<CallType<RolloutResponseType>>;
export function call(
  model: ModelAdapterType,
  request: JudgeRequestType,
  protocolRoot: string,
  cwd: string,
): Promise<CallType<JudgeResponseType>>;
export async function call(
  model: ModelAdapterType,
  request: RequestType,
  protocolRoot: string,
  cwd: string,
): Promise<CallType> {
  if (!model.requests.includes(request.kind)) {
    return {
      stdout: "",
      stderr: "",
      durationMs: 0,
      secrets: {},
      error: `${model.id} does not support ${request.kind} requests`,
    };
  }

  const requestPath = join(protocolRoot, `${request.kind}-request.json`);
  const responsePath = join(protocolRoot, `${request.kind}-response.json`);
  const requestText = `${JSON.stringify(request, null, 2)}\n`;
  const requestDigest = await hash.text(requestText);
  await Deno.writeTextFile(requestPath, requestText);

  const environment = getEnvironment(model.env);
  const secrets = getSecrets(environment, model.secretEnv);
  const invocation = getCommand(model.command, requestPath, responsePath);
  const [executable, ...args] = invocation;
  if (!executable) {
    return {
      stdout: "",
      stderr: "",
      durationMs: 0,
      secrets,
      error: `${model.id}: adapter command is empty`,
    };
  }

  const started = performance.now();
  let call: command.CallResultType;
  try {
    call = await command.call(executable, args, {
      cwd,
      clearEnv: true,
      env: environment,
      timeoutMs: model.timeoutMs,
      outputBytes: MAX_OUTPUT_BYTES,
    });
  } catch (cause) {
    return {
      stdout: "",
      stderr: "",
      durationMs: performance.now() - started,
      secrets,
      error: `Cannot start adapter ${model.id}: ${String(cause)}`,
    };
  }
  const durationMs = performance.now() - started;

  let error: string | undefined;
  if (call.timedOut) {
    error = `Adapter exceeded ${model.timeoutMs}ms`;
  } else if (!call.success) {
    error = `Adapter exited with code ${call.code}`;
  }
  if (call.stdoutTruncated || call.stderrTruncated) {
    error = addError(
      error,
      `Adapter diagnostics exceeded ${MAX_OUTPUT_BYTES} bytes`,
    );
  }

  let response: ResponseType | undefined;
  try {
    response = await readResponse(responsePath, request.kind);
  } catch (cause) {
    error = addError(error, `Adapter response is invalid: ${String(cause)}`);
  }

  if (response && response.adapterVersion !== model.adapterVersion) {
    error = addError(
      error,
      `Adapter version ${response.adapterVersion} does not match configured ${model.adapterVersion}`,
    );
  }
  if (response?.error) error = addError(error, response.error);

  try {
    if (await hash.text(await Deno.readTextFile(requestPath)) !== requestDigest) {
      error = addError(error, "Adapter modified its immutable request");
    }
  } catch (cause) {
    error = addError(error, `Cannot verify immutable adapter request: ${cause}`);
  }

  return {
    response,
    stdout: call.stdout,
    stderr: call.stderr,
    durationMs,
    secrets,
    error,
  };
}
