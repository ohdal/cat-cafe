import { useState } from "react";
import ShopItem from "@/features/decor/furniture/ShopItem";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import SkinShopItem from "@/features/decor/skins/SkinShopItem";
import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { entriesForDecorTab, isDecorEntryOwned, type DecorTab } from "@/features/decor/entries";
import DecorTabBar from "@/features/decor/DecorTabBar";
import Empty from "@/components/Empty";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { useGameStore } from "@/store/useGameStore";
import { PANEL_PADDING } from "@/components/Menu/panelStyles";

/**
 * 상점: 전체/벽지/바닥/가구 서브탭으로 나눠서, 고른 탭의 아이템만 5×3 그리드로 진열.
 * 여기서는 구매만 한다 — 이미 보유한 벽지/바닥을 바꿔 장착하는 건 꾸미기 탭의 역할.
 */
export default function ShopPanel() {
  const [tab, setTab] = useState<DecorTab>("all");
  const [hideOwned, setHideOwned] = useState(false);

  const currency = useGameStore((s) => s.currency);
  const furnitureOwned = useFurnitureStore((s) => s.owned);
  const ownedWallSkins = useDecorStore((s) => s.ownedWallSkins);
  const ownedFloorSkins = useDecorStore((s) => s.ownedFloorSkins);

  const entries = entriesForDecorTab(tab).filter(
    (entry) =>
      !hideOwned || !isDecorEntryOwned(entry, furnitureOwned, ownedWallSkins, ownedFloorSkins),
  );

  return (
    <div className={PANEL_PADDING}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DecorTabBar tab={tab} onChange={setTab} />
        <CurrencyDisplay amount={currency} />
      </div>
      <div className="mb-2 flex justify-end">
        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={hideOwned}
            onChange={(e) => setHideOwned(e.target.checked)}
          />
          보유상품 숨기기
        </label>
      </div>
      {entries.length === 0 ? (
        <div className="h-72">
          <Empty />
        </div>
      ) : (
        <div className="grid h-72 grid-cols-5 grid-rows-3 gap-1.5 overflow-y-auto">
          {entries.map((entry) =>
            entry.kind === "furniture" ? (
              <ShopItem key={`f-${entry.item.id}`} type={entry.item} />
            ) : (
              <SkinShopItem key={`s-${entry.item.id}`} skin={entry.item} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
