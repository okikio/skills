import assert from "node:assert/strict";
import { collectItems } from "./src/collect.mjs";

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

assert.equal(acquired, 0, "resource acquisition must be lazy");
assert.equal(typeof output?.[Symbol.asyncIterator], "function", "must return AsyncIterable");

const values = [];
for await (const value of output) {
  values.push(value);
  if (values.length === 2) break;
}

assert.deepEqual(values, [2, 4]);
assert.equal(acquired, 1);
assert.equal(reads, 2, "early return must stop upstream reads");
assert.equal(disposed, 1, "resource must be disposed exactly once");

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

await assert.rejects(async () => {
  for await (const _value of failing) {
    // Consume until the source fails.
  }
}, /read failed/);
assert.equal(failureDisposed, 1, "failure must dispose the resource");

console.log("streaming cleanup verified");
