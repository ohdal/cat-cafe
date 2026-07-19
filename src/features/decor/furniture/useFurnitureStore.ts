import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CATALOG } from "@/features/decor/furniture/catalog";
import { isValidPlacement } from "@/features/decor/furniture/zone";
import { useGameStore } from "@/store/useGameStore";
import type { FurnitureTypeId, PlacedFurniture } from "@/features/decor/furniture/types";

let idCounter = 0;
const newId = () => `f${Date.now().toString(36)}${(idCounter++).toString(36)}`;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** base(밑변 중앙) 기준 가구 bbox (scene %). */
function bboxOf(typeId: FurnitureTypeId, x: number, y: number): Box {
  const { w, h } = CATALOG[typeId].size;
  return { left: x - w / 2, right: x + w / 2, top: y - h, bottom: y };
}
const intersects = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

interface Placing {
  typeId: FurnitureTypeId;
  instanceId?: string; // 재배치면 존재
  x: number; // 현재 ghost 위치 %
  y: number;
  stackPos: number; // placed 삽입 index (0 = 맨 뒤 … length = 맨 앞)
  origin?: { x: number; y: number; index: number }; // 재배치 취소 복원용
}

interface FurnitureState {
  placed: PlacedFurniture[];
  placing: Placing | null;
  /** 타입별 보유 수량. 상점에서 구매하면 늘어나고, 배치 가능 개수의 상한이 된다. */
  owned: Partial<Record<FurnitureTypeId, number>>;
  /**
   * 배치 모드 on/off. 꺼져 있으면(기본값) 카페 씬에서 배치된 가구를 클릭해도
   * 재배치가 시작되지 않고, 인벤토리에서도 새 배치를 시작할 수 없다 — 평소
   * 카페를 구경하다 실수로 재배치/삭제되는 걸 막기 위한 명시적 게이트.
   * 게임 데이터가 아니라 세션 UI 상태라 persist하지 않는다(매 실행 시 OFF로 시작).
   */
  placementMode: boolean;
  setPlacementMode: (on: boolean) => void;

  startPlacing: (typeId: FurnitureTypeId, instanceId?: string) => void;
  setPlacingPos: (x: number, y: number) => void;
  cyclePlacingZ: (dir: 1 | -1) => void;
  commitPlacing: () => void;
  cancelPlacing: () => void;
  removePlacing: () => void;
  /** 재화를 차감하고 보유 수량을 늘린다. 잔액 부족하면 차감 없이 false. */
  buy: (typeId: FurnitureTypeId) => boolean;
}

/**
 * 가구 배치 상태 (zustand + persist).
 * z-order = placed 배열 순서(index 0 = 맨 뒤 … 마지막 = 맨 앞). placed만 localStorage 저장.
 */
export const useFurnitureStore = create<FurnitureState>()(
  persist(
    (set, get) => ({
      placed: [],
      placing: null,
      owned: {},
      placementMode: false,
      setPlacementMode: (on) => set({ placementMode: on }),

      startPlacing: (typeId, instanceId) => {
        // 배치 모드가 꺼져 있으면 신규 배치도 재배치도 시작할 수 없다.
        if (!get().placementMode) return;
        // 이미 뭔가 배치/재배치 중이면 덮어쓰지 않는다 (덮어쓰면 재배치 중이던
        // 원본 데이터가 유실됨 — origin이 placing에만 있고 placed엔 없으므로).
        if (get().placing) return;

        if (instanceId) {
          // 재배치: 원본을 목록에서 빼서 숨김 (취소 시 복원)
          const index = get().placed.findIndex((p) => p.instanceId === instanceId);
          if (index < 0) return;
          const item = get().placed[index];
          set({
            placed: get().placed.filter((p) => p.instanceId !== instanceId),
            placing: {
              typeId: item.typeId,
              instanceId,
              x: item.x,
              y: item.y,
              stackPos: index,
              origin: { x: item.x, y: item.y, index },
            },
          });
        } else {
          // 신규 배치: 보유 수량 - 이미 배치된 개수 = 배치 가능 수량이 있어야 한다.
          const owned = get().owned[typeId] ?? 0;
          const placedCount = get().placed.filter((p) => p.typeId === typeId).length;
          if (placedCount >= owned) return; // 재고 없음
          set({ placing: { typeId, x: 50, y: 85, stackPos: get().placed.length } });
        }
      },

      setPlacingPos: (x, y) =>
        set((s) => (s.placing ? { placing: { ...s.placing, x, y } } : {})),

      // 스크롤: 지금 ghost와 겹치는 가구만 대상으로 한 칸 앞/뒤. 안 겹치면 무시.
      cyclePlacingZ: (dir) => {
        const p = get().placing;
        if (!p) return;
        const pb = bboxOf(p.typeId, p.x, p.y);
        const overlapping = get()
          .placed.map((it, i) => ({ i, box: bboxOf(it.typeId, it.x, it.y) }))
          .filter((o) => intersects(pb, o.box))
          .map((o) => o.i);
        if (overlapping.length === 0) return;

        let pos = p.stackPos;
        if (dir === 1) {
          const next = overlapping.find((i) => i >= pos); // 앞쪽 겹침
          if (next === undefined) return;
          pos = next + 1;
        } else {
          const prev = [...overlapping].reverse().find((i) => i < pos); // 뒤쪽 겹침
          if (prev === undefined) return;
          pos = prev;
        }
        set({ placing: { ...p, stackPos: pos } });
      },

      commitPlacing: () => {
        const p = get().placing;
        if (!p) return;
        if (!isValidPlacement(p.typeId, p.x, p.y)) return; // 무효영역이면 배치 안 함(유지)
        const item: PlacedFurniture = {
          instanceId: p.instanceId ?? newId(),
          typeId: p.typeId,
          x: p.x,
          y: p.y,
        };
        const placed = [...get().placed];
        placed.splice(Math.max(0, Math.min(p.stackPos, placed.length)), 0, item);
        set({ placed, placing: null });
      },

      cancelPlacing: () => {
        const p = get().placing;
        if (!p) return;
        if (p.instanceId && p.origin) {
          // 재배치 취소 → 원위치 복원
          const placed = [...get().placed];
          placed.splice(p.origin.index, 0, {
            instanceId: p.instanceId,
            typeId: p.typeId,
            x: p.origin.x,
            y: p.origin.y,
          });
          set({ placed, placing: null });
        } else {
          set({ placing: null });
        }
      },

      // 배치/재배치 중인 가구를 원위치 복원 없이 그대로 버린다. 재배치 중이던 가구는
      // startPlacing 시 이미 placed에서 빠져있으므로, 다시 넣지 않으면 그대로 삭제된다.
      // (신규 배치 중이던 거면 애초에 placed에 없었으니 취소와 동일한 효과.)
      removePlacing: () => set({ placing: null }),

      buy: (typeId) => {
        const price = CATALOG[typeId].price;
        if (!useGameStore.getState().spendCurrency(price)) return false;
        set((s) => ({ owned: { ...s.owned, [typeId]: (s.owned[typeId] ?? 0) + 1 } }));
        return true;
      },
    }),
    {
      name: "cat-cafe-furniture",
      // 타입당 1개 규칙 폐기 + 보유수량(owned) 도입으로 데이터 모양이 바뀌어 다시 올림.
      // migrate 없이 버전만 바꾸면 zustand persist가 기존 저장값을 버리고 초기 상태로 시작한다.
      version: 3,
      partialize: (s) => ({ placed: s.placed, owned: s.owned }),
    },
  ),
);
