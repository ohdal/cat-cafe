interface EmptyProps {
  label?: string;
  className?: string;
}

/** 목록이 비었을 때 컨테이너 한가운데 표시하는 공용 안내 문구. */
export default function Empty({ label = "아이템이 존재하지 않습니다", className = "" }: EmptyProps) {
  return (
    <div className={`flex h-full w-full items-center justify-center text-xs text-modal-text-muted ${className}`}>
      {label}
    </div>
  );
}
