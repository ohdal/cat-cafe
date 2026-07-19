import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { useGameStore } from "@/store/useGameStore";
import { skinFillStyle } from "@/features/decor/skins/skinFill";
import type { Skin } from "@/features/decor/skins/types";

interface Props {
  skin: Skin;
}

/**
 * 상점 색상 스와치 셀. 구매 전용 — 클릭하면 구매(재화 차감 + 보유 처리)만 하고
 * 장착은 하지 않는다. 이미 보유한 스킨은 비활성화("보유" 표시만, 재구매/재장착 불가).
 * 장착은 꾸미기 탭(EquipSlot)에서 한다.
 */
export default function SkinShopItem({ skin }: Props) {
  const buySkin = useDecorStore((s) => s.buySkin);
  const isOwned = useDecorStore((s) =>
    (skin.kind === "wall" ? s.ownedWallSkins : s.ownedFloorSkins).includes(skin.id),
  );
  const currency = useGameStore((s) => s.currency);
  const canBuy = !isOwned && currency >= skin.price;

  return (
    <button
      type="button"
      disabled={!canBuy}
      onClick={() => buySkin(skin.kind, skin.id)}
      title={skin.name}
      style={skinFillStyle(skin.fill)}
      className={`relative h-full w-full rounded-md transition ${
        canBuy ? "hover:brightness-110" : "cursor-not-allowed opacity-40"
      }`}
    >
      <span className="absolute bottom-1 right-1 rounded bg-[#00000099] px-1 text-[9px] leading-tight text-white">
        {isOwned ? "보유" : `🪙${skin.price}`}
      </span>
    </button>
  );
}
