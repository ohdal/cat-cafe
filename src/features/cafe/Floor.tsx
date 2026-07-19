import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { FLOOR_SKINS } from "@/features/decor/skins/catalog";
import { skinFillStyle } from "@/features/decor/skins/skinFill";

/** 바닥. 카페 하단 배경. 상점에서 고른 스킨(색상 또는 이미지)을 반영한다. */
export default function Floor() {
  const activeSkin = useDecorStore((s) => s.activeFloorSkin);
  const skin = FLOOR_SKINS.find((s) => s.id === activeSkin) ?? FLOOR_SKINS[0];

  return <div className="absolute inset-x-0 bottom-0 h-[10%]" style={skinFillStyle(skin.fill)} />;
}
