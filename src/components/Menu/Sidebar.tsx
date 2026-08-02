import { CATEGORY_ITEMS, type CategoryType } from "@/components/Menu/categories";

interface SidebarProps {
  category: CategoryType;
  onSelect: (category: CategoryType) => void;
}

/** MainMenu 좌측 카테고리 메뉴 (세로 배치). */
export default function Sidebar({ category, onSelect }: SidebarProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-modal-surface-alt p-2">
      {CATEGORY_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-modal-text transition hover:bg-modal-surface-hover ${
            category === item.id
              ? "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-modal-accent after:content-['']"
              : ""
          }`}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
