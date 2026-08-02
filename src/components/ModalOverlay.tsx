import { useEffect, type ReactNode } from "react";
import { useInteractiveRegion } from "@/lib/interactiveRegion";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";

interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  /** ✕ 닫기 버튼 노출 여부. MainMenu처럼 다른 방식으로 닫는 모달은 false로 끈다. */
  showCloseButton?: boolean;
  /** 패널 배경색 utility 클래스. 기본은 불투명 modal-surface. */
  background?: string;
  /** 패널 전체 padding utility 클래스. 기본 p-2. 콘텐츠 쪽에서 직접 패딩을 주는 모달은 p-0으로 끈다. */
  padding?: string;
}

/**
 * 카페 바 바로 위(예전 가구 인벤토리 패널과 동일한 위치)에 뜨는 패널.
 * 화면을 덮는 배경(backdrop) 없이 패널만 뜬다.
 * 패널 바깥을 클릭하면 자동으로 닫힌다 — 단, 가구 배치 모드 중에는 씬 클릭이
 * 배치 커밋으로 쓰이므로 이 자동 닫힘을 건너뛴다.
 */
export default function ModalOverlay({
  onClose,
  children,
  showCloseButton = true,
  background = "bg-modal-surface",
  padding = "p-2",
}: ModalOverlayProps) {
  const ref = useInteractiveRegion<HTMLDivElement>("modal-overlay");

  useEffect(() => {
    // click(버블 단계)을 쓰는 이유: HamburgerButton/MenuBoard처럼 자체적으로
    // 토글 로직을 가진 트리거는 자기 onClick 안에서 stopPropagation을 걸어두므로
    // (Hud.tsx 참고) 이 리스너까지 이벤트가 안 올라와 서로 안 꼬인다. pointerdown은
    // click과 별개의(더 이른) 이벤트라 그 사이 리렌더가 끼어들어 토글이 씹힐 수 있다.
    //
    // e.target이 아니라 e.composedPath()로 안쪽 여부를 판정한다: 모달 안에서 클릭 한
    // 번에 DOM이 통째로 바뀌는 버튼(예: SettingPanel의 확인/취소 토글)을 누르면, 이
    // 리스너가 실행되는 시점엔 React가 이미 그 버튼을 언마운트해서 e.target이 document에서
    // 떨어져 나간 상태일 수 있다 — 그러면 contains()가 무조건 false가 되어 모달 안을
    // 눌렀는데도 "바깥 클릭"으로 오판해 모달이 닫혀버린다. composedPath()는 이벤트가
    // 처음 발생한 시점의 경로를 그대로 담고 있어 이후 DOM이 바뀌어도 안전하다.
    function onDocumentClick(e: MouseEvent) {
      if (useFurnitureStore.getState().placementMode) return;
      if (!ref.current) return;
      if (e.composedPath().includes(ref.current)) return;
      onClose();
    }
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute bottom-63 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-modal-border ${background} ${padding} shadow-lg`}
    >
      {showCloseButton && (
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-modal-surface-hover text-xs text-modal-text hover:bg-modal-border"
        >
          ✕
        </button>
      )}
      {children}
    </div>
  );
}
