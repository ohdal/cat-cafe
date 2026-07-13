import { useUiStore } from "../store/useUiStore";
import { ButtonComp } from "./ButtonComp";

/** 설정 열기 버튼. */
export default function SettingsButton() {
  const openModal = useUiStore((s) => s.openModal);
  return (
    <ButtonComp.Icon onClick={() => openModal("settings")} aria-label="설정">
      ⚙️
    </ButtonComp.Icon>
  );
}
