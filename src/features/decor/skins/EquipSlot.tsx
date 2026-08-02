import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { skinFillStyle } from "@/features/decor/skins/skinFill";
import type { Skin } from "@/features/decor/skins/types";

interface Props {
  skin: Skin;
}

/**
 * 꾸미기 탭의 벽지/바닥 장착 셀. 이미 보유한 스킨만 클릭해서 장착할 수 있고,
 * 미보유 스킨은 비활성화("미보유" 표시) — 구매는 상점(SkinShopItem)에서 한다.
 * 현재 장착 중인 스킨은 ::after 테두리로 표시.
 */
export default function EquipSlot({ skin }: Props) {
  const equipSkin = useDecorStore((s) => s.equipSkin);
  const isOwned = useDecorStore((s) =>
    (skin.kind === "wall" ? s.ownedWallSkins : s.ownedFloorSkins).includes(skin.id),
  );
  const isActive = useDecorStore((s) =>
    (skin.kind === "wall" ? s.activeWallSkin : s.activeFloorSkin) === skin.id,
  );

  return (
    <button
      type="button"
      disabled={!isOwned}
      onClick={() => equipSkin(skin.kind, skin.id)}
      title={skin.name}
      style={skinFillStyle(skin.fill)}
      className={`relative h-full w-full rounded-md transition ${
        isOwned ? "hover:brightness-110" : "cursor-not-allowed opacity-40"
      } ${
        isActive
          ? "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-modal-accent after:content-['']"
          : ""
      }`}
    >
      {!isOwned && (
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-[rgba(0,0,0,0.6)] px-1 text-[9px] leading-tight text-white">
          미보유
        </span>
      )}
    </button>
  );
}
