import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const directory = new URL(".", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", directory), "utf8"));
const ledger = readFileSync(new URL("commit-ledger.jsonl", directory));
const records = ledger
  .toString("utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const actualHash = createHash("sha256").update(ledger).digest("hex");
const commitShas = execFileSync(
  "git",
  ["log", "--reverse", "--format=%H", manifest.last_commit],
  { encoding: "utf8" },
)
  .trim()
  .split("\n");

if (actualHash !== manifest.files["commit-ledger.jsonl"].sha256) {
  throw new Error("Ledger SHA-256 does not match manifest.json.");
}
if (records.length !== manifest.commit_count || commitShas.length !== manifest.commit_count) {
  throw new Error("Ledger record count does not match the manifest or recorded Git range.");
}
for (const [index, record] of records.entries()) {
  if (
    record.schema_version !== "1.0" ||
    record.record_type !== "retrospective_commit_evidence" ||
    record.source !== "git_history" ||
    record.sequence !== index + 1 ||
    record.commit?.sha !== commitShas[index] ||
    !Array.isArray(record.work_observed?.changed_files)
  ) {
    throw new Error(`Invalid or incomplete evidence record at sequence ${index + 1}.`);
  }
}

console.log(`Verified ${records.length} retrospective commit-evidence records.`);
