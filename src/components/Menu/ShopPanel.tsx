import { useEffect, useState } from "react";
import ShopItem from "@/features/decor/furniture/ShopItem";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import SkinShopItem from "@/features/decor/skins/SkinShopItem";
import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import {
  entriesForDecorTab,
  isDecorEntryOwned,
  type DecorEntry,
  type DecorTab,
} from "@/features/decor/entries";
import DecorTabBar from "@/features/decor/DecorTabBar";
import ShopItemDetail from "@/features/decor/ShopItemDetail";
import Empty from "@/components/Empty";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import { PANEL_PADDING } from "@/components/Menu/panelStyles";

const SLIDE_MS = 300;

/**
 * 상점: 전체/벽지/바닥/가구 서브탭으로 나눠서, 고른 탭의 아이템만 5×3 그리드로 진열.
 * 여기서는 구매만 한다 — 이미 보유한 벽지/바닥을 바꿔 장착하는 건 꾸미기 탭의 역할.
 * 카드를 누르면 바로 구매되지 않고, 우→좌로 슬라이드되는 상세 화면(ShopItemDetail)이
 * 열리고 실제 구매는 그 안의 구매하기 버튼에서만 일어난다.
 */
export default function ShopPanel() {
  const [tab, setTab] = useState<DecorTab>("all");
  const [hideOwned, setHideOwned] = useState(false);

  // displayed: 슬라이드 애니메이션 중에도 내용이 유지되도록 닫힘 애니메이션이
  // 끝난 뒤에야 null로 비움. open: 실제 translate 상태를 트리거하는 값.
  const [displayed, setDisplayed] = useState<DecorEntry | null>(null);
  const [open, setOpen] = useState(false);

  const furnitureOwned = useFurnitureStore((s) => s.owned);
  const ownedWallSkins = useDecorStore((s) => s.ownedWallSkins);
  const ownedFloorSkins = useDecorStore((s) => s.ownedFloorSkins);

  const entries = entriesForDecorTab(tab).filter(
    (entry) =>
      !hideOwned || !isDecorEntryOwned(entry, furnitureOwned, ownedWallSkins, ownedFloorSkins),
  );

  // displayed가 새로 채워진 다음 프레임에 open을 true로 바꿔야 translate가
  // full -> 0으로 실제 트랜지션되며 슬라이드된다(같은 렌더에서 열면 애니메이션 없이 바로 뜸).
  useEffect(() => {
    if (!displayed) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [displayed]);

  function openDetail(entry: DecorEntry) {
    setDisplayed(entry);
  }
  function closeDetail() {
    setOpen(false);
    window.setTimeout(() => setDisplayed(null), SLIDE_MS);
  }

  return (
    <div className={`flex h-full flex-col ${PANEL_PADDING}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DecorTabBar tab={tab} onChange={setTab} />
        <CurrencyDisplay />
      </div>
      <div className="mb-2 flex justify-end">
        <label className="flex items-center gap-1 text-[11px] text-modal-text-muted">
          <input
            type="checkbox"
            checked={hideOwned}
            onChange={(e) => setHideOwned(e.target.checked)}
          />
          보유상품 숨기기
        </label>
      </div>
      <div className="flex min-h-0 flex-1 gap-1.5">
        {entries.length === 0 ? (
          <div className="min-w-0 flex-1">
            <Empty />
          </div>
        ) : (
          <div
            className={`no-scrollbar grid min-w-0 flex-1 auto-rows-22.5 gap-1.5 overflow-y-auto ${
              displayed ? "grid-cols-3" : "grid-cols-5"
            }`}
          >
            {entries.map((entry) =>
              entry.kind === "furniture" ? (
                <ShopItem
                  key={`f-${entry.item.id}`}
                  type={entry.item}
                  onSelect={() => openDetail(entry)}
                />
              ) : (
                <SkinShopItem
                  key={`s-${entry.item.id}`}
                  skin={entry.item}
                  onSelect={() => openDetail(entry)}
                />
              ),
            )}
          </div>
        )}
        {displayed && (
          <div className="w-2/5 shrink-0 overflow-hidden">
            <div
              className={`h-full w-full transition-transform duration-300 ease-out ${
                open ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <ShopItemDetail entry={displayed} onBack={closeDetail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
