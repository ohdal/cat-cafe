import { CATALOG_LIST } from "@/features/decor/furniture/catalog";
import type { FurnitureType, FurnitureTypeId } from "@/features/decor/furniture/types";
import { WALL_SKINS, FLOOR_SKINS } from "@/features/decor/skins/catalog";
import type { Skin } from "@/features/decor/skins/types";

/**
 * 상점/꾸미기가 공유하는 카테고리 탭 정의 + 항목 목록. 두 화면 모두 같은 4개
 * 탭(전체/벽지/바닥/가구)을 쓰지만, 셀을 렌더링하는 방식(구매 vs 배치·장착)은 다르다.
 */
export type DecorTab = "all" | "wall" | "floor" | "furniture";

export const DECOR_TABS: { id: DecorTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "wall", label: "벽지" },
  { id: "floor", label: "바닥" },
  { id: "furniture", label: "가구" },
];

export type DecorEntry =
  | { kind: "furniture"; item: FurnitureType }
  | { kind: "skin"; item: Skin };

const FURNITURE_ENTRIES: DecorEntry[] = CATALOG_LIST.map((item) => ({ kind: "furniture", item }));
const WALL_ENTRIES: DecorEntry[] = WALL_SKINS.map((item) => ({ kind: "skin", item }));
const FLOOR_ENTRIES: DecorEntry[] = FLOOR_SKINS.map((item) => ({ kind: "skin", item }));
const ALL_ENTRIES: DecorEntry[] = [...FURNITURE_ENTRIES, ...WALL_ENTRIES, ...FLOOR_ENTRIES];

export function entriesForDecorTab(tab: DecorTab): DecorEntry[] {
  switch (tab) {
    case "furniture":
      return FURNITURE_ENTRIES;
    case "wall":
      return WALL_ENTRIES;
    case "floor":
      return FLOOR_ENTRIES;
    case "all":
      return ALL_ENTRIES;
  }
}

/** 항목을 하나라도 보유했는지 판정. 상점(숨기기)과 꾸미기(보유만 노출) 둘 다 이 기준을 공유한다. */
export function isDecorEntryOwned(
  entry: DecorEntry,
  furnitureOwned: Partial<Record<FurnitureTypeId, number>>,
  ownedWallSkins: string[],
  ownedFloorSkins: string[],
): boolean {
  if (entry.kind === "furniture") return (furnitureOwned[entry.item.id] ?? 0) > 0;
  const ownedList = entry.item.kind === "wall" ? ownedWallSkins : ownedFloorSkins;
  return ownedList.includes(entry.item.id);
}
