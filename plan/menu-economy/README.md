# 카페 레벨 · 메뉴 · 재화(경제) 시스템 (menu-economy)

방치형(idle) 게임의 **핵심 성장 루프의 백본**. 메뉴를 판매해 수익률을 만들고, 그 수익이 **매 초
재화로 적립**된다. 카페 레벨(1~7)을 올려 새 메뉴를 해금하고, 메뉴를 레벨업해 수익을 키운다.
서로 강하게 결합된 세 서브시스템을 함께 설계한다.

- **경제 엔진** — 수익률 계산 + 재화 적립(온라인 초당 tick / 오프라인 보정)
- **카페 레벨(확장)** — 1~7 레벨. **메뉴 해금의 게이트** + 손님 배수(등급 효과)
- **메뉴 시스템** — 메뉴마다 시간당 수익. 레벨업으로 상승, 카페 레벨에 따라 해금

> GDD 근거: [Desktop Nyan Cafe GCD](https://app.notion.com/p/3950702fa7f88055ba19f1150d06348d) 의
> `핵심 성장 축(카페 등급 1~7LV · Gold/Hour)`, `카페 운영`, `카페 확장`, `메뉴` 절.
> UI 레이아웃 참고: `plan/menu-economy/ref-cafe-menu.png` (원본: ChatGPT 시안 2026-07-20).

---

## ⚠️ 가장 중요한 개념: Gold/Hour 는 "표시", 지급은 "매 초"

- **Gold/Hour** 는 플레이어에게 보여주는 **성장 목표 지표**일 뿐이다. "1시간마다 몰아서 지급"이 아니다.
- **실제 재화는 매 초(연속) 적립**된다. 내부 지급 단위는 초:

  ```
  goldPerSecond = goldPerHour / 3600
  매 tick(1초): currency += goldPerSecond × 경과초
  ```

- UI 엔 `아메리카노 1시간당 120` 처럼 시간당으로 보여주지만, 뒤에서는 매 초 `120/3600 ≈ 0.033 Gold`
  씩 잔액이 오른다. (`1시간당` 은 성장 폭을 직관적으로 읽기 위한 환산 표기.)
- 잔액은 내부적으로 **소수까지 누적**하고, 화면에는 `Math.floor` 로 정수만 표시한다.

---

## 목표

- 카페가 **매 초 자동으로 재화를 벌어들이는** 방치형 루프를 완성한다 (손님은 자동 방문 = 집계 처리).
- **카페 레벨(1~7)** 을 올려 상위 층 메뉴를 순차 해금한다. 현재 카페 레벨에서 해금된 메뉴만 수익에 기여.
- 각 메뉴가 **자기만의 "1시간당 수익"** 을 가지며 **레벨업(→ 수익↑)** 으로 전체 Gold/Hour 를 키운다.
- **잠긴 메뉴도 리스트에 보여주되**(성장 목표 제시) 어두운 오버레이 + 자물쇠 + 클릭 불가로 구분한다.
- 아직 없는 손님 증가 요소(꾸밈 점수 · 고양이 · 알바생)가 **나중에 배수 계수로 끼워지도록** 확장한다.
- 앱을 껐다 켜도 **오프라인 동안의 수익**이 (초 단위 누적으로) 정산된다.

## GDD 요약 (설계 입력)

| 항목 | 내용 |
| --- | --- |
| 카페 등급 | **1LV ~ 7LV** (골목 → 외계인도 줄 서는 냥카페). 상승 시 카페 확장·해금·손님↑ |
| 재화 획득 | 음료 판매 / 고양이 간식 판매 / 고양이 장난감 판매 |
| 손님 처리 | **내부적으로 자동 방문** (개별 시뮬레이션 아님 → 집계 수치로 추상화) |
| 핵심 지표 | **Gold / Hour** — 표시용 지표(실지급은 초당). 신규 품종·메뉴가 이 값 기준으로 순차 해금 |
| 손님 증가 요소 | 카페 등급 · 메뉴 다양성 · 꾸밈 점수 · 고양이 수 · 고양이 상태 · 알바생 수 · 알바생 숙련도 |
| 메뉴 | 디저트 없음(음료 중심). **카페 확장(층)에 따라 음료 해금**, 레벨업 시 수익 상승, 해금 순서대로 기본 수익 상승 |
| 고양이 상품 | 간식 · 장난감 (판매 대상 = 메뉴에 포함) |
| 저장 | 최종적으로 SQLite + Steam Cloud (현재는 zustand persist / localStorage) |

## 핵심 설계 결정

1. **손님은 개별 엔티티로 시뮬레이션하지 않는다.** GDD의 "자동 방문"대로 **집계 수치**로 처리한다.
2. **메뉴별 수익 합산 모델** (← 참고 이미지 반영). 각 메뉴가 자기 "1시간당 수익"을 갖고, 전체
   Gold/Hour 는 **해금된 메뉴 수익의 합 × 손님 배수**:
   ```
   menuIncomePerHour(menu, level) = menu.baseIncomePerHour × INCOME_GROWTH^level   (L0→L10 ≈ ×20)
   totalGoldPerHour = customerMultiplier × Σ_unlockedMenu menuIncomePerHour
   goldPerSecond    = totalGoldPerHour / 3600
   ```
3. **카페 레벨(1~7)이 메뉴 해금 게이트.** `menu.floor ≤ cafeLevel` 인 메뉴만 **판매(수익 기여)**.
   그 위 층 메뉴는 리스트엔 보이되 잠금 상태(수익 0).
4. **메뉴 다양성은 합산 구조에 내재**되므로 별도 다양성 배수는 두지 않는다(이중 계산 방지).
5. **Gold/Hour 는 저장하지 않고 매번 파생(derive)**. 저장 대상은 `currency`, `cafeLevel`, 메뉴 `levels`,
   `lastSeenAt`, 레이트 스냅샷 등 최소값뿐.
6. **손님 배수 = 요소 레지스트리 곱**. `cafe-grade`(카페 레벨)만 지금 구현, 나머지(꾸밈/고양이/알바생)는
   1.0 스텁. 시스템이 생기면 구현만 채워 등록 → **기존 코드 수정 없이 확장**.
7. **재화 잔액의 단일 출처는 기존 `useGameStore.currency`.** 상점(`spendCurrency`)이 이미 의존 →
   깨지 않는다. 경제 엔진은 `addCurrency` 로 초당 수익을 적립.
8. **카페 확장의 "효과 전반"(배치 공간·최대 고양이 수 등)은 별도 계획**. 본 문서는 카페 레벨의
   **메뉴 해금 게이트 + 손님 배수 + 레벨업 조건/비용**까지만 다룬다.
9. **재화는 골드 단일.** 보조 재화(젬 등)는 존재하지 않는다.

---

## 데이터 흐름

```
   [useCafeStore.level]  (1~7)
        │  ├────────────────────────────► factors: cafe-grade multiplier = 1+0.5×(level-1)
        │  │
        ▼  │  게이트: menu.floor ≤ level
   [useMenuStore] 메뉴별 {level}
        │
        ▼
   Σ menuIncomePerHour(menu, lv)   (해금 메뉴만)      customerMultiplier = Π factor.multiplier()
        │              (활성 메뉴 합)                          │ (현재 = cafe-grade 하나)
        └───────────────────────┬────────────────────────────┘
                                ▼
        totalGoldPerHour = customerMultiplier × Σ menuIncome
        goldPerSecond    = totalGoldPerHour / 3600
                                │
                                ▼
        [useAccrualTicker]  매 1초  currency += goldPerSecond × dt   (온라인 초당 적립)
                                │
                                ▼
        [useGameStore.currency]  ◄── 오프라인 정산(로드 시 lastSeenAt 기준 초 단위 일괄 적립)
                                │
                                ├──► HUD · CafeMenu 헤더 Gold/Hour
                                └──► 상점·메뉴 업글·카페 확장 spendCurrency
```

---

## 밸런스 수치 (튜닝 대상, 임시값)

> 상수·기본수익은 `economy/formulas.ts`, `menu/catalog.ts`, `cafe/cafeCatalog.ts` 한 곳에 모아 둔다.

### 전역 상수

| 상수 | 값 | 의미 |
| --- | --- | --- |
| `INCOME_GROWTH` | **1.35** | 메뉴 레벨 1당 그 메뉴 수익 ×1.35(등비). L0→L10 ≈ ×20 (예: 10 → 201) |
| `UPGRADE_COST_FACTOR` | **2** | 메뉴 업그레이드 비용 기준 = 메뉴 기본수익 × 이 값 |
| `UPGRADE_COST_GROWTH` | **1.6** | 메뉴 레벨당 업그레이드 비용 증가율(등비) |
| `MAX_MENU_LEVEL` | **10** | 메뉴 최대 레벨(각 메뉴 10번 업그레이드) |
| `CAFE_MAX_LEVEL` | **7** | 카페 최대 레벨 |
| `CAFE_GRADE_WEIGHT` | **0.5** | 카페 레벨 1당 손님 배수 +0.5 (Lv7 = ×4.0) |
| `STARTING_GOLD` | **5,000** | 신규 시작 골드(초반 페이싱용). `useGameStore.currency` 초기값 |
| `MAX_OFFLINE_HOURS` | **8** | 오프라인 정산 상한(시간) |
| `ACCRUAL_INTERVAL_MS` | **1000** | 적립 tick 간격(1초) |

### 메뉴 기본 수익(1시간당, L0 · 해금 순서대로 상승) + 해금 층

값은 **L0(기본) 수익**이며, 최대 레벨(L10)에서 **약 ×20**(≈ base×20)이 천장. (가장 싼 메뉴 10 → 천장 ≈ 201)

| 층(해금 카페Lv) | 메뉴 (baseIncomePerHour, L0) |
| --- | --- |
| 1F (Lv1) | 아메리카노 10 · 카페라떼 12 · 바닐라 라떼 14 · 고양이 간식 10 · 고양이 장난감 18 |
| 2F (Lv2) | 자스민티 18 · 캐모마일티 20 · 얼그레이티 22 |
| 3F (Lv3) | 레몬 에이드 26 · 자몽 에이드 28 · 청포도 에이드 30 |
| 4F (Lv4) | 초코 라떼 36 · 말차 라떼 40 · 아이스티 44 |
| 5F (Lv5) | 크림 아인슈페너 52 · 솔티드 카라멜 라떼 58 · 헤이즐넛 모카 64 |
| 6F (Lv6) | 냥카라멜 프라페 74 · 냥자바칩 프라페 82 · 냥말차 프라페 90 |
| 7F (Lv7) | 딸기 프라페 105 · 발바닥 쿠키 프라페 118 · 우주냥 티라미수 프라페 130 |

### 메뉴 수익/업그레이드 비용 곡선 (예: 아메리카노 base=10)

`menuIncome = round(base × 1.35^level)`, `upgradeCost = round(base × 2 × 1.6^level)`

| 레벨 | 시간당 수익 | 이 레벨로 올리는 비용 |
| --- | --- | --- |
| L0 | 10 | — |
| L1 | 14 | 20 |
| L2 | 18 | 32 |
| L3 | 25 | 51 |
| L5 | 45 | 131 |
| L10 (천장) | 201 | 1,374 |

### 카페 확장 비용 (Lv N → N+1)

카페 레벨업은 **골드 비용만**으로 건다(모으면 확장 가능). GDD 의 "Gold/Hour 기준 순차 해금"은
**고양이 품종 해금**(별도 시스템)에서 쓰며, 확장에는 걸지 않는다 — 아래 [밸런스 분석](#진행-시뮬레이션--밸런스-분석)의
설계 노트 참고.

| 목표 Lv | 해금 층 | 골드 비용 |
| --- | --- | --- |
| 2 | 2F | 5,000 |
| 3 | 3F | 20,000 |
| 4 | 4F | 80,000 |
| 5 | 5F | 300,000 |
| 6 | 6F | 1,000,000 |
| 7 | 7F | 3,500,000 |

### 진행 단계별 총수익 예시 (메뉴 전부 L0, 카페 레벨별)

`sum = Σ 해금 메뉴 수익`, `mult = 1 + 0.5×(cafeLv-1)`, `Gold/Hour = mult × sum`

| 카페 Lv | 해금 메뉴 | 수익 합(L0) | 손님 배수 | **Gold/Hour** | **Gold/Sec** |
| --- | --- | --- | --- | --- | --- |
| 1 | 5 | 64 | ×1.0 | **64** | ≈0.018 |
| 2 | 8 | 124 | ×1.5 | **186** | ≈0.052 |
| 3 | 11 | 208 | ×2.0 | **416** | ≈0.116 |
| 4 | 14 | 328 | ×2.5 | **820** | ≈0.228 |
| 5 | 17 | 502 | ×3.0 | **1,506** | ≈0.418 |
| 6 | 20 | 748 | ×3.5 | **2,618** | ≈0.727 |
| 7 | 23 | 1,101 | ×4.0 | **4,404** | ≈1.22 |

> 위는 **전 메뉴 L0** 기준. 메뉴를 레벨업하면 최대 ×20까지 커진다(예: Lv7 + 전 메뉴 L10 →
> 1,101×20 ≈ 22,020 × 배수 4.0 ≈ **88,000 G/h**). GDD 예시(`4,850 → 랙돌 5,000`)는 Lv7 근처(또는
> 중간 레벨업 구간)에 해당.

> **⚠ 페이싱 메모**: 값이 작아지면서 시작 실지급이 매우 느리다(Lv1 = 64 G/h ≈ **0.018 G/s**). 이를
> **시작 골드 `STARTING_GOLD`=5,000** 지급으로 완화(채택): 첫 업그레이드 즉시, 첫 확장 30h→**약 9.6h**.
> 단, 시작 골드는 초반 벽만 없애고 Lv7 도달(~7일)엔 거의 영향 없다(총비용 530만 대비 미미). 전체
> 그라인드까지 줄이려면 (기본 수익 상향 / 비용 하향 / 표시단위 '1분당') 별도 조절 — **밸런싱에서 결정**.

---

## 진행 시뮬레이션 & 밸런스 분석

> 📊 **시각화**: [`analysis.html`](analysis.html) — 막대/선 그래프로 보기(브라우저로 열기).
>
> 위 상수/수치를 그대로 넣고 시뮬레이션한 결과. 가정: **그리디(ROI 최적) 전략 + 24시간 연속 방치,
> 시작 골드 0, 확장은 골드 비용만으로 게이팅**(설계 결정 — 아래 설계 노트 참고).

### 확정 수치 (계산값)

| 항목 | 값 |
| --- | --- |
| **최대 수익** (Lv7 + 전 메뉴 L10) | **88,552 G/h ≈ 24.6 골드/초** |
| 전 메뉴 L0→L10 업그레이드 총비용 | 399,849 gold |
| 카페 Lv1→7 확장 총비용 | 4,905,000 gold |
| **풀업까지 필요한 총 골드** | **약 530만 gold** (확장이 약 92%) |

### 카페 레벨별 최대 수익 (전 메뉴 L10 기준)

```
Lv1 ▏                                                      1,286 G/h  (0.36/s)
Lv2 ██                                                     3,738 G/h  (1.04/s)
Lv3 ████▉                                                  8,362 G/h  (2.32/s)
Lv4 █████████▋                                            16,485 G/h  (4.58/s)
Lv5 █████████████████▊                                    30,279 G/h  (8.41/s)
Lv6 ██████████████████████████████▉                       52,640 G/h (14.62/s)
Lv7 ████████████████████████████████████████████████████ 88,552 G/h (24.60/s)
```

레벨당 대략 **×1.7~1.9** 성장(등급배수 +0.5 + 신메뉴 해금 복합).

### 7층 도달까지 걸리는 시간 (누적, 24h 방치 · 시작골드 5,000)

```
Lv2 ███                                                    9.6시간
Lv3 █████████                                              1.3일
Lv4 ██████████████                                         2.0일
Lv5 ████████████████████                                   2.9일
Lv6 ██████████████████████████████                         4.4일
Lv7 ██████████████████████████████████████████████████     7.2일
전메뉴 풀업 완료 ────────────────────────────────────────    7.3일
```

> 실제론 **오프라인 상한(`MAX_OFFLINE_HOURS`=8)** 때문에 하루 8~16h만 적립되면 체감 **약 11~22일**.
> (시작골드별 비교는 아래 ⚠ 페이싱 표 참고.)

### ⚠ 페이싱 — 초반 지연 → 시작 골드로 완화

무보정 시 시작 0.018 G/s → 첫 업그레이드(20골드) ~18분, 첫 확장까지 ~30시간으로 초반이 답답하다.
**시작 골드 `STARTING_GOLD`=5,000** 지급으로 완화(채택). 시작 골드별 재시뮬:

| 시작 골드 | 첫 업글 | 첫 확장(Lv2) | Lv4 | Lv7 | 풀업 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 19분 | 30.3시간 | 2.9일 | 8.1일 | 8.2일 |
| 2,000 | 즉시 | 17.7시간 | 2.3일 | 7.6일 | 7.6일 |
| **5,000 (채택)** | **즉시** | **9.6시간** | 2.0일 | 7.2일 | 7.3일 |
| 10,000 | 즉시 | 즉시 | 37.7시간 | 6.8일 | 6.9일 |
| 50,000 | 즉시 | 즉시 | 18.9시간 | 6.0일 | 6.1일 |

- 10,000+ 는 시작하자마자 확장이 열려 김빠짐 → 5,000(=첫 확장 비용)이 균형점.
- **시작 골드는 초반 벽만 없앤다.** Lv7 도달은 5,000이어도 7.3일로 무보정(8.2일)과 큰 차이 없음
  (풀업 총비용 530만 대비 미미). 전체 그라인드를 줄이려면 기본 수익/비용/표시단위 등 별도 레버 필요.

> **참고**: 고양이 품종 해금의 Gold/Hour 요구치(별도 시스템)는 각 시점에 **도달 가능한 값**으로 잡을 것.
> 알바생은 2F 확장부터라 초반(1F) 관문은 꾸밈·고양이 배수로만 커버된다.

> 위 시뮬레이션 로직·전략(그리디 ROI)은 참고용 어림치이며, 실제 밸런싱은 목표 플레이 기간을 정한 뒤
> 상수를 역산해 확정한다.

---

## 서브시스템 A — 경제 엔진 (`features/economy/`)

### A-1. 수익 공식 (`formulas.ts`, 순수 함수)

```ts
export const INCOME_GROWTH = 1.35;   // 레벨당 ×1.35, L0→L10 ≈ ×20
export const UPGRADE_COST_FACTOR = 2;
export const UPGRADE_COST_GROWTH = 1.6;
export const MAX_MENU_LEVEL = 10;
export const CAFE_MAX_LEVEL = 7;
export const CAFE_GRADE_WEIGHT = 0.5;
export const MAX_OFFLINE_HOURS = 8;
export const ACCRUAL_INTERVAL_MS = 1000;

export const menuIncomePerHour = (baseIncome: number, level: number) =>
  Math.round(baseIncome * INCOME_GROWTH ** level);

export const upgradeCost = (baseIncome: number, level: number) =>
  Math.round(baseIncome * UPGRADE_COST_FACTOR * UPGRADE_COST_GROWTH ** level);

/** 카페 레벨 → 손님 배수(등급 효과). */
export const cafeGradeMultiplier = (cafeLevel: number) =>
  1 + CAFE_GRADE_WEIGHT * (cafeLevel - 1);

export const totalGoldPerHour = (multiplier: number, sumMenuIncome: number) =>
  multiplier * sumMenuIncome;

export const goldPerSecond = (multiplier: number, sumMenuIncome: number) =>
  totalGoldPerHour(multiplier, sumMenuIncome) / 3600;
```

### A-2. 손님 증가 요소 레지스트리 (`factors.ts`) — 확장 핵심

메뉴 다양성은 합산 구조에 내재되므로 제외. **카페 등급만 지금 구현**, 나머지는 스텁.

```ts
export interface CustomerFactor {
  id: string;                 // "cafe-grade" | "decoration" | "cats" | "staff" ...
  label: string;
  multiplier: () => number;   // 관련 store 를 읽어 배수 반환. 시스템 없으면 1.0
}

export const CUSTOMER_FACTORS: CustomerFactor[] = [
  { id: "cafe-grade", label: "카페 등급",
    multiplier: () => cafeGradeMultiplier(useCafeStore.getState().level) },   // 구현됨
  { id: "decoration", label: "꾸밈 점수", multiplier: () => 1 /* TODO */ },
  { id: "cats",       label: "고양이",    multiplier: () => 1 /* TODO */ },
  { id: "staff",      label: "알바생",    multiplier: () => 1 /* TODO */ },
];

export const customerMultiplier = () =>
  CUSTOMER_FACTORS.reduce((m, f) => m * f.multiplier(), 1);
```

> **확장 방법**: 각 `multiplier()` 본문만 실제 store 참조로 교체(또는 새 factor push). 경제 엔진·UI 불변.
> 요소별 배수를 CafeMenu "수익 상세"에 나열해 "무엇을 올리면 손님이 느는지" 노출 가능.

### A-3. 파생 selector (`goldPerHour.ts`)

```ts
export function useGoldPerHour(): number {
  const sumIncome = useSumMenuIncome();     // 해금 메뉴 수익 합 (useMenuStore + useCafeStore)
  const multiplier = useCustomerMultiplier();
  return totalGoldPerHour(multiplier, sumIncome);
}
export const useGoldPerSecond = () => useGoldPerHour() / 3600;
```

### A-4. 초당 적립 (`useAccrualTicker.ts`)

**매 초** 경과 시간만큼 재화 적립(dt 기반이라 지연에도 총량 정확).

```ts
export function useAccrualTicker() {
  const gph = useGoldPerHour();
  const addCurrency = useGameStore((s) => s.addCurrency);
  const gphRef = useRef(gph); gphRef.current = gph;

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000; last = now;
      addCurrency((gphRef.current / 3600) * dt);   // 초당 지급 × 경과초
    }, ACCRUAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [addCurrency]);
}
```

- `currency` 는 소수까지 누적, **표시에서만 `Math.floor`**. 백그라운드 공백은 오프라인 정산이 흡수.

### A-5. 오프라인 정산

- `useGameStore` 에 `lastSeenAt`(epoch ms) + `goldPerHourAtSave`(레이트 스냅샷) 추가.
- **저장 시점**(정기 10초 + `visibilitychange`/`beforeunload`): `lastSeenAt=Date.now()`,
  `goldPerHourAtSave=현재 Gold/Hour`.
- **앱 로드**(rehydrate 직후):
  ```
  elapsedSec  = clamp((Date.now()-lastSeenAt)/1000, 0, MAX_OFFLINE_HOURS*3600)
  offlineGold = (goldPerHourAtSave/3600) * elapsedSec
  addCurrency(offlineGold)  →  OfflineEarningsModal "n시간 m분 동안 +N Gold"
  ```
- 오프라인 중엔 레이트 불변 → 저장 시점 레이트로 정산이 정확. `MAX_OFFLINE_HOURS` 는 나중에 카페
  레벨로 확대 가능.

### A-6. 상태 (`useGameStore` 확장)

```ts
interface GameState {
  currency: number;              // 내부 소수 허용. 초기값 = STARTING_GOLD(5,000)
  lastSeenAt: number;            // (신규) 오프라인 정산 기준 시각
  goldPerHourAtSave: number;     // (신규) 오프라인 정산용 레이트 스냅샷
  addCurrency(n: number): void;
  spendCurrency(n: number): boolean;
  markSeen(gph: number): void;
  settleOffline(): number;
}
// persist: currency, lastSeenAt, goldPerHourAtSave  (version++)
```

---

## 서브시스템 B — 카페 레벨(확장) (`features/cafe/`)

메뉴 해금의 게이트이자 손님 배수(등급 효과)의 원천. 확장의 **전반 효과**(배치 공간·최대 고양이 등)는
별도 계획이며, 여기선 레벨 값 · 해금 게이트 · 레벨업 조건/비용만 정의한다.

### B-1. 상태 (`useCafeStore.ts`)

```ts
interface CafeState {
  level: number;             // 1 ~ CAFE_MAX_LEVEL, 시작 1
  expandCost(): number;      // 다음 레벨 골드 비용
  expand(): boolean;         // 골드 비용 충족 시 spendCurrency → level+1
}
// persist: level  (version++)
```

- `expand`: `level < CAFE_MAX_LEVEL` && `spendCurrency(expandCost())` → `level+1`. **골드 비용만** 게이팅.
- 비용은 `cafe/cafeCatalog.ts` 의 위 "카페 확장 비용" 표에서 조회.
- Gold/Hour 요구치는 확장이 아니라 **고양이 품종 해금**(별도 시스템)에서 사용한다.

### B-2. 해금 게이트

```ts
export const isMenuUnlocked = (menu: MenuItem, cafeLevel: number) => menu.floor <= cafeLevel;
```

- **수익 계산**은 해금 메뉴만 합산(`Σ_unlockedMenu`). 잠긴 메뉴는 수익 0.
- **UI 는 전 메뉴를 노출**하되 잠긴 메뉴를 시각적으로 구분(아래 D-2).

### B-3. 확장 UI (범위 메모)

카페 레벨업 버튼/화면은 별도(예: HUD 의 카페 레벨 뱃지 또는 확장 전용 모달)로 두되, 본 계획에선
`useCafeStore.expand` API 까지만 확정. CafeMenu 에는 잠긴 메뉴 오버레이의 "{floor}F에서 해금" 문구로만 반영.

---

## 서브시스템 C — 메뉴 시스템 (`features/menu/`)

### C-1. 카탈로그 (`catalog.ts`)

위 "메뉴 기본 수익" 표를 데이터화(7층 전부 정의, 해금은 카페 레벨 게이팅). `decor/*/catalog.ts` 패턴.

```ts
export type MenuCategory = "drink" | "cat-treat" | "cat-toy";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  floor: number;             // 해금 층 = 필요 카페 레벨 (1~7)
  baseIncomePerHour: number; // 해금 순서대로 상승
  icon: string;              // 임시 이모지 → 이후 픽셀아트
}

export const DRINKS: MenuItem[] = [
  { id: "americano",     name: "아메리카노",  category: "drink", floor: 1, baseIncomePerHour: 200, icon: "☕" },
  { id: "cafe-latte",    name: "카페라떼",    category: "drink", floor: 1, baseIncomePerHour: 240, icon: "🥛" },
  { id: "vanilla-latte", name: "바닐라 라떼", category: "drink", floor: 1, baseIncomePerHour: 280, icon: "🍶" },
  // 2F(340/370/400) … 7F(1400/1500/1600)
];

export const CAT_PRODUCTS: MenuItem[] = [
  { id: "treat-basic", name: "고양이 간식",   category: "cat-treat", floor: 1, baseIncomePerHour: 150, icon: "🍪" },
  { id: "toy-basic",   name: "고양이 장난감", category: "cat-toy",   floor: 1, baseIncomePerHour: 320, icon: "🧶" },
];

export const MENU_LIST = [...DRINKS, ...CAT_PRODUCTS];
```

### C-2. 진행 상태 (`useMenuStore.ts`)

```ts
interface MenuState {
  levels: Record<string, number>;   // id → 레벨(없으면 0)
  levelOf(id: string): number;
  incomeOf(id: string): number;     // menuIncomePerHour(base, level)
  upgradeCostOf(id: string): number;
  upgrade(id: string): boolean;     // 해금+비용 충족 시 spendCurrency → level+1 (MAX_MENU_LEVEL 상한)
}
// persist: levels  (version++).  ※ 해금 여부는 useCafeStore.level 로 파생(중복 저장 안 함)
```

- `upgrade`: `isMenuUnlocked(menu, useCafeStore.getState().level)` && 잔액 충족일 때만.

### C-3. selector (`menuSelectors.ts`)

```ts
export const selectUnlockedMenus = (cafeLevel: number) =>
  MENU_LIST.filter((m) => isMenuUnlocked(m, cafeLevel));

export const useSumMenuIncome = () => {
  const cafeLevel = useCafeStore((s) => s.level);
  const levels = useMenuStore((s) => s.levels);
  return selectUnlockedMenus(cafeLevel)
    .reduce((a, m) => a + menuIncomePerHour(m.baseIncomePerHour, levels[m.id] ?? 0), 0);
};
```

---

## 서브시스템 D — CafeMenu UI (`components/Menu/CafeMenuPanel.tsx`)

메뉴판(`MenuBoard`) 클릭 → 기존 `cafeMenu` 모달 재사용. **참고 이미지(`ref-cafe-menu.png`) 레이아웃**을 따른다.

### D-1. 레이아웃

```
┌──────────────────────────────────────────────────────────┐
│                   ☕ 카페 메뉴 ☕                      [X] │
├──────────────────────────────────────────────────────────┤
│ ┌────┐ 아메리카노       Lv.7    [▓▓▓▓▓▓▓░░░ 7/10] ┌────────┐│
│ │icon│ 🪙1시간당 45                            │업그레이드 ││  ← 해금 메뉴 행
│ └────┘                                          │🪙131   ││
│ ┌────┐ 자스민티        ▒▒▒▒▒▒▒▒ 🔒 2F에서 해금 ▒▒▒▒▒▒▒▒ │  ← 잠긴 메뉴(어두운 오버레이+자물쇠)
├──────────────────────────────────────────────────────────┤
│      ☆ 메뉴 레벨이 높을수록 1시간당 벌어들이는 골드가 증가합니다.  │
└──────────────────────────────────────────────────────────┘
```

- **그룹 헤더 없음.** 전 메뉴를 한 스크롤 리스트에 층 순서대로 나열(해금된 것 먼저 → 잠긴 것 뒤).
  층/카페등급 표시는 **잠긴 메뉴 오버레이의 `{floor}F에서 해금` 문구로만** 표현한다.
- **해금 메뉴 행(4블록)**: ① 아이콘 타일 ② 이름 + 🪙1시간당 `incomeOf` ③ `Lv.N` + 진행바
  (`level/MAX_MENU_LEVEL`, 예: `7/10`) ④ 초록 `업그레이드` 버튼 + 🪙`upgradeCostOf`.
  - **레벨업 = 곧 진행. 별도 경험치 개념 없음** — 업그레이드 1회 = 레벨 +1, 진행바는 `level/10` 단순 표시.
  잔액 부족·최대레벨이면 버튼 disabled(회색). 상점 `ShopItem` disabled 스타일 재사용.
- **모달 헤더**(선택): 타이틀 아래 "현재 총수익 N Gold/Hour"(`useGoldPerHour`) 한 줄.
- 스크롤 영역엔 `.no-scrollbar` 유틸 재사용, `ModalOverlay` 로 감싼다.

### D-2. 잠긴 메뉴 표시 (요구사항)

잠긴 메뉴(`floor > cafeLevel`)도 **리스트에 노출**하되:

```tsx
<div className="relative ...행...">
  {/* 메뉴 내용(이름/수익 등)은 그대로 렌더 — 뒤에 비쳐 보이게 */}
  {locked && (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-[#000000b3]">
      <span className="text-lg">🔒</span>
      <span className="ml-1 text-[11px] text-slate-200">{menu.floor}F에서 해금</span>
    </div>
  )}
</div>
```

- **어두운 오버레이**: `bg-[#000000b3]`(순정 hex — 슬래시 투명도 금지, 프로젝트 규칙).
- **자물쇠 아이콘**(🔒) + 해금 조건 문구.
- **클릭 disabled**: 오버레이가 `inset-0` 로 덮어 pointer 차단 + 업그레이드 버튼 자체도 `disabled`.
  (오버레이는 클릭 흡수만, 하단 메뉴 행으로 이벤트 전달 안 함.)

---

## 파일 구조 (예정)

```
src/
├─ features/
│  ├─ economy/
│  │  ├─ formulas.ts          # 상수 + menuIncome/upgradeCost/cafeGradeMultiplier/total|goldPerSecond
│  │  ├─ factors.ts           # CustomerFactor 레지스트리(cafe-grade 구현 + 나머지 스텁)
│  │  ├─ goldPerHour.ts       # useGoldPerHour / useGoldPerSecond / useCustomerMultiplier
│  │  ├─ useAccrualTicker.ts  # 1초 간격 적립 훅
│  │  └─ OfflineEarningsModal.tsx
│  ├─ cafe/
│  │  ├─ cafeCatalog.ts       # 카페 레벨별 해금 층·확장 골드 비용·등급명
│  │  └─ useCafeStore.ts      # level(1~7) + expandCost/expand (골드 비용만)
│  └─ menu/
│     ├─ types.ts             # MenuItem / MenuCategory
│     ├─ catalog.ts           # 7F 음료 + 고양이 상품 (기본 수익 표)
│     ├─ useMenuStore.ts      # levels + incomeOf/upgradeCostOf/upgrade
│     └─ menuSelectors.ts     # unlockedMenus / sumMenuIncome / isMenuUnlocked
├─ store/
│  └─ useGameStore.ts         # (확장) lastSeenAt, goldPerHourAtSave, markSeen, settleOffline
└─ components/Menu/
   └─ CafeMenuPanel.tsx       # CafeMenu 모달 내용(층 그룹 + 잠긴 메뉴 오버레이)
```

> ※ 기존 `features/cafe/` 에는 씬 컴포넌트(Wall/Floor/Counter…)가 있다. 카페 레벨 로직은 같은 폴더에
> `useCafeStore.ts`/`cafeCatalog.ts` 로 추가하거나, 충돌 피하려면 `features/cafe-level/` 로 분리해도 됨.

---

## 구현 단계

1. **경제 순수 계층** — `economy/formulas.ts`(상수+공식), `economy/factors.ts`(cafe-grade 구현 + 스텁).
2. **카페 레벨** — `cafe/cafeCatalog.ts`(층·비용·요구치·등급명) + `useCafeStore.ts`(persist).
3. **메뉴 데이터/상태** — `menu/types.ts` + `catalog.ts`(7F 전부) + `useMenuStore.ts`(persist) +
   `menuSelectors.ts`(`isMenuUnlocked`/`useSumMenuIncome`).
4. **Gold/Hour·Gold/Sec 셀렉터** — `economy/goldPerHour.ts` (cafe+menu+factors 결합).
5. **재화 store 확장** — `useGameStore` 에 오프라인 필드/액션 추가(version++).
6. **초당 적립** — `useAccrualTicker`(1초) + 앱 루트 마운트. `CurrencyDisplay` `Math.floor` 표시.
7. **오프라인 정산** — 로드시 `settleOffline` + `OfflineEarningsModal`, `markSeen` 훅 연결.
8. **CafeMenu UI** — `CafeMenuPanel`(층 그룹 + 해금 메뉴 행 + **잠긴 메뉴 오버레이/자물쇠/disabled**).
9. **카페 확장 트리거** — `useCafeStore.expand` 를 부를 UI(레벨 뱃지/확장 모달)는 후속. API 는 이번에 확정.
10. **밸런싱 패스** — 수치 튜닝(초반 체감·업그레이드 곡선·확장 비용/요구치·오프라인 상한).

## 검증 (수동)

- [ ] 카페 Lv.1 → 1F 메뉴만 해금(수익 기여), 2F+ 는 **잠금 표시로 노출**(어두운 오버레이+🔒+클릭불가)
- [ ] **방치 중 잔액이 매 초 goldPerSecond 만큼 증가**(표시 정수, 내부 소수 누적)
- [ ] 메뉴 업그레이드 → 재화 차감, 그 메뉴 수익↑, 총 Gold/Hour 즉시 상승
- [ ] 카페 확장(`expand`) → 상위 층 메뉴 해금 + 손님 배수↑(cafe-grade) 로 총수익 상승
- [ ] 카페 확장은 **골드 비용만** 게이팅 — 비용 미달 시 확장 불가, 모으면 확장 가능
- [ ] 앱 종료 후 재실행 → 경과 초만큼 오프라인 수익 정산 + 요약 모달(상한 적용)
- [ ] 상점 구매(`spendCurrency`)가 기존대로 동작(잔액 단일 출처)
- [ ] 시작 수치 검증: 카페 Lv.1, 5메뉴 전부 L0 → 약 **64 G/h ≈ 0.018 G/s**

## 확장 포인트 (미래 시스템 연결)

| 미래 시스템 | 연결 방법 |
| --- | --- |
| 카페 확장 효과 | `useCafeStore.level` 을 배치 공간·최대 고양이 수·손님 등 각 시스템이 참조(별도 계획) |
| 고양이 | `factors.cats.multiplier()` 에 (수 × 상태) 반영 |
| 알바생 | `factors.staff.multiplier()` 에 (수 × 숙련도) 반영 |
| 꾸밈 점수 | 가구별 꾸밈 점수 합 → `factors.decoration.multiplier()` |
| Gold/Hour 해금(품종) | `useCafeStore`/품종 store 의 해금 조건에 `goldPerHour ≥ 조건` 재사용 |
| 손님 연출 | 집계 수치와 분리된 순수 시각 레이어 — 경제 계산 불변 |
| SQLite/Cloud | store persist 를 storage 어댑터로 교체(값 접근은 store 경계 안이라 UI 무영향) |

## 미결정 / 추후 결정

- 초반 페이싱(위 ⚠ 페이싱): 기본 수익/시작 골드/업그레이드 비용/표시 단위 중 무엇으로 조절할지
- 카페 확장 골드 비용 곡선 (확장은 골드만으로 확정) — **재조정 보류**: 상점 요소 판매 / 알바생 고용 /
  꾸밈 점수 시스템까지 구현된 뒤(수익 속도가 바뀌므로) 확장비용을 다시 잡는다. 현재 값(5k~3.5M)은 임시.
- 고양이 품종 해금의 Gold/Hour 요구치 곡선 (각 시점 도달 가능하게)
- 카페 등급 손님 배수 가중치(`CAFE_GRADE_WEIGHT`), 메뉴 수익 지수(현재 등비 1.35), 메뉴 최대 레벨
- 오프라인 상한/등급별 확대, 오프라인 수익률 감쇠(예: 50%) 적용 여부
- 저장소 전환 시점(zustand persist → SQLite + Steam Cloud)
```
