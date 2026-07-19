import type { ReactNode } from "react";

interface TooltipProps {
  /** 호버 시 보여줄 내용 (가구 이름 등). */
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 호버 시 라벨을 위쪽에 띄우는 공용 툴팁. CSS group-hover 기반. */
export default function Tooltip({ label, children, className = "" }: TooltipProps) {
  return (
    <div className={`group relative h-full w-full ${className}`}>
      {children}
      <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}
