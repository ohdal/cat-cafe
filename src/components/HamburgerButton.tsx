import { useUiStore } from "@/store/useUiStore";
import { ButtonComp } from "@/components/ButtonComp";

/** 메인 메뉴(MainMenu) 열기/닫기 토글 버튼. */
export default function HamburgerButton() {
  const activeModal = useUiStore((s) => s.activeModal);
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const isOpen = activeModal === "mainMenu";

  return (
    <ButtonComp.Icon
      onClick={() => (isOpen ? closeModal() : openModal("mainMenu"))}
      aria-label="메뉴"
      aria-pressed={isOpen}
    >
      ☰
    </ButtonComp.Icon>
  );
}
