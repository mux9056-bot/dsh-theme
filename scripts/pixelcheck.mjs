#!/usr/bin/env node
/**
 * Dev tool: decode a PNG (Node zlib, no deps) and report
 *   • dimensions
 *   • most common colors (top 5)
 *   • whether the dominant color matches an expected hex (within tolerance)
 * Usage: node scripts/pixelcheck.mjs <file.png> [expectedHex]
 */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const [file, expectedHex] = process.argv.slice(2);
const buf = readFileSync(file);

if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
let off = 8;
let width = 0, height = 0, bitDepth = 0, colorType = 0;
const idat = [];
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString("ascii", off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
  } else if (type === "IDAT") idat.push(data);
  off += 12 + len;
}
if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6))
  throw new Error(`unsupported PNG: depth=${bitDepth} colorType=${colorType}`);
const raw = inflateSync(Buffer.concat(idat));
const bpp = colorType === 6 ? 4 : 3;
const stride = width * bpp;
const out = Buffer.alloc(height * stride);
let p = 0;
for (let y = 0; y < height; y++) {
  const filter = raw[p++];
  const row = raw.subarray(p, p + stride);
  p += stride;
  const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
  for (let x = 0; x < stride; x++) {
    const a = x >= bpp ? out[y * stride + x - bpp] : 0;
    const b = prev ? prev[x] : 0;
    const c = x >= bpp && prev ? prev[x - bpp] : 0;
    let v = row[x];
    switch (filter) {
      case 0: break;
      case 1: v = (v + a) & 255; break;
      case 2: v = (v + b) & 255; break;
      case 3: v = (v + ((a + b) >> 1)) & 255; break;
      case 4: {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = (v + pr) & 255;
        break;
      }
      default: throw new Error(`bad filter ${filter}`);
    }
    out[y * stride + x] = v;
  }
}

const counts = new Map();
for (let y = 0; y < height; y += 2) {
  for (let x = 0; x < width; x += 2) {
    const i = y * stride + x * bpp;
    const key = `${out[i]},${out[i + 1]},${out[i + 2]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}
const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log(`${file}: ${width}x${height}, distinct≈${counts.size}`);
for (const [c, n] of top) console.log(`   rgb(${c})  ×${n}`);

if (expectedHex) {
  const h = expectedHex.replace("#", "");
  const er = parseInt(h.slice(0, 2), 16), eg = parseInt(h.slice(2, 4), 16), eb = parseInt(h.slice(4, 6), 16);
  const [mr, mg, mb] = top[0][0].split(",").map(Number);
  const dist = Math.hypot(er - mr, eg - mg, eb - mb);
  console.log(`   dominant vs expected ${expectedHex}: Δ=${dist.toFixed(1)} ${dist < 60 ? "MATCH ✔" : "MISMATCH ✘"}`);
}
