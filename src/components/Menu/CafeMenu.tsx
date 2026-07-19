import ModalOverlay from "@/components/ModalOverlay";
import { useUiStore } from "@/store/useUiStore";

/** MenuBoard 클릭 시 뜨는 카페 메뉴 모달. 내용은 임시 placeholder. */
const CafeMenu = () => {
  const closeModal = useUiStore((s) => s.closeModal);

  return (
    <ModalOverlay onClose={closeModal}>
      <div className="flex min-h-100 min-w-160 items-center justify-center text-sm text-slate-200">
        CafeMenu (카페 메뉴, 임시)
      </div>
    </ModalOverlay>
  );
};

export default CafeMenu;
