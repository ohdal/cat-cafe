import { customerMultiplier } from "@/features/economy/factors";
import { totalGoldPerHour } from "@/features/economy/formulas";
import { useSumMenuIncome } from "@/features/menu/menuSelectors";
import { useCafeStore } from "@/features/cafe/useCafeStore";

/**
 * 손님 배수(리액티브). CUSTOMER_FACTORS 중 지금 실제로 store를 읽는 건 cafe-grade뿐이라
 * useCafeStore.level만 구독한다. 다른 factor가 실제 구현되면(꾸밈/고양이/알바생) 그 store도
 * 여기서 함께 구독해야 배수 변화가 리렌더에 반영된다.
 */
export function useCustomerMultiplier(): number {
  useCafeStore((s) => s.level);
  return customerMultiplier();
}

/** 해금 메뉴 수익 합 × 손님 배수. currency는 건드리지 않는다 — §1.5 참고. */
export function useGoldPerHour(): number {
  const sumIncome = useSumMenuIncome();
  const multiplier = useCustomerMultiplier();
  return totalGoldPerHour(multiplier, sumIncome);
}

export const useGoldPerSecond = () => useGoldPerHour() / 3600;
