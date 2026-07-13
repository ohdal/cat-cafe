import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameState {
  /** 보유 재화. */
  currency: number;
  /** 재화 추가. */
  addCurrency: (amount: number) => void;
  /** 재화 사용. 잔액이 부족하면 차감하지 않고 false 반환. */
  spendCurrency: (amount: number) => boolean;
  /** 재화 값을 직접 설정. */
  setCurrency: (amount: number) => void;
}

/**
 * 게임 상태 스토어 (zustand + persist).
 *
 * 재화 외에 레벨·보유 고양이·스킨 등 게임 진행 상태를 여기에 확장합니다.
 * localStorage에 저장되어 앱을 껐다 켜도 유지됩니다. (단, 로컬 저장이라
 * 유저가 조작 가능 — 변조 방지가 필요한 재화는 나중에 Steam Inventory Service로.)
 *
 * 사용 예:
 *   const currency = useGameStore((s) => s.currency);
 *   const spend = useGameStore((s) => s.spendCurrency);
 *   if (spend(100)) { ... 구매 성공 ... }
 */
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currency: 0,
      addCurrency: (amount) => set((s) => ({ currency: s.currency + amount })),
      spendCurrency: (amount) => {
        if (get().currency < amount) return false;
        set((s) => ({ currency: s.currency - amount }));
        return true;
      },
      setCurrency: (amount) => set({ currency: amount }),
    }),
    {
      name: "cat-cafe-game",
      version: 1,
      // 데이터만 저장 (액션 함수는 제외).
      partialize: (s) => ({ currency: s.currency }),
    },
  ),
);
