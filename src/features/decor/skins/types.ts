export type SkinKind = "wall" | "floor";

/** 스킨을 실제로 채우는 방식. 색상 또는 이미지(패턴/텍스처) 중 하나. */
export type SkinFill =
  | { type: "color"; color: string }
  /** tileSize 생략 시 48px 정사각 타일로 반복 (CSS background-size 값, 예: "48px" / "48px 48px"). */
  | { type: "image"; url: string; tileSize?: string };

export interface Skin {
  id: string;
  kind: SkinKind;
  name: string;
  price: number;
  fill: SkinFill;
}
