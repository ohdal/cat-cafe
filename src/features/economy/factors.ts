import { cafeGradeMultiplier } from "@/features/economy/formulas";
import { useCafeStore } from "@/features/cafe/useCafeStore";

/** 손님 증가 요소 하나. 관련 store를 읽어 배수를 반환한다. 시스템이 아직 없으면 1.0 스텁. */
export interface CustomerFactor {
  id: string;
  label: string;
  multiplier: () => number;
}

/**
 * 손님 배수 레지스트리. cafe-grade만 실제 구현, 나머지는 스텁.
 * 확장 방법: 각 multiplier() 본문만 실제 store 참조로 교체(또는 새 factor push).
 * 경제 엔진·UI는 이 배열 길이·내용과 무관하게 동작 — 기존 코드 수정 없이 확장된다.
 */
export const CUSTOMER_FACTORS: CustomerFactor[] = [
  { id: "cafe-grade", label: "카페 등급", multiplier: () => cafeGradeMultiplier(useCafeStore.getState().level) },
  { id: "decoration", label: "꾸밈 점수", multiplier: () => 1 /* TODO: 꾸밈 시스템 연결 */ },
  { id: "cats", label: "고양이", multiplier: () => 1 /* TODO: 고양이 시스템 연결 */ },
  { id: "staff", label: "알바생", multiplier: () => 1 /* TODO: 알바생 시스템 연결 */ },
];

export const customerMultiplier = () => CUSTOMER_FACTORS.reduce((m, f) => m * f.multiplier(), 1);
