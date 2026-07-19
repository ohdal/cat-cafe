import { useEffect, useRef } from "react";
import Wall from "@/features/cafe/Wall";
import Floor from "@/features/cafe/Floor";
import Counter from "@/features/cafe/Counter";
import MenuBoard from "@/features/cafe/MenuBoard";
import Hud from "@/features/cafe/Hud";
import FurnitureLayer from "@/features/decor/furniture/FurnitureLayer";
import FurnitureGhost from "@/features/decor/furniture/FurnitureGhost";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import { CATALOG } from "@/features/decor/furniture/catalog";

/**
 * 카페 화면 구성.
 *
 * 레이어 순서(뒤 → 앞): 벽지 → 바닥 → 계산대/메뉴판 → 배치된 가구 → 배치 프리뷰(ghost) → HUD.
 * 각 요소는 나중에 상점 시스템에서 스킨을 교체할 수 있도록 별도 컴포넌트로 분리함.
 *
 * 가구 배치 상호작용(마우스 추적/커밋/취소/z-order)은 여기서 처리한다:
 * 좌클릭 커밋, 우클릭 취소, 휠로 겹치는 가구 기준 z-order 조절.
 */
export default function CafeScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const placing = useFurnitureStore((s) => s.placing);
  const setPlacingPos = useFurnitureStore((s) => s.setPlacingPos);
  const cyclePlacingZ = useFurnitureStore((s) => s.cyclePlacingZ);
  const commitPlacing = useFurnitureStore((s) => s.commitPlacing);
  const cancelPlacing = useFurnitureStore((s) => s.cancelPlacing);
  const removePlacing = useFurnitureStore((s) => s.removePlacing);
  const isPlacing = !!placing;

  // ESC로도 배치 취소 (우클릭과 동일한 경로). placing 객체는 마우스 이동마다
  // 새로 만들어지므로, 불필요한 리스너 재등록을 피하려 boolean만 deps에 둔다.
  useEffect(() => {
    if (!isPlacing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelPlacing();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPlacing, cancelPlacing]);

  function toScenePct(clientX: number, clientY: number) {
    const rect = sceneRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  return (
    <div
      ref={sceneRef}
      className="relative flex-1 overflow-hidden"
      onMouseMove={(e) => {
        if (!placing) return;
        const { x, y } = toScenePct(e.clientX, e.clientY);
        // 저장되는 y는 "밑변 중앙" 기준(zone 체크·렌더링이 이 기준)이라 그대로 두고,
        // 마우스는 가구의 시각적 중앙을 가리키도록 그 가구 높이의 절반만큼만 보정해서 넘긴다.
        const halfHeight = CATALOG[placing.typeId].size.h / 2;
        setPlacingPos(x, y + halfHeight);
      }}
      onClick={() => {
        if (placing) commitPlacing();
      }}
      onContextMenu={(e) => {
        if (!placing) return;
        e.preventDefault();
        cancelPlacing();
      }}
      onWheel={(e) => {
        if (!placing) return;
        cyclePlacingZ(e.deltaY < 0 ? 1 : -1);
      }}
    >
      <Wall />
      <Floor />
      <Counter />
      <MenuBoard />
      <FurnitureLayer />
      <FurnitureGhost />
      <Hud />
      {placing && (
        <button
          type="button"
          aria-label="배치 삭제"
          onClick={(e) => {
            e.stopPropagation(); // 씬으로 버블링되어 커밋되는 것 방지
            removePlacing();
          }}
          className="absolute left-1/2 top-2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#dc262699] bg-[#dc262640] px-2 py-0.5 text-[11px] text-red-200 hover:bg-[#dc262666]"
        >
          🗑 삭제
        </button>
      )}
    </div>
  );
}
