interface VolumeSliderProps {
  label: string;
  value: number; // 0~100
  onChange: (value: number) => void;
}

/** 라벨 + 슬라이더 + 현재 값 한 줄. 설정 패널의 볼륨 항목들에 사용. */
export default function VolumeSlider({ label, value, onChange }: VolumeSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-modal-text">
        <span>{label}</span>
        <span className="text-modal-text-muted">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-modal-surface-hover accent-modal-accent"
      />
    </div>
  );
}
