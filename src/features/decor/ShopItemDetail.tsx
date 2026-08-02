import type { DecorEntry } from "@/features/decor/entries";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { skinFillStyle } from "@/features/decor/skins/skinFill";
import { useGameStore } from "@/store/useGameStore";

interface Props {
  entry: DecorEntry;
  onBack: () => void;
}

/**
 * 상점 상품 상세 화면. 그리드 카드를 누르면 즉시 구매되는 대신 여기로 진입해서,
 * 실제 구매 버튼을 눌러야만 재화가 차감된다. 가구는 재고 개념이라 재구매 제한이
 * 없고, 스킨은 이미 보유 중이면 구매 버튼이 "보유중"으로 바뀌며 비활성화된다.
 */
export default function ShopItemDetail({ entry, onBack }: Props) {
  const currency = useGameStore((s) => s.currency);
  const buyFurniture = useFurnitureStore((s) => s.buy);
  const buySkin = useDecorStore((s) => s.buySkin);
  const ownedWallSkins = useDecorStore((s) => s.ownedWallSkins);
  const ownedFloorSkins = useDecorStore((s) => s.ownedFloorSkins);

  const isOwnedSkin =
    entry.kind === "skin" &&
    (entry.item.kind === "wall" ? ownedWallSkins : ownedFloorSkins).includes(entry.item.id);
  const canAfford = currency >= entry.item.price;
  const buyDisabled = isOwnedSkin || !canAfford;

  function handleBuy() {
    if (entry.kind === "furniture") buyFurniture(entry.item.id);
    else buySkin(entry.item.kind, entry.item.id);
  }

  return (
    <div className="flex h-full w-full flex-col border-l border-modal-border bg-modal-surface-alt p-2">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-md px-2 py-1 text-xs text-modal-text-muted transition hover:bg-modal-surface-hover"
      >
        ✕ 닫기
      </button>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {entry.kind === "furniture" ? (
          <span className="text-5xl leading-none">{entry.item.icon}</span>
        ) : (
          <div
            className="h-16 w-16 rounded-md border border-modal-border"
            style={skinFillStyle(entry.item.fill)}
          />
        )}
        <h3 className="text-center text-sm font-semibold text-modal-text">{entry.item.name}</h3>
        <p className="max-w-full text-center text-[11px] text-modal-text-muted">{entry.item.description}</p>
      </div>
      <button
        type="button"
        disabled={buyDisabled}
        onClick={handleBuy}
        className={`rounded-md py-2 text-sm font-medium transition ${
          buyDisabled
            ? "cursor-not-allowed bg-modal-surface-hover text-modal-text-muted"
            : "bg-modal-accent text-modal-text hover:bg-modal-accent-hover"
        }`}
      >
        {isOwnedSkin ? "보유중" : `구매하기 🪙${entry.item.price}`}
      </button>
    </div>
  );
}
