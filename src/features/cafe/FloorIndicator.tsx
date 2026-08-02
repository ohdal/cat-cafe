import { useCafeStore } from "@/features/cafe/useCafeStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * 좌측 상단 HUD: 현재 층 표시 + 층 선택 모달 토글. Hud(우측 상단)와 좌우 대칭 위치.
 * currentFloor를 직접 구독하는 잎 컴포넌트라 층이 바뀔 때만 여기만 리렌더된다.
 */
export default function FloorIndicator() {
  const currentFloor = useCafeStore((s) => s.currentFloor);
  const openModal = useUiStore((s) => s.openModal);

  return (
    // 배치 중일 때도 클릭이 씬으로 버블링되어 배치가 커밋되지 않도록 차단 (Hud와 동일한 이유).
    <div className="absolute left-0 top-0 p-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => openModal("floorSelect")}
        className="rounded-full bg-[#00000066] px-2 py-1 text-xs font-medium text-white"
      >
        {currentFloor}F
      </button>
    </div>
  );
}
