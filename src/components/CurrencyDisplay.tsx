import { useGameStore } from "@/store/useGameStore";

/**
 * 재화 표시. currency를 직접 구독하는 잎(leaf) 컴포넌트 — 매 초 여기만 리렌더된다.
 * 내부 잔액은 소수까지 누적되므로 표시에서만 Math.floor로 정수화한다.
 */
export default function CurrencyDisplay() {
  const currency = useGameStore((s) => s.currency);

  return (
    <div className="flex items-center gap-1 rounded-full bg-[#00000066] px-2 py-1 text-xs font-medium text-amber-200">
      <span>🪙</span>
      <span>{Math.floor(currency).toLocaleString()}</span>
    </div>
  );
}
