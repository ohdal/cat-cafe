import type { FurnitureType, FurnitureTypeId, Zone } from "@/features/decor/furniture/types";

/** scene % rect [xMin,xMax]×[yMin,yMax] 안인지 판정하는 zone 빌더. */
const rectZone =
  (xMin: number, xMax: number, yMin: number, yMax: number): Zone =>
  (x, y) =>
    x >= xMin && x <= xMax && y >= yMin && y <= yMax;

// 가구가 배치될 수 있는 좌우 폭 (씬 좌우 여백 제외). 모든 타입이 공유하는 값이라 한 곳에서 관리.
const SCENE_X_MIN = 2;
const SCENE_X_MAX = 98;

/** 바닥 근처 배치 밴드 (책상/의자류). y 범위만 타입별로 다르게 지정. */
const floorZone = (yMin: number, yMax: number): Zone =>
  rectZone(SCENE_X_MIN, SCENE_X_MAX, yMin, yMax);

/** 벽 배치 밴드 (액자류, 바닥/공중 불가). */
const wallZone = (yMin: number, yMax: number): Zone =>
  rectZone(SCENE_X_MIN, SCENE_X_MAX, yMin, yMax);

export const CATALOG: Record<FurnitureTypeId, FurnitureType> = {
  desk: {
    id: "desk",
    name: "책상",
    icon: "🪵",
    description: "다과와 소품을 올려둘 수 있는 아늑한 원목 책상.",
    price: 50,
    size: { w: 14, h: 24 },
    zone: floorZone(72, 96),
  },
  chair: {
    id: "chair",
    name: "의자",
    icon: "🪑",
    description: "손님이 편히 앉아 쉴 수 있는 아늑한 의자.",
    price: 30,
    size: { w: 10, h: 20 },
    zone: floorZone(74, 98),
  },
  frame: {
    id: "frame",
    name: "액자",
    icon: "🖼️",
    description: "벽을 장식하는 아기자기한 액자.",
    price: 20,
    size: { w: 10, h: 14 },
    zone: wallZone(8, 55),
  },
};

export const CATALOG_LIST: FurnitureType[] = Object.values(CATALOG);
