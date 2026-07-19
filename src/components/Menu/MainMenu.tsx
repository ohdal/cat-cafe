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
    <ModalOverlay onClose={closeModal} showCloseButton={false} background="bg-[#0f172b]">
      <div className="flex h-100 min-w-160 flex-row gap-3">
        <Sidebar category={category} onSelect={setCategory} />
        <div className="min-w-0 flex-1">
          {category === "shop" && <ShopPanel />}
          {category === "inventory" && <FurniturePanel />}
          {category === "setting" && <SettingPanel />}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default MainMenu;
