import { useEffect, useState } from "react";
import InventorySlot from "@/features/decor/furniture/InventorySlot";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import EquipSlot from "@/features/decor/skins/EquipSlot";
import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { entriesForDecorTab, isDecorEntryOwned, type DecorTab } from "@/features/decor/entries";
import DecorTabBar from "@/features/decor/DecorTabBar";
import Empty from "@/components/Empty";
import { PANEL_PADDING } from "@/components/Menu/panelStyles";

/**
 * 꾸미기: 전체/벽지/바닥/가구 서브탭. 보유하지 않은 항목은 아예 노출하지 않는다
 * (미보유 상품을 보여주고 구매까지 유도하는 건 상점의 역할).
 * 가구 탭은 배치용 인벤토리(InventorySlot, 클릭 시 배치 모드 진입), 벽지/바닥 탭은
 * 보유한 스킨 중 장착(EquipSlot, 클릭 시 즉시 장착).
 * 우측 상단의 배치 모드 토글이 꺼져 있으면 카페 씬에서 가구 클릭이 전부 무시된다
 * (평소엔 그냥 구경만, 명시적으로 켜야 재배치/신규배치가 가능).
 */
export default function FurniturePanel() {
  const [tab, setTab] = useState<DecorTab>("all");

  const placementMode = useFurnitureStore((s) => s.placementMode);
  const setPlacementMode = useFurnitureStore((s) => s.setPlacementMode);
  const placing = useFurnitureStore((s) => s.placing);
  const cancelPlacing = useFurnitureStore((s) => s.cancelPlacing);

  const furnitureOwned = useFurnitureStore((s) => s.owned);
  const ownedWallSkins = useDecorStore((s) => s.ownedWallSkins);
  const ownedFloorSkins = useDecorStore((s) => s.ownedFloorSkins);

  const entries = entriesForDecorTab(tab).filter((entry) =>
    isDecorEntryOwned(entry, furnitureOwned, ownedWallSkins, ownedFloorSkins),
  );

  // 다른 카테고리 탭으로 옮기거나 MainMenu 자체가 닫히면 이 컴포넌트가 언마운트되므로,
  // 그 클린업 한 번으로 두 경우 다 커버해서 배치 모드를 자동으로 끈다(진행 중이던
  // 배치는 삭제가 아니라 취소 — 원위치로 복원).
  useEffect(() => {
    return () => {
      const store = useFurnitureStore.getState();
      if (store.placing) store.cancelPlacing();
      store.setPlacementMode(false);
    };
  }, []);

  function toggleMode() {
    const next = !placementMode;
    if (!next && placing) cancelPlacing(); // 모드 끌 때 진행 중이던 배치는 취소(원위치 복원)
    setPlacementMode(next);
  }

  return (
    <div className={`flex h-full flex-col ${PANEL_PADDING}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <DecorTabBar tab={tab} onChange={setTab} />
        <button
          type="button"
          onClick={toggleMode}
          aria-pressed={placementMode}
          className={`relative rounded-md px-2 py-1 text-xs transition ${
            placementMode
              ? "bg-amber-600 text-white after:absolute after:inset-0 after:rounded-md after:border-2 after:border-amber-200 after:content-['']"
              : "bg-[#ffffff1a] text-slate-200 hover:bg-[#ffffff26]"
          }`}
        >
          배치모드 {placementMode ? "ON" : "OFF"}
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="min-h-0 flex-1">
          <Empty />
        </div>
      ) : (
        <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-5 auto-rows-22.5 gap-1.5 overflow-y-auto">
          {entries.map((entry) =>
            entry.kind === "furniture" ? (
              <InventorySlot key={`f-${entry.item.id}`} type={entry.item} />
            ) : (
              <EquipSlot key={`s-${entry.item.id}`} skin={entry.item} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
