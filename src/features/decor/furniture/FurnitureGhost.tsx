import { CATALOG } from "@/features/decor/furniture/catalog";
import { isValidPlacement } from "@/features/decor/furniture/zone";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";

/**
 * 배치/재배치 중인 가구의 반투명 프리뷰. 마우스를 따라다니며, 유효영역이면
 * 정상 표시, 벗어나면 붉은 tint. z-index는 stackPos에 맞춰 겹치는 가구들
 * 사이의 정확한 위치에 끼워 보이도록 한다(PlacedFurniture는 짝수만 사용).
 */
export default function FurnitureGhost() {
  const placing = useFurnitureStore((s) => s.placing);
  if (!placing) return null;

  const type = CATALOG[placing.typeId];
  const valid = isValidPlacement(placing.typeId, placing.x, placing.y);

  return (
    <div
      className={`pointer-events-none absolute flex items-center justify-center rounded border-2 border-dashed text-2xl leading-none opacity-70 ${
        valid ? "border-white bg-[#7c5a2866]" : "border-red-300 bg-[#dc262666]"
      }`}
      style={{
        left: `${placing.x - type.size.w / 2}%`,
        top: `${placing.y - type.size.h}%`,
        width: `${type.size.w}%`,
        height: `${type.size.h}%`,
        zIndex: placing.stackPos * 2 + 1,
      }}
    >
      {type.icon}
    </div>
  );
}
