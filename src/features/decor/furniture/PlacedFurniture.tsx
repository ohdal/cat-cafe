import { CATALOG } from "@/features/decor/furniture/catalog";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import type { PlacedFurniture as PlacedFurnitureData } from "@/features/decor/furniture/types";

interface Props {
  item: PlacedFurnitureData;
  /** z-order: 배열 index 기반. 짝수 슬롯만 써서 ghost가 그 사이(홀수)에 낄 자리를 남겨둔다. */
  zIndex: number;
}

/**
 * 배치된 가구 1개. 배치 모드가 켜져 있을 때만 클릭해서 재배치 모드로 진입한다
 * (꺼져 있으면 그냥 카페를 구경만 하는 상태라 클릭해도 아무 일도 안 일어남).
 * 배치 모드가 켜진 상태에서, 현재 다른 가구를 배치/재배치 중이면 클릭이 그대로
 * 씬으로 버블링되어 그 위치에 배치가 커밋된다(겹쳐서 배치하는 케이스 지원).
 * 삭제는 재배치 진입 후 씬 상단의 삭제 버튼으로 처리한다.
 */
export default function PlacedFurniture({ item, zIndex }: Props) {
  const startPlacing = useFurnitureStore((s) => s.startPlacing);
  const placementMode = useFurnitureStore((s) => s.placementMode);
  const type = CATALOG[item.typeId];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!placementMode) return; // 배치 모드 꺼져 있으면 클릭 무시
        if (useFurnitureStore.getState().placing) return; // 씬으로 버블링 -> 커밋
        startPlacing(item.typeId, item.instanceId);
      }}
      className={`absolute flex items-center justify-center text-2xl leading-none ${
        placementMode ? "cursor-pointer" : ""
      }`}
      style={{
        left: `${item.x - type.size.w / 2}%`,
        top: `${item.y - type.size.h}%`,
        width: `${type.size.w}%`,
        height: `${type.size.h}%`,
        zIndex,
      }}
    >
      {type.icon}
    </div>
  );
}
