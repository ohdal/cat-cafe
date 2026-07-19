import { useUiStore } from "@/store/useUiStore";

/** 메뉴판. 계산대 상단(우측 위)에 위치. 클릭하면 CafeMenu 모달이 뜬다. 나중에 상점 스킨으로 교체 예정 (임시 placeholder). */
export default function MenuBoard() {
  const openModal = useUiStore((s) => s.openModal);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // 배치 중일 때 씬으로 버블링되어 커밋되는 것 방지 (Hud와 동일한 이유)
        openModal("cafeMenu");
      }}
      className="absolute right-4 top-16 flex h-10 w-28 items-center justify-center rounded bg-emerald-800 text-xs text-emerald-50/80"
    >
      MenuBoard (메뉴판)
    </button>
  );
}
