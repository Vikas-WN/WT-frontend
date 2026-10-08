import assert from "node:assert/strict";
import { test } from "node:test";

import { buildMonthCells, groupByKind, pickDefaultDay } from "../../src/utils/whosOutCalendar.ts";

test("October 2026 starts on a Thursday: three blanks, 31 days, padded to whole weeks", () => {
  const cells = buildMonthCells("2026-10-01", "2026-10-31");
  assert.equal(cells.slice(0, 3).every((c) => c === null), true);
  assert.equal(cells[3], "2026-10-01");
  assert.equal(cells.filter(Boolean).length, 31);
  assert.equal(cells.length % 7, 0);
});

test("a month that starts on Monday has no leading blanks", () => {
  const cells = buildMonthCells("2026-06-01", "2026-06-30");
  assert.equal(cells[0], "2026-06-01");
});

test("groups by kind in the given order, people A to Z", () => {
  const occ = (name, type) => ({ person: { name, email: `${name}@x` }, entry: { type, is_half_day: false } });
  const order = { LEAVE: 0, WFH: 1, WFH_EXCEPTION: 2 };
  const groups = groupByKind([occ("Zed", "WFH"), occ("Amy", "WFH"), occ("Bob", "LEAVE")], (t) => order[t] ?? 9);
  assert.deepEqual(groups.map((g) => g.type), ["LEAVE", "WFH"]);
  assert.deepEqual(groups[1].items.map((i) => i.person.name), ["Amy", "Zed"]);
});

test("default day: the picked day, else today, else the first busy day", () => {
  assert.equal(pickDefaultDay("2026-10-12", "2026-10-01", "2026-10-31", "2026-10-08", []), "2026-10-12");
  assert.equal(pickDefaultDay("2026-09-12", "2026-10-01", "2026-10-31", "2026-10-08", []), "2026-10-08");
  assert.equal(pickDefaultDay(null, "2026-11-01", "2026-11-30", "2026-10-08", ["2026-11-05"]), "2026-11-05");
  assert.equal(pickDefaultDay(null, "2026-11-01", "2026-11-30", "2026-10-08", []), null);
});
