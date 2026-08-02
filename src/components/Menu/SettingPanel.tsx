import { useState } from "react";
import { PANEL_PADDING } from "@/components/Menu/panelStyles";
import VolumeSlider from "@/components/VolumeSlider";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGameStore } from "@/store/useGameStore";
import { useFurnitureStore } from "@/features/decor/furniture/useFurnitureStore";
import { useDecorStore } from "@/features/decor/skins/useDecorStore";
import { useMenuStore } from "@/features/menu/useMenuStore";
import { useCafeStore } from "@/features/cafe/useCafeStore";

/** 설정: 전체 음량 / 배경음 / 효과음 슬라이더 + 로컬 진행 초기화. */
export default function SettingPanel() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const bgmVolume = useSettingsStore((s) => s.bgmVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setBgmVolume = useSettingsStore((s) => s.setBgmVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);

  const resetCurrency = useGameStore((s) => s.resetCurrency);
  const resetFurniture = useFurnitureStore((s) => s.reset);
  const resetMenu = useMenuStore((s) => s.reset);
  const resetSkins = useDecorStore((s) => s.reset);
  const resetCafe = useCafeStore((s) => s.reset);

  const [confirming, setConfirming] = useState(false);

  function handleReset() {
    resetCurrency();
    resetFurniture();
    resetMenu();
    resetSkins();
    resetCafe();
    setConfirming(false);
  }

  return (
    <div className={PANEL_PADDING}>
      <div className="flex flex-col gap-3">
        <VolumeSlider label="전체 음량" value={masterVolume} onChange={setMasterVolume} />
        <VolumeSlider label="배경음" value={bgmVolume} onChange={setBgmVolume} />
        <VolumeSlider label="효과음" value={sfxVolume} onChange={setSfxVolume} />

        <div className="mt-2 border-t border-modal-border pt-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-md bg-modal-surface-alt px-3 py-1.5 text-xs font-medium text-modal-text transition hover:bg-modal-surface-hover"
            >
              게임 전체 초기화
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-modal-text-muted">정말 초기화할까요? 되돌릴 수 없어요.</span>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-red-50 transition hover:bg-red-600"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md bg-modal-surface-alt px-3 py-1.5 text-xs font-medium text-modal-text transition hover:bg-modal-surface-hover"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
