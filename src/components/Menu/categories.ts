export type CategoryType = "shop" | "inventory" | "setting";

export const CATEGORY_ITEMS: { id: CategoryType; label: string; icon: string }[] = [
  { id: "shop", label: "상점", icon: "🛒" },
  { id: "inventory", label: "꾸미기", icon: "🛋️" },
  { id: "setting", label: "설정", icon: "⚙️" },
];
