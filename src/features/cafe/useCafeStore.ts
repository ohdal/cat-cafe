import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CAFE_EXPAND_COSTS } from "@/features/cafe/cafeCatalog";
import { CAFE_MAX_LEVEL } from "@/features/economy/formulas";
import { useGameStore } from "@/store/useGameStore";

interface CafeState {
  /** 현재 카페 레벨. 1 ~ CAFE_MAX_LEVEL. 메뉴 해금 게이트 + 손님 배수 + "해금된 최대 층"의 원천. */
  level: number;
  /** 지금 보고 있는 층. 1 ~ level. level(해금 진행도)과는 별개 개념. */
  currentFloor: number;
  /** 다음 레벨로 올리는 데 필요한 골드 비용. 이미 최대 레벨이면 null. */
  expandCost: () => number | null;
  /** 비용 충족 시 골드 차감 후 레벨+1. 최대 레벨이거나 잔액 부족이면 차감 없이 false. */
  expand: () => boolean;
  /** currentFloor를 옮긴다. 1 미만이거나 level보다 높으면(미해금) 거부하고 false. */
  goToFloor: (floor: number) => boolean;
  /** 카페 레벨(층 해금)·현재 층을 초기값으로 되돌린다. 설정의 "게임 전체 초기화" 버튼 전용. */
  reset: () => void;
}

/** 카페 레벨(확장) + 지금 보는 층 상태 (zustand + persist). */
export const useCafeStore = create<CafeState>()(
  persist(
    (set, get) => ({
      level: 1,
      currentFloor: 1,

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

      goToFloor: (floor) => {
        if (floor < 1 || floor > get().level) return false;
        set({ currentFloor: floor });
        return true;
      },

      reset: () => set({ level: 1, currentFloor: 1 }),
    }),
    {
      name: "cat-cafe-cafe-level",
      // currentFloor 추가로 데이터 모양이 바뀌어 다시 올림 (관례상 표시, 아래 partialize 참고).
      version: 2,
      partialize: (s) => ({ level: s.level, currentFloor: s.currentFloor }),
    },
  ),
);
