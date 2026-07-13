import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** 꽉 찬(solid) 버튼. `ButtonComp.Solid`로 사용. */
export default function SolidButton({
  children,
  className = "",
  type = "button",
  ...props
}: SolidButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow transition hover:bg-neutral-200 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
