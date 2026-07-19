import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  /** 전체 음량 (0~100). */
  masterVolume: number;
  /** 배경음 음량 (0~100). */
  bgmVolume: number;
  /** 효과음 음량 (0~100). */
  sfxVolume: number;

  setMasterVolume: (value: number) => void;
  setBgmVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
}

/** 설정 상태 스토어 (zustand + persist). 볼륨 값은 localStorage에 저장되어 유지된다. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      masterVolume: 80,
      bgmVolume: 80,
      sfxVolume: 80,

      setMasterVolume: (value) => set({ masterVolume: value }),
      setBgmVolume: (value) => set({ bgmVolume: value }),
      setSfxVolume: (value) => set({ sfxVolume: value }),
    }),
    {
      name: "cat-cafe-settings",
      version: 1,
    },
  ),
);
