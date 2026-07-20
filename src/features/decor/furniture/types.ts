export type FurnitureTypeId = "desk" | "chair" | "frame";

/** scene % 좌표(x,y)가 배치 가능 영역인지 판정하는 predicate. base(밑변 중앙) 기준. */
export type Zone = (xPct: number, yPct: number) => boolean;

export interface FurnitureType {
  id: FurnitureTypeId;
  name: string; // 툴팁/표시용
  icon: string; // 인벤토리 아이콘 (임시 이모지, 이후 Rive/이미지)
  description: string; // 상점 상세 화면 설명
  price: number; // 상점 구매 가격 (재화)
  size: { w: number; h: number }; // 배치 크기 (scene %)
  zone: Zone; // 배치 가능 영역
}

export interface PlacedFurniture {
  instanceId: string;
  typeId: FurnitureTypeId;
  x: number; // scene % (0~100), base(밑변 중앙) 기준
  y: number;
}
