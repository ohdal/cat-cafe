import { CATALOG } from "@/features/decor/furniture/catalog";
import type { FurnitureTypeId } from "@/features/decor/furniture/types";

/**
 * 가구 base(x,y%)가 해당 type의 배치 가능 영역 안인지 판정.
 * ghost의 유효/무효 표시와 commit 검증에서 같은 함수를 사용해 규칙을 단일화한다.
 */
export function isValidPlacement(typeId: FurnitureTypeId, x: number, y: number): boolean {
  return CATALOG[typeId].zone(x, y);
}
