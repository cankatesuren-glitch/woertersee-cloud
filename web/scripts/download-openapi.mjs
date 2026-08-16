import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = process.env.OPENAPI_URL ?? "http://localhost:8080/v3/api-docs";
const output = resolve("src/lib/api/openapi.json");

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortKeys(child)]),
  );
}

const response = await fetch(source);
if (!response.ok) {
  throw new Error(`OpenAPI download failed with HTTP ${response.status}`);
}

const contract = await response.json();
if (contract.info?.title !== "WörterSee Cloud API") {
  throw new Error("The downloaded contract is not the WörterSee Cloud API");
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(sortKeys(contract), null, 2)}\n`);
console.log(`Saved ${source} to ${output}`);
