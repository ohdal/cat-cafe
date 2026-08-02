import { useEffect, useRef, useState } from "react";
import { useCafeStore } from "@/features/cafe/useCafeStore";

/** 슬라이드 지속시간(ms). CSS `transition-duration`과 setTimeout 정리 시점이 이 값에 맞춰져야 한다. */
export const SLIDE_MS = 500;
/** 층 슬라이스 높이(px) = 카페 바 높이(App.tsx의 `h-60`). */
export const FLOOR_HEIGHT = 240;

interface Range {
  min: number;
  max: number;
}

/**
 * currentFloor 변화를 감지해 "shaft"(이동 구간에 걸친 층을 전부 쌓은 컨테이너)에
 * 띄울 층 목록과 그 shaft에 적용할 translateY를 계산한다.
 *
 * 동작 순서 (플랜의 offset 공식 참고):
 *   1) 이동 시작 — 트랜지션 없이 [min(prev,next), max(prev,next)] 구간을 전부 마운트하고,
 *      prev 층이 보이는 위치로 즉시 배치 (화면상 기존 상태와 동일한 위치라 점프 없음).
 *   2) 다음 프레임 — 트랜지션을 켜고 next 층이 보이는 위치로 애니메이션.
 *   3) SLIDE_MS 후 — 트랜지션 끄고 next 층 하나만 남긴 구간으로 정리 (역시 같은
 *      위치라 점프 없음 — 평소엔 shaft에 층 하나만 떠 있어 가볍다).
 *
 * 참고: 애니메이션 도중 currentFloor가 다시 바뀌는(연속 클릭) 경우는 이번 범위에선
 * 별도로 다루지 않는다 — 직전 트랜지션이 끝난 뒤 새 트랜지션이 시작되는 게 일반적인 사용 흐름.
 */
export function useFloorTransition() {
  const currentFloor = useCafeStore((s) => s.currentFloor);
  const [range, setRange] = useState<Range>({ min: currentFloor, max: currentFloor });
  const [translateY, setTranslateY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevFloorRef = useRef(currentFloor);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const prev = prevFloorRef.current;
    prevFloorRef.current = currentFloor;
    if (prev === currentFloor) return;

    const min = Math.min(prev, currentFloor);
    const max = Math.max(prev, currentFloor);
    const offsetOf = (floor: number, rangeMax: number) => (rangeMax - floor) * FLOOR_HEIGHT;

    // 1) 트랜지션 없이 전체 구간을 마운트, prev 위치로 즉시 배치.
    setIsTransitioning(false);
    setRange({ min, max });
    setTranslateY(-offsetOf(prev, max));

    // 2) 다음 프레임에 목표(currentFloor) 위치로 애니메이션 시작.
    const raf = requestAnimationFrame(() => {
      setIsTransitioning(true);
      setTranslateY(-offsetOf(currentFloor, max));
    });

    // 3) 애니메이션이 끝나면 목표 층 하나만 남기고 정리.
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      setRange({ min: currentFloor, max: currentFloor });
      setTranslateY(0);
    }, SLIDE_MS);

    return () => cancelAnimationFrame(raf);
  }, [currentFloor]);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const floors: number[] = [];
  for (let floor = range.max; floor >= range.min; floor--) floors.push(floor);

  return { floors, translateY, isTransitioning };
}
