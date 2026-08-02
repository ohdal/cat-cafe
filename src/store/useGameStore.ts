import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_OFFLINE_HOURS, STARTING_GOLD } from "@/features/economy/formulas";

interface GameState {
  /** 보유 재화. 내부적으로 소수까지 누적 — 표시할 때만 Math.floor. */
  currency: number;
  /** 재화 추가. */
  addCurrency: (amount: number) => void;
  /** 재화 사용. 잔액이 부족하면 차감하지 않고 false 반환. */
  spendCurrency: (amount: number) => boolean;
  /** 재화 값을 직접 설정. */
  setCurrency: (amount: number) => void;
  /** 재화를 초기값(STARTING_GOLD)으로 되돌린다. 설정의 "초기화" 버튼 전용. */
  resetCurrency: () => void;

  /**
   * 오프라인 정산용 필드. 기능 자체는 아직 꺼져 있지만(OFFLINE_EARNINGS_ENABLED=false),
   * 나중에 켤 때 persist version을 다시 안 올려도 되도록 스키마를 미리 확정해 둔다.
   */
  lastSeenAt: number;
  goldPerHourAtSave: number;
  /** 저장 시점 스냅샷 갱신. */
  markSeen: (goldPerHour: number) => void;
  /** 마지막 스냅샷 기준으로 경과 시간만큼(상한 적용) 골드를 지급하고 지급량을 반환. */
  settleOffline: () => number;
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
      currency: STARTING_GOLD,
      addCurrency: (amount) => set((s) => ({ currency: s.currency + amount })),
      spendCurrency: (amount) => {
        if (get().currency < amount) return false;
        set((s) => ({ currency: s.currency - amount }));
        return true;
      },
      setCurrency: (amount) => set({ currency: amount }),
      resetCurrency: () => set({ currency: STARTING_GOLD, lastSeenAt: Date.now(), goldPerHourAtSave: 0 }),

      lastSeenAt: Date.now(),
      goldPerHourAtSave: 0,
      markSeen: (goldPerHour) => set({ lastSeenAt: Date.now(), goldPerHourAtSave: goldPerHour }),
      settleOffline: () => {
        const { lastSeenAt, goldPerHourAtSave, addCurrency } = get();
        const elapsedSec = Math.min(
          Math.max((Date.now() - lastSeenAt) / 1000, 0),
          MAX_OFFLINE_HOURS * 3600,
        );
        const offlineGold = (goldPerHourAtSave / 3600) * elapsedSec;
        if (offlineGold > 0) addCurrency(offlineGold);
        return offlineGold;
      },
    }),
    {
      name: "cat-cafe-game",
      // 버전 올려서 기존 저장된 재화 값을 무시하고 새 초기값(STARTING_GOLD)으로 리셋.
      version: 4,
      // 데이터만 저장 (액션 함수는 제외).
      partialize: (s) => ({
        currency: s.currency,
        lastSeenAt: s.lastSeenAt,
        goldPerHourAtSave: s.goldPerHourAtSave,
      }),
    },
  ),
);
