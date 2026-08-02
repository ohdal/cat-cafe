import { useEffect, useRef, useState } from "react";
import { MAX_OFFLINE_HOURS, OFFLINE_EARNINGS_ENABLED } from "@/features/economy/formulas";
import { useGameStore } from "@/store/useGameStore";
import { useGoldPerHour } from "@/features/economy/goldPerHour";
import OfflineEarningsModal from "@/features/economy/OfflineEarningsModal";

const MARK_SEEN_INTERVAL_MS = 10_000;

/**
 * 앱 로드 시 딱 한 번 오프라인 정산을 시도하고, 이후엔 주기적으로(+ visibilitychange/beforeunload)
 * "마지막으로 본 시각·그때의 G/h" 스냅샷을 남긴다. 기능은 아직 OFFLINE_EARNINGS_ENABLED=false로
 * 꺼져 있으므로 지금은 항상 아무 일도 하지 않는다 — 나중에 플래그만 켜면 그대로 동작한다.
 * (온라인 중 dt 적립은 useAccrualTicker가 담당 — 이 게이트는 콜드 스타트 정산 + 스냅샷만 다룬다.)
 */
export default function OfflineEarningsGate() {
  const settledRef = useRef(false);
  const [result, setResult] = useState<{ elapsedSec: number; gained: number } | null>(null);

  const gph = useGoldPerHour();
  const gphRef = useRef(gph);
  gphRef.current = gph;

  useEffect(() => {
    if (!OFFLINE_EARNINGS_ENABLED || settledRef.current) return;
    settledRef.current = true; // StrictMode 이중 마운트로 두 번 정산되는 것 방지

    const lastSeenAt = useGameStore.getState().lastSeenAt;
    const gained = useGameStore.getState().settleOffline();
    if (gained > 0) {
      const elapsedSec = Math.min(Math.max((Date.now() - lastSeenAt) / 1000, 0), MAX_OFFLINE_HOURS * 3600);
      setResult({ elapsedSec, gained });
    }
  }, []);

  useEffect(() => {
    if (!OFFLINE_EARNINGS_ENABLED) return;

    const markSeen = () => useGameStore.getState().markSeen(gphRef.current);
    const id = setInterval(markSeen, MARK_SEEN_INTERVAL_MS);
    document.addEventListener("visibilitychange", markSeen);
    window.addEventListener("beforeunload", markSeen);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", markSeen);
      window.removeEventListener("beforeunload", markSeen);
    };
  }, []);

  if (!result) return null;
  return <OfflineEarningsModal elapsedSec={result.elapsedSec} gained={result.gained} onClose={() => setResult(null)} />;
}
