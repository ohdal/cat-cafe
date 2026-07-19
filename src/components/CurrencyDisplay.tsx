interface CurrencyDisplayProps {
  /** 표시할 재화 수량. 나중에 store와 연결 (임시 기본값 0). */
  amount?: number;
}

/** 재화 표시. 임시 placeholder. */
export default function CurrencyDisplay({ amount = 0 }: CurrencyDisplayProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#00000066] px-2 py-1 text-xs font-medium text-amber-200">
      <span>🪙</span>
      <span>{amount.toLocaleString()}</span>
    </div>
  );
}
