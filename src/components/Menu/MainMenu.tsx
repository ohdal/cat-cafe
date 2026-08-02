import { useState } from "react";
import Sidebar from "@/components/Menu/Sidebar";
import ModalOverlay from "@/components/ModalOverlay";
import FurniturePanel from "@/components/Menu/FurniturePanel";
import ShopPanel from "@/components/Menu/ShopPanel";
import SettingPanel from "@/components/Menu/SettingPanel";
import { useUiStore } from "@/store/useUiStore";
import type { CategoryType } from "@/components/Menu/categories";

/** 햄버거 메뉴로 여는 메인 메뉴: 좌측 카테고리(Sidebar) + 우측 콘텐츠. */
const MainMenu = () => {
  const closeModal = useUiStore((s) => s.closeModal);
  const [category, setCategory] = useState<CategoryType>("shop");

  return (
    <ModalOverlay onClose={closeModal} showCloseButton={false} padding="p-0">
      <div className="flex h-[400px] min-w-[640px] flex-row gap-3">
        <Sidebar category={category} onSelect={setCategory} />
        <div className="min-w-0 flex-1 p-2">
          {category === "shop" && <ShopPanel />}
          {category === "inventory" && <FurniturePanel />}
          {category === "setting" && <SettingPanel />}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default MainMenu;
