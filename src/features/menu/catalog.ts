import type { MenuItem } from "@/features/menu/types";

/**
 * 메뉴 기본 수익(1시간당, L0) 표. plan/menu-economy/README.md "메뉴 기본 수익" 표(아메리카노 10 기준)에
 * ×3 스케일(아메리카노 30 채택)을 적용한 값. 해금 순서(floor)대로 baseIncomePerHour가 상승한다.
 */
export const DRINKS: MenuItem[] = [
  // 1F (Lv1)
  { id: "americano", name: "아메리카노", category: "drink", floor: 1, baseIncomePerHour: 30, icon: "☕" },
  { id: "cafe-latte", name: "카페라떼", category: "drink", floor: 1, baseIncomePerHour: 36, icon: "🥛" },
  { id: "vanilla-latte", name: "바닐라 라떼", category: "drink", floor: 1, baseIncomePerHour: 42, icon: "🍶" },
  // 2F (Lv2)
  { id: "jasmine-tea", name: "자스민티", category: "drink", floor: 2, baseIncomePerHour: 54, icon: "🍵" },
  { id: "chamomile-tea", name: "캐모마일티", category: "drink", floor: 2, baseIncomePerHour: 60, icon: "🍵" },
  { id: "earlgrey-tea", name: "얼그레이티", category: "drink", floor: 2, baseIncomePerHour: 66, icon: "🍵" },
  // 3F (Lv3)
  { id: "lemon-ade", name: "레몬 에이드", category: "drink", floor: 3, baseIncomePerHour: 78, icon: "🍋" },
  { id: "grapefruit-ade", name: "자몽 에이드", category: "drink", floor: 3, baseIncomePerHour: 84, icon: "🍊" },
  { id: "green-grape-ade", name: "청포도 에이드", category: "drink", floor: 3, baseIncomePerHour: 90, icon: "🍏" },
  // 4F (Lv4)
  { id: "choco-latte", name: "초코 라떼", category: "drink", floor: 4, baseIncomePerHour: 108, icon: "🍫" },
  { id: "matcha-latte", name: "말차 라떼", category: "drink", floor: 4, baseIncomePerHour: 120, icon: "🍵" },
  { id: "iced-tea", name: "아이스티", category: "drink", floor: 4, baseIncomePerHour: 132, icon: "🧊" },
  // 5F (Lv5)
  { id: "cream-einspanner", name: "크림 아인슈페너", category: "drink", floor: 5, baseIncomePerHour: 156, icon: "🍮" },
  { id: "salted-caramel-latte", name: "솔티드 카라멜 라떼", category: "drink", floor: 5, baseIncomePerHour: 174, icon: "🍯" },
  { id: "hazelnut-mocha", name: "헤이즐넛 모카", category: "drink", floor: 5, baseIncomePerHour: 192, icon: "🌰" },
  // 6F (Lv6)
  { id: "nyan-caramel-frappe", name: "냥카라멜 프라페", category: "drink", floor: 6, baseIncomePerHour: 222, icon: "🐾" },
  { id: "nyan-javachip-frappe", name: "냥자바칩 프라페", category: "drink", floor: 6, baseIncomePerHour: 246, icon: "🐾" },
  { id: "nyan-matcha-frappe", name: "냥말차 프라페", category: "drink", floor: 6, baseIncomePerHour: 270, icon: "🐾" },
  // 7F (Lv7)
  { id: "strawberry-frappe", name: "딸기 프라페", category: "drink", floor: 7, baseIncomePerHour: 315, icon: "🍓" },
  { id: "paw-cookie-frappe", name: "발바닥 쿠키 프라페", category: "drink", floor: 7, baseIncomePerHour: 354, icon: "🐈" },
  { id: "cosmic-nyan-tiramisu-frappe", name: "우주냥 티라미수 프라페", category: "drink", floor: 7, baseIncomePerHour: 390, icon: "✨" },
];

export const CAT_PRODUCTS: MenuItem[] = [
  { id: "treat-basic", name: "고양이 간식", category: "cat-treat", floor: 1, baseIncomePerHour: 30, icon: "🍪" },
  { id: "toy-basic", name: "고양이 장난감", category: "cat-toy", floor: 1, baseIncomePerHour: 54, icon: "🧶" },
];

export const MENU_LIST: MenuItem[] = [...DRINKS, ...CAT_PRODUCTS];
