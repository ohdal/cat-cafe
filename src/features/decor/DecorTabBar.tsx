import { DECOR_TABS, type DecorTab } from "@/features/decor/entries";

interface Props {
  tab: DecorTab;
  onChange: (tab: DecorTab) => void;
}

/** 상점/꾸미기가 공유하는 전체·벽지·바닥·가구 탭 바. */
export default function DecorTabBar({ tab, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {DECOR_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`relative rounded-md px-2 py-1 text-xs text-modal-text transition hover:bg-modal-surface-hover ${
            tab === t.id
              ? "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-modal-accent after:content-['']"
              : ""
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
