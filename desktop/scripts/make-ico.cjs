// Builds build/icon.ico from the PNGs in build/icons as classic BMP-encoded icon entries, which every Windows
// installer toolchain (including NSIS) accepts — unlike a single PNG-compressed 256px entry.
const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const SIZES = [16, 24, 32, 48, 64, 128, 256].filter((s) => fs.existsSync(path.join(__dirname, "..", "build", "icons", `${s}x${s}.png`)));
const entries = SIZES.map((size) => {
  const png = PNG.sync.read(fs.readFileSync(path.join(__dirname, "..", "build", "icons", `${size}x${size}.png`)));
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // BITMAPINFOHEADER
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // height is doubled: XOR bitmap + AND mask
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const src = ((size - 1 - y) * size + x) * 4; // bottom-up rows
      const dst = (y * size + x) * 4;
      pixels[dst] = png.data[src + 2]; // B
      pixels[dst + 1] = png.data[src + 1]; // G
      pixels[dst + 2] = png.data[src]; // R
      pixels[dst + 3] = png.data[src + 3]; // A
    }
  }
  const maskRow = Math.ceil(size / 32) * 4;
  return { size, data: Buffer.concat([header, pixels, Buffer.alloc(maskRow * size)]) };
});

const dir = Buffer.alloc(6 + entries.length * 16);
dir.writeUInt16LE(1, 2); // type: icon
dir.writeUInt16LE(entries.length, 4);
let offset = dir.length;
entries.forEach((entry, i) => {
  const at = 6 + i * 16;
  dir[at] = entry.size >= 256 ? 0 : entry.size;
  dir[at + 1] = entry.size >= 256 ? 0 : entry.size;
  dir.writeUInt16LE(1, at + 4);
  dir.writeUInt16LE(32, at + 6);
  dir.writeUInt32LE(entry.data.length, at + 8);
  dir.writeUInt32LE(offset, at + 12);
  offset += entry.data.length;
});
fs.writeFileSync(path.join(__dirname, "..", "build", "icon.ico"), Buffer.concat([dir, ...entries.map((e) => e.data)]));
console.log(`icon.ico written (${SIZES.join(", ")})`);
