import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * 전체화면 투명 오버레이 창에서, 마우스 클릭이 데스크탑으로 통과되지 않고
 * 실제로 앱이 받아야 하는 영역들을 Rust(overlay.rs)에 보고한다. Rust는 커서가
 * 이 영역들 밖에 있을 때만 클릭을 데스크탑으로 통과시킨다.
 */
const regions = new Map<string, HTMLElement>();

function sync() {
  const rects = Array.from(regions.values()).map((el) => {
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height];
  });
  invoke("set_interactive_rects", { rects }).catch(() => {});
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", sync);
}

/**
 * 렌더링되어 있고 active인 동안 해당 엘리먼트를 상호작용 가능 영역으로 등록한다.
 * 조건부로 마운트되는 패널(인벤토리 등)에서도 훅 자체는 항상 호출하고, 그 패널이
 * 실제로 열려 있을 때만 true를 넘기면 된다 (React hooks 규칙 준수 + 정확한 해제).
 */
export function useInteractiveRegion<T extends HTMLElement>(id: string, active = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    regions.set(id, el);
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(el);

    return () => {
      ro.disconnect();
      regions.delete(id);
      sync();
    };
  }, [id, active]);

  return ref;
}
