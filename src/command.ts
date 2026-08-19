/** Result captured from one repository-owned child command. */
export type CallResultType = {
  /** Exit code reported by the child process. */
  readonly code: number;
  /** Whether the child exited successfully according to the runtime. */
  readonly success: boolean;
  /** Signal reported by the runtime when the child ended from a signal. */
  readonly signal?: string;
  /** True when the timeout fired, even if the child later exited cleanly. */
  readonly timedOut: boolean;
  /** Retained standard output, capped by `outputBytes`. */
  readonly stdout: string;
  /** Retained standard error, capped by `outputBytes`. */
  readonly stderr: string;
  /** True when standard output exceeded the retained byte limit. */
  readonly stdoutTruncated: boolean;
  /** True when standard error exceeded the retained byte limit. */
  readonly stderrTruncated: boolean;
};

/** Options that control one repository-owned child command. */
export type CallOptionsType = {
  /** Working directory visible to the child process. */
  readonly cwd?: string;
  /** Environment values passed to the child process. */
  readonly env?: Readonly<Record<string, string>>;
  /** Remove the parent environment before applying `env`. */
  readonly clearEnv?: boolean;
  /** Maximum wall-clock time before termination begins. */
  readonly timeoutMs: number;
  /** Maximum retained bytes for each output stream. */
  readonly outputBytes: number;
  /** Delay between graceful termination and forced termination. */
  readonly killDelayMs?: number;
};

type CapturedOutputType = {
  readonly text: string;
  readonly truncated: boolean;
};

/**
 * Drains one child-process stream while retaining only a bounded prefix.
 *
 * Bytes beyond `limit` are deliberately discarded after reading. Continuing to
 * drain the pipe prevents a verbose child from blocking on backpressure while
 * keeping repository memory use independent from total child output volume.
 */
async function capture(
  stream: ReadableStream<Uint8Array>,
  limit: number,
): Promise<CapturedOutputType> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let retained = 0;
  let truncated = false;

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      if (retained >= limit) {
        truncated = true;
        continue;
      }

      const available = Math.min(result.value.length, limit - retained);
      chunks.push(result.value.slice(0, available));
      retained += available;
      if (available < result.value.length) truncated = true;
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(retained);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    text: new TextDecoder().decode(bytes),
    truncated,
  };
}

/**
 * Calls one child command with bounded diagnostics and two-stage termination.
 *
 * The timeout first sends `SIGTERM` so cooperative tools can clean up. If the
 * child remains alive after `killDelayMs`, `SIGKILL` prevents the repository
 * task from waiting forever. A timeout remains visible even when the child
 * exits with code zero after receiving the first signal.
 */
export async function call(
  executable: string,
  args: readonly string[],
  options: CallOptionsType,
): Promise<CallResultType> {
  const child = new Deno.Command(executable, {
    args: [...args],
    cwd: options.cwd,
    env: options.env ? { ...options.env } : undefined,
    clearEnv: options.clearEnv ?? false,
    stdout: "piped",
    stderr: "piped",
  }).spawn();

  const stdout = capture(child.stdout, options.outputBytes);
  const stderr = capture(child.stderr, options.outputBytes);
  let timedOut = false;
  let forceTimer: ReturnType<typeof setTimeout> | undefined;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The child can finish between the timeout and signal delivery.
    }

    // Schedule forced termination even when graceful signaling fails. Deno
    // supports SIGKILL on Windows and POSIX hosts, so a child that ignores or
    // cannot receive SIGTERM cannot keep the evaluator waiting indefinitely.
    forceTimer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // The child exited after the graceful termination request.
      }
    }, options.killDelayMs ?? 2_000);
  }, options.timeoutMs);

  try {
    const [status, stdoutResult, stderrResult] = await Promise.all([
      child.status,
      stdout,
      stderr,
    ]);
    return {
      code: status.code,
      success: status.success,
      signal: status.signal ?? undefined,
      timedOut,
      stdout: stdoutResult.text,
      stderr: stderrResult.text,
      stdoutTruncated: stdoutResult.truncated,
      stderrTruncated: stderrResult.truncated,
    };
  } finally {
    clearTimeout(timer);
    if (forceTimer !== undefined) clearTimeout(forceTimer);
  }
}
