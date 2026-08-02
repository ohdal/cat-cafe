import { MENU_LIST } from "@/features/menu/catalog";
import type { MenuItem } from "@/features/menu/types";
import { menuIncomePerHour } from "@/features/economy/formulas";
import { useCafeStore } from "@/features/cafe/useCafeStore";
import { useMenuStore } from "@/features/menu/useMenuStore";

/** 카페 레벨이 메뉴 해금 층 이상이면 해금(수익 기여). */
export const isMenuUnlocked = (menu: MenuItem, cafeLevel: number) => menu.floor <= cafeLevel;

/** 층(floor) 오름차순 = 해금된 메뉴가 자연히 먼저 오는 정렬. CafeMenuPanel 리스트 순서로 그대로 쓴다. */
export const selectMenusByFloor = () => [...MENU_LIST].sort((a, b) => a.floor - b.floor);

export const selectUnlockedMenus = (cafeLevel: number) =>
  MENU_LIST.filter((m) => isMenuUnlocked(m, cafeLevel));

/** 해금된 메뉴들의 시간당 수익 합. cafeLevel·levels가 바뀔 때만 재계산(리렌더)된다. */
export const useSumMenuIncome = () => {
  const cafeLevel = useCafeStore((s) => s.level);
  const levels = useMenuStore((s) => s.levels);
  return selectUnlockedMenus(cafeLevel).reduce(
    (sum, m) => sum + menuIncomePerHour(m.baseIncomePerHour, levels[m.id] ?? 0),
    0,
  );
};
