// pigeon-pitch-entry — writes the winning one-line pigeon pitch to entry.txt.
//
// The pitch is a single line of 1-200 characters: an elevator pitch a city
// pigeon gives investors for its statue-insurance startup. The program is
// fully deterministic: no clock reads, no randomness, no network access, no
// environment secrets.
//
// Gate checks (mirroring the sealed scorer): the file must be UTF-8 text of
// 1-200 characters, not only whitespace, on exactly one line. On top of the
// gate this program also asserts the pitch carries the two numbers the
// playbook demands for a pitch brief (a price and a second figure), so a
// regression that dropped the money would fail loudly instead of shipping.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PITCH =
  "I insure every bronze general in Central Park: the city pays me $3 a statue a month, and I still pooped on 41 of them — because I'm clause 41.";

const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 200;

type GateResult = { ok: true } | { ok: false; problems: string[] };

function gateCheck(text: string): GateResult {
  const problems: string[] = [];
  const charCount = [...text].length;
  if (charCount < GATE_MIN_CHARS || charCount > GATE_MAX_CHARS) {
    problems.push(
      `pitch must be ${GATE_MIN_CHARS}-${GATE_MAX_CHARS} characters, got ${charCount}`,
    );
  }
  if (text.trim().length === 0) {
    problems.push("pitch must not be only whitespace");
  }
  if (text.trim() !== text) {
    problems.push("pitch must not have leading or trailing whitespace");
  }
  if (text.split("\n").length !== 1 || text.includes("\r")) {
    problems.push("pitch must be exactly one line");
  }
  // UTF-8 round-trip: the bytes we write must decode back to the same text.
  const encoded = new TextEncoder().encode(text);
  if (new TextDecoder("utf-8", { fatal: true }).decode(encoded) !== text) {
    problems.push("pitch must be valid UTF-8 text");
  }
  // Playbook rule 25: a pitch brief must name a price AND a second number.
  const dollarFigures = text.match(/\$\d+/g) ?? [];
  const otherNumbers = text.match(/(?<!\$)\b\d+\b/g) ?? [];
  if (dollarFigures.length < 1 || otherNumbers.length < 1) {
    problems.push("pitch must name a price and a second number");
  }
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

function writeEntry(text: string): void {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, "entry.txt"), text, "utf8");
}

const result = gateCheck(PITCH);
if (!result.ok) {
  throw new Error(`invalid pitch: ${result.problems.join("; ")}`);
}
writeEntry(PITCH);
