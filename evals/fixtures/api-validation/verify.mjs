import { handlerCount, request } from "./api.mjs";

const invalid = request({ id: 42 });
if (invalid.status !== 422) throw new Error("invalid request did not return 422");
if (handlerCount() !== 0) throw new Error("handler ran for invalid input");
const valid = request({ id: "item-1" });
if (valid.status !== 200 || valid.body.id !== "item-1") {
  throw new Error("valid request failed");
}
if (handlerCount() !== 1) throw new Error("valid handler count is wrong");
