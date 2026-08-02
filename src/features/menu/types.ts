export type MenuCategory = "drink" | "cat-treat" | "cat-toy";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  /** 해금에 필요한 카페 레벨(= 층). 1~7. */
  floor: number;
  /** 레벨 0(기본) 시간당 수익. 해금 순서대로 상승. */
  baseIncomePerHour: number;
  icon: string;
}
