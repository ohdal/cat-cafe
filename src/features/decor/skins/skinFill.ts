import type { CSSProperties } from "react";
import type { SkinFill } from "@/features/decor/skins/types";

/**
 * Skin의 fill(색상/이미지)을 인라인 style로 변환한다. Wall/Floor/상점 셀이 전부
 * 이 함수 하나로 렌더링해서, 이미지 패턴 등 fill 종류가 늘어나도 여기만 고치면 된다.
 */
export function skinFillStyle(fill: SkinFill): CSSProperties {
  if (fill.type === "image") {
    // "패턴"이라 사진처럼 늘려 채우는 cover가 아니라, 작은 타일을 반복시킨다.
    return {
      backgroundImage: `url(${fill.url})`,
      backgroundSize: fill.tileSize ?? "48px",
      backgroundRepeat: "repeat",
    };
  }
  return { backgroundColor: fill.color };
}
