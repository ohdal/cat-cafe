import { useAccrualTicker } from "@/features/economy/useAccrualTicker";

/**
 * 화면에 아무것도 안 그리는, 초당 적립 루프만 도는 컴포넌트.
 * useGoldPerHour 리렌더가 이 컴포넌트 하나에 갇히도록 App 트리에서 분리해 둔다.
 * 앱 전체에서 딱 한 번만 마운트할 것 (interval 중복 방지).
 */
export default function AccrualTicker() {
  useAccrualTicker();
  return null;
}
