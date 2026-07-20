import type { Skin } from "@/features/decor/skins/types";

// 첫 번째 항목이 각 카테고리의 기본(초기 보유) 스킨. 기존 Wall/Floor placeholder 색과
// 맞춰서, 아무것도 안 사도 지금과 같은 모습으로 보이게 한다.
export const WALL_SKINS: Skin[] = [
  { id: "wall-blush", kind: "wall", name: "블러쉬 벽지", description: "은은한 핑크빛이 감도는 부드러운 벽지.", price: 40, fill: { type: "color", color: "#fecdd3" } },
  { id: "wall-cream", kind: "wall", name: "크림 벽지", description: "따뜻한 크림톤으로 공간을 환하게 밝혀주는 벽지.", price: 40, fill: { type: "color", color: "#fef3c7" } },
  { id: "wall-mint", kind: "wall", name: "민트 벽지", description: "산뜻한 민트빛으로 청량감을 더하는 벽지.", price: 40, fill: { type: "color", color: "#d1fae5" } },
  // 이미지 패턴들. 전부 public/skins/*.svg (48×48 타일, 자동 반복).
  { id: "wall-dot", kind: "wall", name: "도트 패턴 벽지", description: "귀여운 도트 패턴이 규칙적으로 반복되는 벽지.", price: 60, fill: { type: "image", url: "/skins/wall-dot.svg" } },
  { id: "wall-stripe", kind: "wall", name: "스트라이프 벽지", description: "세로 스트라이프가 규칙적으로 반복되는 벽지.", price: 60, fill: { type: "image", url: "/skins/wall-stripe.svg" } },
  { id: "wall-check", kind: "wall", name: "체크 벽지", description: "귀여운 체크무늬가 반복되는 벽지.", price: 60, fill: { type: "image", url: "/skins/wall-check.svg" } },
];

// 채도 낮춘 무채색에 가까운 갈색 계열(타우프/모카 톤).
export const FLOOR_SKINS: Skin[] = [
  { id: "floor-oak", kind: "floor", name: "오크 바닥", description: "차분한 오크 원목 질감의 바닥재.", price: 40, fill: { type: "color", color: "#8b7d6b" } },
  { id: "floor-honey", kind: "floor", name: "허니 바닥", description: "부드러운 허니빛이 감도는 바닥재.", price: 40, fill: { type: "color", color: "#a89684" } },
  { id: "floor-walnut", kind: "floor", name: "월넛 바닥", description: "짙은 월넛톤으로 공간에 무게감을 더하는 바닥재.", price: 40, fill: { type: "color", color: "#5c4f45" } },
];
