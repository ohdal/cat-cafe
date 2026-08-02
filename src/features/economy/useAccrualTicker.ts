import { useEffect, useRef } from "react";
import { useGoldPerHour } from "@/features/economy/goldPerHour";
import { ACCRUAL_INTERVAL_MS } from "@/features/economy/formulas";
import { useGameStore } from "@/store/useGameStore";

/**
 * 매 초 경과시간(dt) 기반으로 재화를 적립한다. gph는 ref로만 읽어 interval을
 * 재생성하지 않는다 (업그레이드로 gph가 바뀌어도 다음 틱에 바로 반영됨).
 * dt 기반이라 콜백이 늦게 와도(백그라운드 탭 등) 총 적립량은 항상 정확하다.
 */
export function useAccrualTicker() {
  const gph = useGoldPerHour();
  const addCurrency = useGameStore((s) => s.addCurrency);

  const gphRef = useRef(gph);
  gphRef.current = gph;

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dtSec = (now - last) / 1000;
      last = now;
      addCurrency((gphRef.current / 3600) * dtSec);
    }, ACCRUAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [addCurrency]);
}
