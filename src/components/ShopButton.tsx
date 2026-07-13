import { useUiStore } from "../store/useUiStore";
import { ButtonComp } from "./ButtonComp";

/** 상점 열기 버튼. */
export default function ShopButton() {
  const openModal = useUiStore((s) => s.openModal);
  return (
    <ButtonComp.Icon onClick={() => openModal("shop")} aria-label="상점">
      🛒
    </ButtonComp.Icon>
  );
}
