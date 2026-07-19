import { create } from "zustand";

/** 앱의 최상위 화면. */
export type Screen = "start" | "main";

/** 화면에 띄울 수 있는 모달 종류. 필요할 때마다 여기에 추가합니다. */
export type ModalName = "mainMenu" | "cafeMenu";

interface UiState {
  /** 현재 화면. */
  screen: Screen;
  setScreen: (screen: Screen) => void;

  /** 현재 열려 있는 모달 (없으면 null). */
  activeModal: ModalName | null;
  openModal: (modal: ModalName) => void;
  closeModal: () => void;
}

/**
 * 전역 UI 상태 스토어 (zustand).
 *
 * 사용 예:
 *   const screen = useUiStore((s) => s.screen);
 *   const setScreen = useUiStore((s) => s.setScreen);
 *   setScreen("main");
 */
export const useUiStore = create<UiState>((set) => ({
  screen: "start",
  setScreen: (screen) => set({ screen }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
