import { memo, useMemo } from "react";
import { useCafeStore } from "@/features/cafe/useCafeStore";
import { useGoldPerHour } from "@/features/economy/goldPerHour";
import { MAX_MENU_LEVEL, menuIncomePerHour, upgradeCost } from "@/features/economy/formulas";
import { selectMenusByFloor, isMenuUnlocked } from "@/features/menu/menuSelectors";
import { useMenuStore } from "@/features/menu/useMenuStore";
import { useGameStore } from "@/store/useGameStore";

/**
 * 업그레이드 버튼 잎. currency는 여기서만 (boolean으로) 구독한다 — 잔액이 cost 경계를
 * 넘는 순간에만 리렌더되고, MenuRow 본문은 currency를 몰라 매 초 리렌더되지 않는다.
 * 모듈 스코프에서 정의해야 memo가 의미 있다 (부모 렌더마다 새 컴포넌트 타입이 되면 무효화됨).
 */
const UpgradeButton = memo(function UpgradeButton({
  menuId,
  cost,
  blocked,
}: {
  menuId: string;
  cost: number;
  /** 잠김/최대레벨처럼 잔액과 무관하게 항상 막혀야 하는 경우. */
  blocked: boolean;
}) {
  const canAfford = useGameStore((s) => s.currency >= cost);
  const upgrade = useMenuStore((s) => s.upgrade);
  const disabled = blocked || !canAfford;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => upgrade(menuId)}
      className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition ${
        disabled
          ? "cursor-not-allowed bg-modal-surface-hover text-modal-text-muted"
          : "bg-modal-accent text-modal-text hover:bg-modal-accent-hover"
      }`}
    >
      업그레이드
      <br />
      🪙{cost}
    </button>
  );
});

interface MenuRowProps {
  id: string;
  name: string;
  icon: string;
  floor: number;
  baseIncomePerHour: number;
  unlocked: boolean;
}

/**
 * 메뉴 한 행. 자기 레벨(levels[id])만 구독 — 다른 메뉴를 업그레이드해도 이 행은 안 움직인다.
 * 모듈 스코프 + memo: unlocked/기본값이 안 바뀌면(다른 메뉴 업그레이드 시) 리렌더 스킵.
 */
const MenuRow = memo(function MenuRow({ id, name, icon, floor, baseIncomePerHour, unlocked }: MenuRowProps) {
  const level = useMenuStore((s) => s.levels[id] ?? 0);
  const income = menuIncomePerHour(baseIncomePerHour, level);
  const cost = upgradeCost(baseIncomePerHour, level);
  const atMax = level >= MAX_MENU_LEVEL;

  return (
    <div className="relative flex items-center gap-2 rounded-md bg-modal-surface-alt p-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-modal-surface-hover text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-modal-text">{name}</p>
        <p className="text-[11px] text-currency-accent">🪙 1시간당 {income}</p>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-center gap-0.5">
        <span className="text-[11px] text-modal-text-muted">Lv.{level}</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-modal-surface-hover">
          <div
            className="h-full rounded-full bg-modal-accent"
            style={{ width: `${(level / MAX_MENU_LEVEL) * 100}%` }}
          />
        </div>
      </div>

      <UpgradeButton menuId={id} cost={cost} blocked={!unlocked || atMax} />

      {!unlocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-[rgba(0,0,0,0.7)]">
          <span className="text-lg">🔒</span>
          <span className="ml-1 text-[11px] text-white">{floor}F에서 해금</span>
        </div>
      )}
    </div>
  );
});

/** CafeMenu 모달 내용. 메뉴 리스트(층 순서, 해금 먼저 → 잠긴 것 뒤) + 업그레이드. */
export default function CafeMenuPanel() {
  const cafeLevel = useCafeStore((s) => s.level);
  const goldPerHour = useGoldPerHour();
  const menus = useMemo(() => selectMenusByFloor(), []);

  return (
    <div className="flex h-[400px] w-[640px] flex-col gap-2 p-1">
      <div className="text-center">
        <h2 className="text-sm font-semibold text-modal-text">☕ 카페 메뉴 ☕</h2>
        <p className="text-[11px] text-modal-text-muted">현재 총수익 {Math.round(goldPerHour).toLocaleString()} Gold/Hour</p>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {menus.map((menu) => (
          <MenuRow
            key={menu.id}
            id={menu.id}
            name={menu.name}
            icon={menu.icon}
            floor={menu.floor}
            baseIncomePerHour={menu.baseIncomePerHour}
            unlocked={isMenuUnlocked(menu, cafeLevel)}
          />
        ))}
      </div>

      <p className="text-center text-[11px] text-modal-text-muted">
        ☆ 메뉴 레벨이 높을수록 1시간당 벌어들이는 골드가 증가합니다.
      </p>
    </div>
  );
}
