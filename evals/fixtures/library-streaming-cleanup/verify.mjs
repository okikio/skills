import { collectItems } from "./src/collect.mjs";

/** Fail the fixture verifier with a concrete invariant. */
function check(condition, message) {
  if (!condition) throw new Error(message);
}

/** Compare JSON-safe fixture values without importing a test assertion layer. */
function equal(actual, expected, message) {
  check(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

let acquired = 0;
let reads = 0;
let disposed = 0;

const output = collectItems([1, 2, 3, 4], async () => {
  acquired++;
  return {
    async read(value) {
      reads++;
      await Promise.resolve();
      return value * 2;
    },
    async [Symbol.asyncDispose]() {
      disposed++;
    },
  };
});

check(acquired === 0, "resource acquisition must be lazy");
check(
  typeof output?.[Symbol.asyncIterator] === "function",
  "must return AsyncIterable",
);

const values = [];
for await (const value of output) {
  values.push(value);
  if (values.length === 2) break;
}

equal(values, [2, 4], "early iteration values");
check(acquired === 1, "resource must be acquired exactly once");
check(reads === 2, "early return must stop upstream reads");
check(disposed === 1, "resource must be disposed exactly once");

let failureDisposed = 0;
const failing = collectItems([1, 2], async () => ({
  async read(value) {
    if (value === 2) throw new Error("read failed");
    return value;
  },
  async [Symbol.asyncDispose]() {
    failureDisposed++;
  },
}));

let failed = false;
try {
  for await (const _value of failing) {
    // Consume until the source fails.
  }
} catch (error) {
  failed = /read failed/.test(String(error));
}
check(failed, "stream must surface the source read failure");
check(failureDisposed === 1, "failure must dispose the resource");

console.log("streaming cleanup verified");
