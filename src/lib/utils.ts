import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge는 Tailwind 기본 스케일만 알고 `@theme`에 넣은 이름은 모른다.
 * 그래서 `text-t4` 같은 클래스를 폰트 크기가 아니라 **색상**으로 오인하고,
 * 같은 className에 있던 `text-primary-foreground`를 지워버린다.
 * 지역 필터의 선택된 칩 글자가 흰색 대신 검정으로 나온 원인이었다.
 *
 * 커스텀 타이포 단계를 `font-size` 그룹으로 등록해 크기와 색이 서로를 지우지 않게 한다.
 * `globals.css`의 `@theme`에 단계를 추가하면 여기에도 같이 넣어야 한다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["t2", "t4", "t5", "t6", "t8", "t9", "t10"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
