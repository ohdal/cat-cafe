import { PANEL_PADDING } from "@/components/Menu/panelStyles";
import VolumeSlider from "@/components/VolumeSlider";
import { useSettingsStore } from "@/store/useSettingsStore";

/** 설정: 전체 음량 / 배경음 / 효과음 슬라이더를 세로로 배치. */
export default function SettingPanel() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const bgmVolume = useSettingsStore((s) => s.bgmVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);
  const setMasterVolume = useSettingsStore((s) => s.setMasterVolume);
  const setBgmVolume = useSettingsStore((s) => s.setBgmVolume);
  const setSfxVolume = useSettingsStore((s) => s.setSfxVolume);

  return (
    <div className={PANEL_PADDING}>
      <div className="flex flex-col gap-3">
        <VolumeSlider label="전체 음량" value={masterVolume} onChange={setMasterVolume} />
        <VolumeSlider label="배경음" value={bgmVolume} onChange={setBgmVolume} />
        <VolumeSlider label="효과음" value={sfxVolume} onChange={setSfxVolume} />
      </div>
    </div>
  );
}
