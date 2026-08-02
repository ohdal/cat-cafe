import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MENU_LIST } from "@/features/menu/catalog";
import { isMenuUnlocked } from "@/features/menu/menuSelectors";
import { MAX_MENU_LEVEL, menuIncomePerHour, upgradeCost } from "@/features/economy/formulas";
import { useCafeStore } from "@/features/cafe/useCafeStore";
import { useGameStore } from "@/store/useGameStore";

interface MenuState {
  /** 메뉴 id → 레벨. 없으면 0(기본). */
  levels: Record<string, number>;
  levelOf: (id: string) => number;
  incomeOf: (id: string) => number;
  upgradeCostOf: (id: string) => number;
  /** 해금 + 잔액 충족 + 최대레벨 미만일 때만 골드 차감 후 레벨+1. */
  upgrade: (id: string) => boolean;
  /** 모든 메뉴 레벨을 0으로 되돌린다. 설정의 "초기화" 버튼 전용. */
  reset: () => void;
}

/** 메뉴별 레벨 진행 상태 (zustand + persist). 해금 여부는 useCafeStore.level로 파생 — 중복 저장 안 함. */
export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      levels: {},

      levelOf: (id) => get().levels[id] ?? 0,

      incomeOf: (id) => {
        const menu = MENU_LIST.find((m) => m.id === id);
        if (!menu) return 0;
        return menuIncomePerHour(menu.baseIncomePerHour, get().levelOf(id));
      },

      upgradeCostOf: (id) => {
        const menu = MENU_LIST.find((m) => m.id === id);
        if (!menu) return 0;
        return upgradeCost(menu.baseIncomePerHour, get().levelOf(id));
      },

      upgrade: (id) => {
        const menu = MENU_LIST.find((m) => m.id === id);
        if (!menu) return false;

        const cafeLevel = useCafeStore.getState().level;
        if (!isMenuUnlocked(menu, cafeLevel)) return false;

        const level = get().levelOf(id);
        if (level >= MAX_MENU_LEVEL) return false;

        const cost = upgradeCost(menu.baseIncomePerHour, level);
        if (!useGameStore.getState().spendCurrency(cost)) return false;

        set((s) => ({ levels: { ...s.levels, [id]: level + 1 } }));
        return true;
      },

      reset: () => set({ levels: {} }),
    }),
    {
      name: "cat-cafe-menu",
      version: 1,
      partialize: (s) => ({ levels: s.levels }),
    },
  ),
);
