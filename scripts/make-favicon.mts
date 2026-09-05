// src/app/icon.png → src/app/favicon.ico — 오프라인 배치, 로고를 바꿨을 때만 돌린다
//
// **왜 .ico가 아직 필요한가.** `icon.png`가 있으면 브라우저 탭은 그걸로 해결되지만,
// 일부 리더기·봇·구형 브라우저는 여전히 `/favicon.ico`를 루트에서 직접 찌른다.
// 그 경로가 비면 404가 로그에 쌓인다.
//
// **왜 여러 크기를 넣는가.** 512 한 장만 넣고 브라우저가 16px로 줄이게 두면 뭉갠다.
// 16·32·48을 각각 미리 줄여 담아 각 상황에 맞는 것을 고르게 한다.

import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SOURCE = "src/app/icon.png";
const OUTPUT = "src/app/favicon.ico";
const SIZES = [16, 32, 48];

/**
 * ICO 컨테이너를 직접 만든다.
 *
 * **sharp는 .ico를 쓰지 못한다.** 다만 ICO는 각 항목에 PNG를 그대로 담는 것을
 * 허용하므로(모던 브라우저 전부 지원), 헤더와 디렉터리만 손으로 조립하면 된다.
 * 크기별 PNG를 sharp로 만들고 이 함수가 봉투를 씌우는 구조다.
 */
function buildIco(images: { size: number; data: Buffer }[]): Buffer {
  const HEADER = 6;
  const ENTRY = 16;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(images.length, 4);

  let offset = HEADER + ENTRY * images.length;
  const entries: Buffer[] = [];

  for (const { size, data } of images) {
    const entry = Buffer.alloc(ENTRY);
    // 256은 0으로 적는 것이 규격이다. 여기서는 48이 최대라 해당 없음
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // 팔레트 색 수 (트루컬러라 0)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const source = readFileSync(SOURCE);
const { width, height } = await sharp(source).metadata();
if (width !== height) {
  throw new Error(`${SOURCE}가 정사각형이 아니다 (${width}x${height})`);
}

const images = [];
for (const size of SIZES) {
  const data = await sharp(source).resize(size, size).png().toBuffer();
  images.push({ size, data });
}

const ico = buildIco(images);
writeFileSync(OUTPUT, ico);

console.log(`${SOURCE} (${width}x${height}) → ${OUTPUT}`);
console.log(`담은 크기: ${SIZES.join(" · ")} (${ico.length} bytes)`);
