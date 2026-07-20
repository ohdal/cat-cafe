import Tooltip from "@/components/Tooltip";
import type { FurnitureType } from "@/features/decor/furniture/types";
import { useGameStore } from "@/store/useGameStore";

interface Props {
  type: FurnitureType;
  onSelect: () => void;
}

/**
 * 상점 셀: 아이콘 + 우측 하단 가격 배지. 클릭하면 구매하지 않고 상세 화면을 연다.
 * 보유 수량 표시는 인벤토리 쪽(InventorySlot)의 역할이라 여기선 항상 가격만 보여준다.
 */
export default function ShopItem({ type, onSelect }: Props) {
  const currency = useGameStore((s) => s.currency);
  const canAfford = currency >= type.price;

  return (
    <Tooltip label={`${type.name} · 🪙${type.price}`}>
      <button
        type="button"
        onClick={onSelect}
        className={`relative flex h-full w-full items-center justify-center rounded-md text-lg transition ${
          canAfford ? "bg-[#ffffff0d] hover:bg-[#ffffff1a]" : "bg-[#ffffff0d] opacity-40 hover:bg-[#ffffff1a]"
        }`}
      >
        <span>{type.icon}</span>
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-[#00000099] px-1 text-[9px] leading-tight text-white">
          🪙{type.price}
        </span>
      </button>
    </Tooltip>
  );
}
