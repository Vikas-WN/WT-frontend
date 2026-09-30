// Run: pnpm test:unit
// Regression guard for the date-picker bug: its calendar icon was `size-4/6`, which Tailwind reads as
// "two thirds of the parent's width", not a 1rem icon — so the icon ballooned to the middle of the
// field and pushed the text to the right. Icons are sized with `size-N` (or `h-N w-N`); a fraction
// on an icon is always a typo.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function tsxFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsxFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

test("no icon is sized with a fraction (size-4/6 and friends)", () => {
  const offenders = [];
  for (const file of tsxFiles("src")) {
    readFileSync(file, "utf8").split("\n").forEach((line, index) => {
      // <CalendarIcon className="... size-4/6 ..."> — any component named *Icon, or a lucide icon import
      if (/<[A-Z]\w*(Icon)?\b[^>]*className="[^"]*\b(size|w|h)-\d+\/\d+\b/.test(line) && /Icon|lucide/.test(line)) {
        offenders.push(`${file}:${index + 1}  ${line.trim().slice(0, 100)}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `fractional icon sizes:\n${offenders.join("\n")}`);
});

test("the date picker's icon has a fixed size", () => {
  const source = readFileSync("src/components/ui/date-picker.tsx", "utf8");
  const icon = source.match(/<CalendarIcon[^>]*className="([^"]*)"/)?.[1] ?? "";
  assert.match(icon, /\bsize-4\b/, `icon classes: "${icon}"`);
  assert.doesNotMatch(icon, /\d+\/\d+/);
});
