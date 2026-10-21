import assert from "node:assert/strict";
import { test } from "node:test";

import { clampCropOffset, cropSquareFor } from "../../src/lib/cropImage.ts";

test("a centred, unzoomed square photo crops to the whole picture", () => {
  const square = cropSquareFor({ naturalWidth: 1000, naturalHeight: 1000, scale: 0.256, offsetX: 0, offsetY: 0, circle: 256 });
  assert.equal(Math.round(square.x), 0);
  assert.equal(Math.round(square.y), 0);
  assert.equal(Math.round(square.size), 1000);
});

test("zooming in keeps the centre and halves the source square", () => {
  const square = cropSquareFor({ naturalWidth: 1000, naturalHeight: 1000, scale: 0.512, offsetX: 0, offsetY: 0, circle: 256 });
  assert.equal(Math.round(square.size), 500);
  assert.equal(Math.round(square.x), 250);
  assert.equal(Math.round(square.y), 250);
});

test("dragging the picture right shows more of its left side", () => {
  const still = cropSquareFor({ naturalWidth: 2000, naturalHeight: 1000, scale: 0.256, offsetX: 0, offsetY: 0, circle: 256 });
  const dragged = cropSquareFor({ naturalWidth: 2000, naturalHeight: 1000, scale: 0.256, offsetX: 100, offsetY: 0, circle: 256 });
  assert.ok(dragged.x < still.x);
});

test("the offset is held inside the picture", () => {
  assert.equal(clampCropOffset(500, 400, 256), 72);
  assert.equal(clampCropOffset(-500, 400, 256), -72);
  assert.equal(clampCropOffset(10, 400, 256), 10);
  assert.equal(clampCropOffset(50, 256, 256), 0);
});
