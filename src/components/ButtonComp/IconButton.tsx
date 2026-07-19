import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 버튼 안에 들어갈 아이콘 (이모지/아이콘 컴포넌트). */
  children: ReactNode;
}

/** 아이콘 전용 버튼. `ButtonComp.Icon`으로 사용. */
export default function IconButton({
  children,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center rounded-md bg-[#ffffff26] px-2 py-1 text-xs text-white transition hover:bg-[#ffffff40] active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
