import { memo } from "react";
import { useCafeStore } from "@/features/cafe/useCafeStore";
import { CAFE_EXPAND_COSTS } from "@/features/cafe/cafeCatalog";
import { CAFE_MAX_LEVEL } from "@/features/economy/formulas";
import { useUiStore } from "@/store/useUiStore";
import { useGameStore } from "@/store/useGameStore";

// 위(고층)부터 아래(저층) 순으로 표시 — 층 selector가 실제 건물처럼 읽히도록.
const FLOORS = Array.from({ length: CAFE_MAX_LEVEL }, (_, i) => CAFE_MAX_LEVEL - i);

/** 층 F를 해금하는 데 드는 비용(F-1 -> F 단계). CAFE_EXPAND_COSTS[0] = "Lv1->2". */
const expandCostFor = (floor: number) => CAFE_EXPAND_COSTS[floor - 2];

/**
 * 잠긴 층에 뜨는 가격 배지 겸 해금 버튼. 바로 다음 해금 대상(level+1)만 실제로
 * 클릭 가능 — 그 너머는 expand()가 한 단계씩만 올리는 구조라 순차 해금이 먼저
 * 필요해서 항상 disabled로 보여준다. currency는 actionable일 때만(그리고 여기서만
 * boolean으로) 구독한다 — CafeMenuPanel의 UpgradeButton과 동일한 이유.
 */
const PriceButton = memo(function PriceButton({ cost, actionable }: { cost: number; actionable: boolean }) {
  const canAfford = useGameStore((s) => !actionable || s.currency >= cost);
  const expand = useCafeStore((s) => s.expand);
  const enabled = actionable && canAfford;

  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => expand()}
      className={`rounded-md px-3 py-1 text-[11px] font-medium transition ${
        enabled
          ? // 검은 잠금 오버레이 위에 항상 얹히는 버튼이라, 밝은 modal-accent 그대로 쓰면
            // 대비가 너무 튀어서 이 버튼만 로컬로 어둡게 톤을 낮춘다.
            "bg-[#5f93cc] text-white hover:bg-[#4c7fb8]"
          : "cursor-not-allowed bg-modal-surface-hover text-modal-text-muted"
      }`}
    >
      🪙{cost}
    </button>
  );
});

/** FloorIndicator 클릭 시 뜨는 층 선택 모달 내용. CafeMenuPanel의 잠금/선택 패턴을 재사용. */
export default function FloorSelectPanel() {
  const level = useCafeStore((s) => s.level);
  const currentFloor = useCafeStore((s) => s.currentFloor);
  const goToFloor = useCafeStore((s) => s.goToFloor);
  const closeModal = useUiStore((s) => s.closeModal);

  function handleSelect(floor: number) {
    if (goToFloor(floor)) closeModal();
  }

  return (
    <div className="flex w-56 flex-col gap-2 p-1">
      <h2 className="text-center text-sm font-semibold text-modal-text">층 선택</h2>

      <div className="flex flex-col gap-1">
        {FLOORS.map((floor) => {
          const unlocked = floor <= level;
          const isCurrent = floor === currentFloor;

          if (unlocked) {
            return (
              <button
                key={floor}
                type="button"
                onClick={() => handleSelect(floor)}
                className={`relative rounded-md px-3 py-2 text-left text-sm text-modal-text transition hover:bg-modal-surface-hover ${
                  isCurrent ? "bg-modal-surface-hover" : "bg-modal-surface-alt"
                } ${
                  isCurrent
                    ? "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-modal-accent after:content-['']"
                    : ""
                }`}
              >
                {floor}F{isCurrent ? " (현재)" : ""}
              </button>
            );
          }

          // 잠긴 층: 전부 동일한 검은 오버레이 위에 가격 버튼. 가격 자체가 버튼이고,
          // 바로 다음 층(level+1)만 실제로 눌려서 해금되며 나머지는 disabled로 보여준다.
          const isNextExpandable = floor === level + 1;
          const cost = expandCostFor(floor);

          return (
            <div key={floor} className="relative rounded-md bg-modal-surface-alt px-3 py-2 text-left text-sm text-modal-text-muted">
              {floor}F
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-[rgba(0,0,0,0.7)]">
                <PriceButton cost={cost} actionable={isNextExpandable} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
