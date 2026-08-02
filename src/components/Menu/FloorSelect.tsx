import ModalOverlay from "@/components/ModalOverlay";
import FloorSelectPanel from "@/components/Menu/FloorSelectPanel";
import { useUiStore } from "@/store/useUiStore";

/** FloorIndicator 클릭 시 뜨는 층 선택 모달. */
const FloorSelect = () => {
  const closeModal = useUiStore((s) => s.closeModal);

  return (
    <ModalOverlay onClose={closeModal}>
      <FloorSelectPanel />
    </ModalOverlay>
  );
};

export default FloorSelect;
