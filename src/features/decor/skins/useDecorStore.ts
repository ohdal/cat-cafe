import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WALL_SKINS, FLOOR_SKINS } from "@/features/decor/skins/catalog";
import { useGameStore } from "@/store/useGameStore";
import type { SkinKind } from "@/features/decor/skins/types";

const DEFAULT_WALL = WALL_SKINS[0].id;
const DEFAULT_FLOOR = FLOOR_SKINS[0].id;

interface DecorState {
  ownedWallSkins: string[];
  ownedFloorSkins: string[];
  activeWallSkin: string;
  activeFloorSkin: string;
  /**
   * 구매만 한다 (상점 전용). 이미 보유했다면 재구매·재장착 없이 그대로 false.
   * 잔액 부족 시에도 차감 없이 false.
   */
  buySkin: (kind: SkinKind, id: string) => boolean;
  /**
   * 이미 보유한 스킨을 장착한다 (꾸미기 전용). 미보유 스킨은 장착할 수 없고 false.
   */
  equipSkin: (kind: SkinKind, id: string) => boolean;
  /** 보유·장착 스킨을 기본 벽지/바닥으로 되돌린다. 설정의 "초기화" 버튼 전용. */
  reset: () => void;
}

/** 벽지/바닥 스킨 보유·장착 상태 (zustand + persist). */
export const useDecorStore = create<DecorState>()(
  persist(
    (set, get) => ({
      ownedWallSkins: [DEFAULT_WALL],
      ownedFloorSkins: [DEFAULT_FLOOR],
      activeWallSkin: DEFAULT_WALL,
      activeFloorSkin: DEFAULT_FLOOR,

      buySkin: (kind, id) => {
        const ownedKey = kind === "wall" ? "ownedWallSkins" : "ownedFloorSkins";
        const owned = get()[ownedKey];
        if (owned.includes(id)) return false; // 이미 보유 — 상점에서는 재구매/재장착 안 함

        const catalog = kind === "wall" ? WALL_SKINS : FLOOR_SKINS;
        const skin = catalog.find((s) => s.id === id);
        if (!skin) return false;
        if (!useGameStore.getState().spendCurrency(skin.price)) return false;

        set({ [ownedKey]: [...owned, id] } as Partial<DecorState>);
        return true;
      },

      equipSkin: (kind, id) => {
        const ownedKey = kind === "wall" ? "ownedWallSkins" : "ownedFloorSkins";
        const activeKey = kind === "wall" ? "activeWallSkin" : "activeFloorSkin";
        if (!get()[ownedKey].includes(id)) return false; // 미보유는 장착 불가

        set({ [activeKey]: id } as Partial<DecorState>);
        return true;
      },

      reset: () =>
        set({
          ownedWallSkins: [DEFAULT_WALL],
          ownedFloorSkins: [DEFAULT_FLOOR],
          activeWallSkin: DEFAULT_WALL,
          activeFloorSkin: DEFAULT_FLOOR,
        }),
    }),
    {
      name: "cat-cafe-decor",
      // selectSkin -> buySkin/equipSkin 분리로 액션 시그니처가 바뀌어 다시 올림
      // (persist는 데이터만 저장하므로 실제 영향은 없지만 관례상 표시).
      version: 2,
    },
  ),
);
