import Tooltip from "@/components/Tooltip";
import type { FurnitureType } from "@/features/decor/furniture/types";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";

interface Props {
  type: FurnitureType;
}

/**
 * 인벤토리 셀: 아이콘 + 이름/보유수량 툴팁 + 배치중(점선 테두리) + 우측 하단 배치 가능 수량 배지.
 * 배치 가능 수량 = 보유(owned) - 이미 배치된 개수. 0이거나 다른 가구를 배치 중이면 비활성화.
 * 상점 셀(ShopItem)과 달리 여기는 항상 "몇 개 더 놓을 수 있는지"를 보여준다.
 * 배치 모드와 무관하게 항상 클릭 가능 — 꺼져 있을 때 클릭하면 자동으로 켠 뒤 배치를 시작한다.
 */
export default function InventorySlot({ type }: Props) {
  const startPlacing = useFurnitureStore((s) => s.startPlacing);
  const placementMode = useFurnitureStore((s) => s.placementMode);
  const setPlacementMode = useFurnitureStore((s) => s.setPlacementMode);
  const isAnyPlacing = useFurnitureStore((s) => !!s.placing);
  const isPlacingThis = useFurnitureStore((s) => s.placing?.typeId === type.id);
  const owned = useFurnitureStore((s) => s.owned[type.id] ?? 0);
  const placedCount = useFurnitureStore(
    (s) => s.placed.filter((p) => p.typeId === type.id).length,
  );
  const available = owned - placedCount;
  const disabled = isAnyPlacing || available <= 0;

  return (
    <Tooltip label={`${type.name} · 보유 ${owned}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!placementMode) setPlacementMode(true);
          startPlacing(type.id);
        }}
        className={`relative flex h-full w-full items-center justify-center rounded-md text-lg transition ${
          disabled ? "cursor-not-allowed bg-[#ffffff0d] opacity-40" : "bg-[#ffffff0d] hover:bg-[#ffffff1a]"
        } ${
          isPlacingThis
            ? "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-dashed after:border-amber-500 after:content-['']"
            : ""
        }`}
      >
        {type.icon}
        <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-[#00000099] px-1 text-[9px] leading-tight text-white">
          ×{available}
        </span>
      </button>
    </Tooltip>
  );
}
