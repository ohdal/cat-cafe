import CurrencyDisplay from "@/components/CurrencyDisplay";
import HamburgerButton from "@/components/HamburgerButton";
import { useGameStore } from "@/store/useGameStore";

/** 우측 상단 HUD: 재화 표시 + 메뉴(햄버거) 버튼. 콘텐츠 폭만큼만 차지. */
export default function Hud() {
  const currency = useGameStore((s) => s.currency);

  return (
    // 배치 중일 때도 HUD 클릭이 씬으로 버블링되어 배치가 커밋되지 않도록 차단.
    <div
      className="absolute right-0 top-0 flex items-center gap-1.5 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <CurrencyDisplay amount={currency} />
      <HamburgerButton />
    </div>
  );
}
