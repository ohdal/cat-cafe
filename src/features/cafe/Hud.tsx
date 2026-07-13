import CurrencyDisplay from "../../components/CurrencyDisplay";
import ShopButton from "../../components/ShopButton";
import SettingsButton from "../../components/SettingsButton";
import { useGameStore } from "../../store/useGameStore";

/** 우측 상단 HUD: 재화 표시 + 상점 버튼 + 설정 버튼. 콘텐츠 폭만큼만 차지. */
export default function Hud() {
  const currency = useGameStore((s) => s.currency);

  return (
    <div className="absolute right-0 top-0 flex items-center gap-1.5 p-2">
      <CurrencyDisplay amount={currency} />
      <ShopButton />
      <SettingsButton />
    </div>
  );
}
