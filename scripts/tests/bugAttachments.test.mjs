import assert from "node:assert/strict";
import { test } from "node:test";

import { checkBugFile, formatFileSize, nameForPastedImage } from "../../src/utils/bugAttachments.ts";

const MB = 1024 * 1024;
const rules = { maxFiles: 5, imageBytes: 10 * MB, videoBytes: 25 * MB, otherBytes: 10 * MB, kinds: { ".png": "image", ".mp4": "video", ".log": "other" } };

test("a normal screenshot is fine", () => {
  assert.equal(checkBugFile({ name: "Shot.PNG", size: 2 * MB }, 0, rules), null);
});

test("unsupported, empty and oversized files are named in the problem", () => {
  assert.deepEqual(checkBugFile({ name: "run.exe", size: 10 }, 0, rules), { code: "unsupported", name: "run.exe" });
  assert.deepEqual(checkBugFile({ name: "a.png", size: 0 }, 0, rules), { code: "empty", name: "a.png" });
  assert.deepEqual(checkBugFile({ name: "b.png", size: 11 * MB }, 0, rules), { code: "too_big", name: "b.png", mb: 10 });
});

test("video gets the larger allowance", () => {
  assert.equal(checkBugFile({ name: "rec.mp4", size: 20 * MB }, 0, rules), null);
  assert.deepEqual(checkBugFile({ name: "rec.mp4", size: 30 * MB }, 0, rules), { code: "too_big", name: "rec.mp4", mb: 25 });
});

test("the sixth file is refused", () => {
  assert.deepEqual(checkBugFile({ name: "a.png", size: 5 }, 5, rules), { code: "too_many", max: 5 });
});

test("sizes read naturally and pasted images get a meaningful name", () => {
  assert.equal(formatFileSize(1.4 * MB), "1.4 MB");
  assert.equal(formatFileSize(820 * 1024), "820 KB");
  assert.equal(nameForPastedImage("image/png", new Date(2026, 9, 8, 15, 4, 9)), "screenshot-20261008-150409.png");
  assert.equal(nameForPastedImage("image/jpeg", new Date(2026, 0, 2, 3, 4, 5)), "screenshot-20260102-030405.jpg");
});
