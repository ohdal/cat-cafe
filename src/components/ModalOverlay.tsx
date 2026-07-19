import type { ReactNode } from "react";
import { useInteractiveRegion } from "@/lib/interactiveRegion";

interface ModalOverlayProps {
  onClose: () => void;
  children: ReactNode;
  /** ✕ 닫기 버튼 노출 여부. 다른 방식(예: 토글 버튼)으로 닫는 모달은 false로 끈다. */
  showCloseButton?: boolean;
  /** 패널 배경색 utility 클래스. 기본은 살짝 투명. */
  background?: string;
}

/**
 * 카페 바 바로 위(예전 가구 인벤토리 패널과 동일한 위치)에 뜨는 패널.
 * 화면을 덮는 배경(backdrop) 없이 패널만 뜬다.
 */
export default function ModalOverlay({
  onClose,
  children,
  showCloseButton = true,
  background = "bg-[#0f172bf2]",
}: ModalOverlayProps) {
  const ref = useInteractiveRegion<HTMLDivElement>("modal-overlay");

  return (
    <div
      ref={ref}
      className={`absolute bottom-[252px] left-1/2 z-20 -translate-x-1/2 rounded-lg border border-[#ffffff1a] ${background} p-2 shadow-lg`}
    >
      {showCloseButton && (
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffffff26] text-xs text-white hover:bg-[#ffffff40]"
        >
          ✕
        </button>
      )}
      {children}
    </div>
  );
}
