/**
 * 경제 시스템 전역 상수 + 순수 계산 함수.
 * React·store 의존 없음 — 값만 넣으면 값이 나온다.
 * 값의 근거(밸런스 시뮬레이션)는 plan/menu-economy/README.md 참고.
 */

/** 메뉴 레벨 1당 그 메뉴 수익 배수(등비). L0→L10 ≈ ×20. */
export const INCOME_GROWTH = 1.35;
/**
 * 메뉴 업그레이드 비용 기준 = 메뉴 기본수익 × 이 값.
 * catalog.ts의 baseIncomePerHour를 ×20 올리면서(초반 체감 수익 상향), 업그레이드
 * 비용은 그대로 유지하려고 이 값을 20으로 나눴다(2 → 0.1) — upgradeCost는
 * baseIncomePerHour에 정비례라 이렇게 해야 이전과 같은 비용이 나온다.
 */
export const UPGRADE_COST_FACTOR = 0.1;
/** 메뉴 레벨당 업그레이드 비용 증가율(등비). */
export const UPGRADE_COST_GROWTH = 1.6;
/** 메뉴 최대 레벨. */
export const MAX_MENU_LEVEL = 10;
/** 카페 최대 레벨. */
export const CAFE_MAX_LEVEL = 7;
/** 카페 레벨 1당 손님 배수 +0.5. */
export const CAFE_GRADE_WEIGHT = 0.5;
/** 신규 시작 골드(초반 페이싱용). */
export const STARTING_GOLD = 1000;
/** 오프라인 정산 상한(시간). */
export const MAX_OFFLINE_HOURS = 8;
/** 적립 tick 간격(ms). */
export const ACCRUAL_INTERVAL_MS = 1000;

/**
 * 오프라인 수익 정산 기능 스위치. 로직·스토어·모달은 다 구현하되,
 * 이 값이 false인 동안은 마운트 배선이 걸리지 않아 런타임에 정산이 돌지 않는다.
 * 나중에 켤 때는 이 값만 true로 바꾼다 (persist 스키마는 이미 확정되어 있음).
 */
export const OFFLINE_EARNINGS_ENABLED = false;

/** 메뉴의 레벨별 시간당 수익. */
export const menuIncomePerHour = (baseIncomePerHour: number, level: number) =>
  Math.round(baseIncomePerHour * INCOME_GROWTH ** level);

/** 메뉴를 해당 레벨로 올리는 데 드는 비용. */
export const upgradeCost = (baseIncomePerHour: number, level: number) =>
  Math.round(baseIncomePerHour * UPGRADE_COST_FACTOR * UPGRADE_COST_GROWTH ** level);

/** 카페 레벨 → 손님 배수(등급 효과). Lv1 = ×1.0, Lv7 = ×4.0. */
export const cafeGradeMultiplier = (cafeLevel: number) =>
  1 + CAFE_GRADE_WEIGHT * (cafeLevel - 1);

/** 손님 배수 × 해금 메뉴 수익 합 = 시간당 총수익. */
export const totalGoldPerHour = (customerMultiplier: number, sumMenuIncome: number) =>
  customerMultiplier * sumMenuIncome;

/** 시간당 총수익 → 초당 지급량. */
export const goldPerSecond = (customerMultiplier: number, sumMenuIncome: number) =>
  totalGoldPerHour(customerMultiplier, sumMenuIncome) / 3600;
