import { expect } from "@std/expect";
import { describe, it } from "node:test";
import * as command from "../src/command.ts";

/** Execute inline Deno code through the same runtime that owns the test suite. */
function denoEval(source: string): [string, string[]] {
  return [Deno.execPath(), ["eval", source]];
}

describe("bounded child commands", () => {
  it("captures ordinary stdout and stderr", async () => {
    const [executable, args] = denoEval(
      'console.log("hello"); console.error("warning");',
    );
    const result = await command.call(executable, args, {
      timeoutMs: 2_000,
      outputBytes: 4_096,
    });

    expect(result.success).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(result.stdout).toContain("hello");
    expect(result.stderr).toContain("warning");
    expect(result.stdoutTruncated).toBe(false);
    expect(result.stderrTruncated).toBe(false);
  });

  it("drains verbose pipes while retaining only the configured prefix", async () => {
    const [executable, args] = denoEval(
      'console.log("x".repeat(4096)); console.error("y".repeat(4096));',
    );
    const result = await command.call(executable, args, {
      timeoutMs: 2_000,
      outputBytes: 128,
    });

    expect(result.success).toBe(true);
    expect(result.stdoutTruncated).toBe(true);
    expect(result.stderrTruncated).toBe(true);
    expect(new TextEncoder().encode(result.stdout).byteLength).toBeLessThanOrEqual(
      128,
    );
    expect(new TextEncoder().encode(result.stderr).byteLength).toBeLessThanOrEqual(
      128,
    );
  });

  it("force-kills a child that ignores graceful timeout termination", async () => {
    const [executable, args] = denoEval(`
      Deno.addSignalListener("SIGTERM", () => {});
      await new Promise(() => {});
    `);
    const started = performance.now();
    const result = await command.call(executable, args, {
      timeoutMs: 50,
      killDelayMs: 50,
      outputBytes: 4_096,
    });

    expect(result.timedOut).toBe(true);
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
