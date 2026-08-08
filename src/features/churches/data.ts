// 교회 데이터 조회 — `data/churches.json`을 읽는 유일한 지점 (서버 전용)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Church } from "@/types/church";

// 모듈 스코프에서 한 번만 읽는다. 89건이라 전량을 메모리에 들고 있어도 부담이 없다.
const churches: Church[] = JSON.parse(
  readFileSync(join(process.cwd(), "data", "churches.json"), "utf8"),
);

export function getAllChurches(): Church[] {
  return churches;
}

export function getChurchById(id: string): Church | undefined {
  return churches.find((church) => church.id === id);
}

/** `generateStaticParams`용 */
export function getAllChurchIds(): string[] {
  return churches.map((church) => church.id);
}
