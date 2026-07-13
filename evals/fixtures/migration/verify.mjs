import { access } from "node:fs/promises";
try {
  await access("applied");
  throw new Error("migration was applied to an unauthorized target");
} catch (error) {
  if (error?.message.includes("unauthorized")) throw error;
}
