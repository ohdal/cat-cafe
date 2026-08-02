import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CAFE_EXPAND_COSTS } from "@/features/cafe/cafeCatalog";
import { CAFE_MAX_LEVEL } from "@/features/economy/formulas";
import { useGameStore } from "@/store/useGameStore";

interface CafeState {
  /** 현재 카페 레벨. 1 ~ CAFE_MAX_LEVEL. 메뉴 해금 게이트 + 손님 배수의 원천. */
  level: number;
  /** 다음 레벨로 올리는 데 필요한 골드 비용. 이미 최대 레벨이면 null. */
  expandCost: () => number | null;
  /** 비용 충족 시 골드 차감 후 레벨+1. 최대 레벨이거나 잔액 부족이면 차감 없이 false. */
  expand: () => boolean;
}

/** 카페 레벨(확장) 상태 (zustand + persist). */
export const useCafeStore = create<CafeState>()(
  persist(
    (set, get) => ({
      level: 1,

      expandCost: () => {
        const level = get().level;
        if (level >= CAFE_MAX_LEVEL) return null;
        return CAFE_EXPAND_COSTS[level - 1];
      },

      expand: () => {
        const cost = get().expandCost();
        if (cost === null) return false;
        if (!useGameStore.getState().spendCurrency(cost)) return false;
        set((s) => ({ level: s.level + 1 }));
        return true;
      },
    }),
    {
      name: "cat-cafe-cafe-level",
      version: 1,
      partialize: (s) => ({ level: s.level }),
    },
  ),
);
