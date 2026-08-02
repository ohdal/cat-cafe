import ModalOverlay from "@/components/ModalOverlay";
import CafeMenuPanel from "@/components/Menu/CafeMenuPanel";
import { useUiStore } from "@/store/useUiStore";

/** MenuBoard 클릭 시 뜨는 카페 메뉴 모달. */
const CafeMenu = () => {
  const closeModal = useUiStore((s) => s.closeModal);

  return (
    <ModalOverlay onClose={closeModal}>
      <CafeMenuPanel />
    </ModalOverlay>
  );
};

export default CafeMenu;
