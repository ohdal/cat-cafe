import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import PlacedFurniture from "@/features/decor/furniture/PlacedFurniture";

/**
 * 배치된 가구 전부를 z-order(배열 순서)대로 렌더.
 * 재배치 중인 원본은 startPlacing 시 store가 이미 placed에서 제거하므로 자동으로 숨겨진다.
 */
export default function FurnitureLayer() {
  const placed = useFurnitureStore((s) => s.placed);
  return (
    <>
      {placed.map((item, i) => (
        <PlacedFurniture key={item.instanceId} item={item} zIndex={(i + 1) * 2} />
      ))}
    </>
  );
}
