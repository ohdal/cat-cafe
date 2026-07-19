import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { WALL_SKINS } from "@/features/decor/skins/catalog";
import { skinFillStyle } from "@/features/decor/skins/skinFill";

/** 벽지. 카페 상단 배경. 상점에서 고른 스킨(색상 또는 이미지)을 반영한다. */
export default function Wall() {
  const activeSkin = useDecorStore((s) => s.activeWallSkin);
  const skin = WALL_SKINS.find((s) => s.id === activeSkin) ?? WALL_SKINS[0];

  return <div className="absolute inset-x-0 top-0 h-[90%]" style={skinFillStyle(skin.fill)} />;
}
