import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { skinFillStyle } from "@/features/decor/skins/skinFill";
import type { Skin } from "@/features/decor/skins/types";

interface Props {
  skin: Skin;
  onSelect: () => void;
}

/**
 * 상점 색상 스와치 셀. 클릭하면 구매하지 않고 상세 화면을 연다(구매는 상세
 * 화면의 구매하기 버튼에서). 이미 보유한 스킨은 "보유" 표시만 하고 계속 클릭 가능
 * (상세 화면에서 확인 가능 — 다만 재구매는 막힘). 장착은 꾸미기 탭(EquipSlot)에서 한다.
 */
export default function SkinShopItem({ skin, onSelect }: Props) {
  const isOwned = useDecorStore((s) =>
    (skin.kind === "wall" ? s.ownedWallSkins : s.ownedFloorSkins).includes(skin.id),
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      title={skin.name}
      style={skinFillStyle(skin.fill)}
      className={`relative h-full w-full rounded-md transition hover:brightness-110 ${
        isOwned ? "opacity-40" : ""
      }`}
    >
      <span className="absolute bottom-1 right-1 rounded bg-[rgba(0,0,0,0.6)] px-1 text-[9px] leading-tight text-white">
        {isOwned ? "보유" : `🪙${skin.price}`}
      </span>
    </button>
  );
}
