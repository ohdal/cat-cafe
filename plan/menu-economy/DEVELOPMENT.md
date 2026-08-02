# menu-economy 개발계획서

> **왜 이렇게 설계했나**(GDD 근거·밸런스 수치)는 [`README.md`](./README.md).
> 이 문서는 **런타임에 무슨 일이 일어나는가**와 **그걸 코드로 어떻게 만드나**만 다룬다.

---

## 0. 한 문장 요약

> 화면의 🪙 숫자가 **매 초 스스로 올라간다.** 올라가는 속도(초당 얼마)는
> "해금된 메뉴들의 시간당 수익 합 × 손님 배수 ÷ 3600"이고, 메뉴를 올리거나
> 카페를 확장하면 그 속도가 빨라진다.
> (앱을 꺼도 정산해주는 **오프라인 수익은 이번엔 로직만 만들고 꺼둔다** — §4.)

이 문서의 나머지는 저 한 문장을 이루는 4개 조각을 **동작 → 구현** 순서로 설명한다.

---

## 1. 매 초 재화 카운트 — 핵심 루프 (당신이 요청한 부분)

### 무슨 일을 하나 (동작)

- CurrencyDisplay의 🪙 숫자가 대략 1초마다 조금씩 올라간다.
- 초당 증가량 = `goldPerSecond = goldPerHour / 3600`.
  - 예) 시작(카페 Lv1, 전메뉴 L0) = 192 G/h → **초당 약 0.053골드**. 눈에는 몇 초에 1씩 오르는 것처럼 보인다.
- 메뉴 업그레이드/카페 확장으로 `goldPerHour`가 커지면 **다음 초부터 즉시** 더 빨리 오른다.

### 어떻게 구현하나 (기법과 이유)

순진하게 `setInterval(() => addCurrency(gph/3600), 1000)` 로 짜면 두 가지가 깨진다:

1. **틱이 늦으면 돈이 샌다.** 탭이 백그라운드로 밀리거나 렌더가 무거우면 콜백이 1.4초 뒤에 올 수도 있는데,
   "무조건 1초 지났다" 가정으로 더하면 그만큼 덜 준다.
2. **`gph`가 낡는다.** 클로저에 캡처된 `gph`는 업그레이드해도 옛날 값 그대로다.

그래서 **경과시간(dt) 기반 적립 + 최신값 ref** 두 가지로 짠다. `features/economy/useAccrualTicker.ts`:

```ts
export function useAccrualTicker() {
  const gph = useGoldPerHour();                 // 파생값: 지금의 시간당 수익
  const addCurrency = useGameStore((s) => s.addCurrency);

  // gph가 바뀌어도 interval을 다시 만들지 않으려고 ref에 최신값만 흘려넣는다.
  const gphRef = useRef(gph);
  gphRef.current = gph;

  useEffect(() => {
    let last = performance.now();               // 단조 증가 시계 (시스템 시간 변경에 안 흔들림)
    const id = setInterval(() => {
      const now = performance.now();
      const dtSec = (now - last) / 1000;        // 실제로 흐른 초 (1.0일 수도, 1.4일 수도)
      last = now;
      addCurrency((gphRef.current / 3600) * dtSec); // "초당 수익 × 실제 흐른 초"
    }, ACCRUAL_INTERVAL_MS /* 1000 */);
    return () => clearInterval(id);             // ← StrictMode 이중 마운트/언마운트 시 누수 방지
  }, [addCurrency]);                            // deps는 안정적 → interval은 세션당 1개
}
```

**왜 이렇게 하면 맞나:**
- `dtSec` 기반이라 콜백이 얼마나 늦든 **총 적립량은 항상 정확**하다 (지연은 다음 틱이 흡수).
- `gphRef.current`를 읽으므로 업그레이드 직후 값이 바로 반영되고, **interval은 재생성 안 된다** (deps=`[addCurrency]`, 안정적).
- `performance.now()`는 유저가 시계를 바꿔도 안 흔들린다. (오프라인 정산은 반대로 `Date.now()`를 쓴다 — §4에서 이유 설명.)

### 어디에 마운트하나 (리렌더 격리)

훅을 `App`에서 직접 부르지 **않는다.** `useGoldPerHour()`를 구독하는 훅이므로, 업그레이드로 gph가 바뀔 때마다
그 훅을 부른 컴포넌트가 리렌더된다 — App에서 부르면 App 서브트리 전체가 대상이 된다.

대신 **아무것도 안 그리는 전용 컴포넌트로 격리**한다:

```tsx
/** 화면에 아무것도 안 그리는, 적립 루프만 도는 컴포넌트. */
function AccrualTicker() {
  useAccrualTicker();
  return null;
}
// App: {screen === "main" && <AccrualTicker />}   ← 딱 한 번만 마운트
```

이러면 gph 변화로 인한 리렌더가 `null` 반환 컴포넌트 하나에 갇힌다 (실제 DOM 작업 0). interval도 세션당 1개.

### 소수 누적 vs 정수 표시 (중요)

- `currency`는 내부적으로 **소수까지 누적**한다 (예: `1000.053...`). 반올림하지 않는다.
- 화면에만 정수로: `CurrencyDisplay`에서 `Math.floor(currency).toLocaleString()`. (연출은 **툭툭 정수만** — 결정됨.)
- 지금 `CurrencyDisplay`는 `amount` prop placeholder → **store 직접 구독하는 잎(leaf) 컴포넌트**로 교체.
  아래 §1.5의 격리 규칙을 따른다.

> 매 초 리렌더 범위를 어떻게 잎 하나로 가두는지는 다음 §1.5에서 정리한다.

---

## 1.5 리렌더 격리 — 컴포넌트 분리 / 훅 분리 / 메모이제이션

매 초 `currency`가, 그리고 업그레이드마다 `levels`/`level`이 바뀐다. **"바뀌는 값을 읽는 잎만 리렌더"** 되도록
아래 3원칙으로 구독을 잘게 쪼갠다. 목표: 방치 중엔 🪙 숫자 잎 하나만, 업그레이드 시엔 해당 행만 리렌더.

### 원칙 1 — 자주 바뀌는 값은 가장 작은 잎에서만 구독

| 값 | 바뀌는 주기 | 구독해도 되는 곳(잎) | 구독하면 안 되는 곳 |
| --- | --- | --- | --- |
| `currency` | 매 초 | `CurrencyDisplay`, 업그레이드 버튼의 "구매가능" 판정 | 패널/행 본문, 씬, HUD |
| `goldPerHour`(파생) | 업그레이드/확장 시 | `AccrualTicker`(null), 헤더의 총수익 텍스트 잎 | App 서브트리, 행 본문 |
| `levels[id]` | 그 메뉴 업그레이드 시 | 그 메뉴 행 하나 | 다른 메뉴 행 |

- **currency는 절대 패널/행 본문에서 통째로 읽지 않는다.** 읽으면 매 초 그 컴포넌트 전체가 리렌더된다.
- 업그레이드 버튼만 currency를 구독하는 **분리된 잎**으로 뺀다:
  ```tsx
  // 행 본문(아이콘/이름/수익/진행바)은 currency를 모른다 → 매 초 리렌더 안 됨.
  const UpgradeButton = React.memo(function UpgradeButton({ cost, onBuy, disabled }) {
    const canAfford = useGameStore((s) => s.currency >= cost); // boolean만 구독
    return <button disabled={disabled || !canAfford} onClick={onBuy}>…</button>;
  });
  ```
  `s.currency >= cost` 로 **boolean을 셀렉트**하므로, 잔액이 cost 경계를 넘는 순간에만 리렌더된다
  (매 초 값이 올라도 boolean이 안 바뀌면 리렌더 없음 — zustand는 셀렉터 결과가 같으면 스킵).

### 원칙 2 — 행은 자기 것만 구독 + `React.memo`

```tsx
// 각 행은 자기 메뉴의 level만 구독 → 다른 메뉴 업그레이드해도 이 행은 안 움직인다.
const level = useMenuStore((s) => s.levels[id] ?? 0);
```
- `useMenuStore((s) => s.levels)` 처럼 **맵 전체를 구독하지 말 것** — 아무 메뉴나 오르면 전 행이 리렌더된다.
- `MenuRow`는 `React.memo`. props는 원시값(id·name·base·floor·level·unlocked)만 넘겨 얕은 비교가 통하게 한다.

### 원칙 3 — 파생 계산은 메모, 셀렉터는 안정적으로

- 리스트 필터는 `useMemo`: `const rows = useMemo(() => selectUnlockedMenus(cafeLevel), [cafeLevel])`.
  (`MENU_LIST.filter`를 매 렌더 다시 돌리지 않는다.)
- 객체/배열을 셀렉트할 땐 `zustand/shallow`로 얕은 비교를 걸어 참조만 바뀐 리렌더를 막는다.
- 셀렉터 함수는 모듈 상수나 `useCallback`으로 **안정적 참조** 유지 → 불필요한 재구독 방지.
- `AccrualTicker`는 gph를 **`useRef`로만** 소비하므로(§1) gph가 바뀌어도 interval은 안 끊기고, 리렌더돼도 `null`이라 비용 0.

### 훅 분리 (누가 무엇을 구독하는지 고정)

| 훅 | 구독 | 소비처 | 매 초 리렌더? |
| --- | --- | --- | --- |
| `useGoldPerHour` | `levels`+`level`(+배수) — **currency 아님** | `AccrualTicker`(ref), 헤더 텍스트 | ❌ (업그레이드 시만) |
| `useSumMenuIncome` | `levels`+`level` | `useGoldPerHour` 내부 | ❌ |
| `CurrencyDisplay` 내부 셀렉터 | `currency`만 | 🪙 배지 잎 | ✅ (의도됨, 잎 하나) |
| `UpgradeButton` 내부 셀렉터 | `currency >= cost` boolean | 버튼 잎 | 경계 넘을 때만 |

> 요지: `useGoldPerHour`가 **currency를 안 건드리는 것**이 핵심. 그래서 매 초 currency가 올라도
> gph 훅과 그걸 쓰는 트리는 안 움직이고, 오직 🪙 잎만 갱신된다.

---

## 2. "초당 수익"은 어디서 나오나 — 수익 계산 (동작 → 구현)

§1의 `useGoldPerHour()`가 뱉는 숫자의 출처. 순수 계산이라 테스트하기 쉽다.

### 동작
`goldPerHour = 손님 배수 × (해금된 메뉴들의 시간당 수익 합)`. 잠긴 메뉴는 0.

### 구현 조각과 각자 하는 일

| 파일 | 하는 일 | 핵심 |
| --- | --- | --- |
| `economy/formulas.ts` | **순수 공식.** 메뉴 레벨→수익, 레벨→업그레이드 비용, 카페 레벨→손님 배수 환산 | `menuIncomePerHour(base, lv) = round(base × 1.35^lv)` 등. React·store 의존 0 |
| `menu/catalog.ts` | **메뉴 데이터.** 7층 음료+고양이상품의 이름·해금층(floor)·기본수익·아이콘 | base 수익은 README **표**(아메리카노 30, ×3 스케일 적용 후) 기준 |
| `menu/useMenuStore.ts` | **각 메뉴가 몇 레벨인지** 저장. `upgrade(id)`는 해금+잔액 충족 시 `spendCurrency`→레벨+1 | persist. `useDecorStore` 패턴 |
| `cafe/useCafeStore.ts` | **카페가 몇 레벨인지**(1~7). `expand()`는 골드 충족 시 레벨+1 | 카페 레벨이 곧 "몇 층 메뉴까지 해금" |
| `menu/menuSelectors.ts` | `isMenuUnlocked(menu, cafeLv) = menu.floor ≤ cafeLv`, 해금 메뉴 수익 **합산** | `useSumMenuIncome()` |
| `economy/factors.ts` | **손님 배수.** 여러 요인의 곱. 지금은 카페 등급만 실제 값, 꾸밈/고양이/알바생은 `()=>1` 스텁 | 나중에 스텁 본문만 채우면 확장 |
| `economy/goldPerHour.ts` | 위 둘을 곱해 최종 `useGoldPerHour()` / `useGoldPerSecond()` | `배수 × 수익합` |

### 데이터가 바뀌면 자동 반영되는 이유
`useSumMenuIncome`는 `useMenuStore.levels`와 `useCafeStore.level`을 **구독**한다. 그래서 업그레이드/확장으로
이 값이 바뀌면 `useGoldPerHour`가 새 값을 내고 → §1의 `gphRef.current`가 갱신 → **다음 틱부터 빨라진다.**
별도 배선 없이 zustand 구독으로 연결된다.

### 검증(숫자로)
- `menuIncomePerHour(10, 10) === 201`, `upgradeCost(10, 0) === 20` (순수 함수 단위).
- 카페 Lv1·전메뉴 L0 → `useSumMenuIncome() === 192`, `useGoldPerHour() ≈ 192`.

---

## 3. 성장 — 업그레이드 / 확장 (동작 → 구현)

### 동작
- CafeMenu에서 메뉴 옆 **업그레이드** 버튼 → 골드 차감 → 그 메뉴 레벨+1 → 그 메뉴 수익↑ → 총 G/h 즉시↑.
- 카페 **확장**(이번엔 API만) → 상위 층 메뉴 해금 + 손님 배수↑ → 총 G/h↑.

### 구현
- `useMenuStore.upgrade(id)` / `useCafeStore.expand()` 는 **`useGameStore.getState().spendCurrency()`를 직접 호출**한다
  (리액티브 아님, `useDecorStore.buySkin`과 동일한 크로스 스토어 패턴). 잔액 부족이면 차감 없이 `false`.
- 버튼의 **활성/회색**은 반대로 리액티브해야 한다 → **`UpgradeButton` 잎에서 `currency >= cost` boolean만 구독**
  (§1.5 원칙 1). 행 본문은 currency를 모르므로 매 초 리렌더되지 않는다.
- 잠긴 메뉴 UI: `floor > cafeLevel`이면 행 위에 `bg-[#000000b3]` 오버레이 + 🔒 + `{floor}F에서 해금`,
  `inset-0`로 클릭 차단 + 버튼 `disabled`. → 상점 `ShopItem`의 disabled 스타일 재사용.

---

## 4. 앱을 꺼도 번다 — 오프라인 정산 (⚠ 이번엔 기능 OFF로 구현)

> **범위 결정:** 오프라인 정산은 **나중에 켤 기능**이다. 이번엔 로직·스토어·모달을 **다 만들어 두되
> 플래그로 꺼서 런타임에는 안 돌게** 한다. 나중에 플래그만 `true`로 바꾸면 켜지도록.

```ts
// economy/formulas.ts
export const OFFLINE_EARNINGS_ENABLED = false; // ← 지금은 꺼둠. 나중에 true.
```

- `settleOffline`, `markSeen`, `OfflineEarningsModal`은 **구현하고 단위 검증까지** 해둔다 (죽은 코드 아님, 테스트 가능).
- 단, **마운트 배선만 플래그 뒤에** 둔다 — 지금은 정산이 안 돌고 모달도 안 뜬다:
  ```ts
  // 앱 로드 시
  if (OFFLINE_EARNINGS_ENABLED) {
    const gained = settleOffline();
    if (gained > 0) showOfflineModal(gained);
  }
  // markSeen 스케줄링(10초/visibilitychange/beforeunload)도 이 플래그 뒤에.
  ```
- 플래그 off여도 `lastSeenAt`/`goldPerHourAtSave` **필드와 persist는 유지**한다 (스키마를 미리 확정해 두면
  나중에 켤 때 version을 또 안 올려도 됨).

### 동작 (플래그를 켰을 때)
- 앱을 껐다 켜면 "N시간 M분 동안 +K Gold" 모달이 뜨고 잔액에 반영. 단 최대 8시간치까지만.

### 어떻게 구현하나
저장할 때 두 값을 남긴다: `lastSeenAt`(마지막으로 본 시각, `Date.now()`)와 `goldPerHourAtSave`(그때의 G/h).
- **저장 시점:** 정기(~10초) + `visibilitychange`/`beforeunload`에 `markSeen(useGoldPerHour())` 호출 →
  `lastSeenAt = Date.now()`, `goldPerHourAtSave = 지금 G/h`.
- **켤 때(정산):**
  ```
  elapsedSec  = clamp((Date.now() - lastSeenAt) / 1000, 0, MAX_OFFLINE_HOURS*3600)  // 상한 8h
  offlineGold = (goldPerHourAtSave / 3600) * elapsedSec
  addCurrency(offlineGold)  →  offlineGold>0 이면 OfflineEarningsModal
  ```

### 왜 여기선 `Date.now()`인가
`performance.now()`는 프로세스가 죽으면 리셋된다 → 세션을 넘는 "얼마나 껐었나"는 벽시계(`Date.now()`)로만 잴 수 있다.
(반대로 §1 온라인 틱은 벽시계 변경에 안 흔들리려고 `performance.now()`.)

### 순서/중복 주의 (버그 나기 쉬운 곳)
1. **정산은 rehydrate 직후, 티커 시작 전에 딱 한 번.** `markSeen`이 먼저 돌면 `lastSeenAt`이 now로 덮여 오프라인 수익이 0이 된다.
2. **한 번만.** StrictMode 이중 마운트로 두 번 정산하면 두 배 지급 → 모듈 플래그나 store 플래그로 가드.
3. **온라인 중엔 정산 금지.** 티커가 이미 dt로 적립 중이므로, 정산은 "콜드 스타트(rehydrate)"에서만. `markSeen`이 `lastSeenAt`을 계속 갱신해 프로세스가 급사해도 공백이 작다.

### store 확장 (`store/useGameStore.ts`)
- 지금: `currency: 1000`, `add/spend/setCurrency`, `version 2`.
- 추가: 초기값 → `STARTING_GOLD`(1,000), 필드 `lastSeenAt`·`goldPerHourAtSave`, 액션 `markSeen`·`settleOffline`.
- `partialize`에 신규 필드 포함, **`version` → 3** (안 올리면 옛 저장본에 새 필드가 없어 정산 오작동).
- `spendCurrency`/`addCurrency` **시그니처 유지** — 상점이 의존, 깨면 안 됨.

---

## 5. 구현 순서 = 데모 가능한 마일스톤

파일 10개를 층층이 쌓지 말고, **매 단계 끝에 "직접 보이는 결과"** 가 있게 세로로 자른다.

| # | 끝나면 눈에 보이는 것 | 넣는 것 |
| --- | --- | --- |
| **M1** | 🪙 숫자가 매 초 스스로 오른다 | `formulas.ts` + `useAccrualTicker`(우선 gph를 상수 192로 하드코딩) + `CurrencyDisplay` store 연결 + App 마운트 |
| **M2** | 그 속도가 실제 메뉴 수익 합에서 나온다 | `menu/` (catalog·store·selectors) + `cafe/useCafeStore` + `economy/goldPerHour`·`factors` → 하드코딩 192 제거 |
| **M3** | 메뉴판을 열어 업그레이드하면 속도가 빨라진다 | `CafeMenuPanel`(리스트+업그레이드+잠금 오버레이) + `CafeMenu.tsx` 교체 |
| **M4** | (아직 안 켜짐) 오프라인 정산 로직·모달을 만들되 `OFFLINE_EARNINGS_ENABLED=false`로 dormant | `useGameStore` 확장 + `settleOffline`·`markSeen`·`OfflineEarningsModal` **구현+단위검증**, 마운트 배선은 플래그 뒤 |
| **M5** | 초반 체감·곡선 튜닝 | `formulas.ts`/카탈로그 상수만 조정 |

> M1에서 gph를 상수로 두는 이유: **틱 루프 자체를 먼저 끝까지 검증**하려는 것. 숫자가 오르는 걸 확인한 뒤
> M2에서 그 숫자의 출처만 진짜로 바꿔 끼운다. 두 종류의 버그(루프 vs 계산)를 섞지 않는다.

---

## 6. 리스크 / 실수하기 쉬운 곳

- **persist version 안 올림** → 오프라인 필드 저장 안 됨/정산 오작동.
- **currency 직접 setCurrency로 적립** → 단일 출처 깨짐. 반드시 `addCurrency`/`spendCurrency` 경유.
- **ticker 중복 마운트 / cleanup 누락** → interval 누수, 이중 적립(특히 StrictMode).
- **저장값을 floor** → 소수 손실로 초당 적립이 0으로 죽음(0.0178을 floor하면 0). floor는 표시에서만.
- **정산 순서/중복** → §4 세 항목 (플래그 켤 때 유효).
- **오프라인 플래그 켠 채 커밋** → 이번 범위는 `OFFLINE_EARNINGS_ENABLED=false`. 실수로 true 커밋 주의.
- **currency를 잎 아닌 곳에서 구독** → 매 초 리렌더 전파. §1.5 원칙 1 위반 여부를 DevTools로 확인.
- **행에서 `levels` 맵 통째 구독** → 아무 업그레이드에도 전 행 리렌더. 자기 `levels[id]`만 구독.
- **catalog base 값** → README 표(아메리카노 30, ×3 스케일) 기준으로 통일.

## 7. 검증 체크리스트 (수동)

- [ ] 방치 시 다른 UI는 안 깜빡이고 🪙만 매 초 오른다 (내부 소수 누적, 표시 정수)
- [ ] **리렌더 격리**(React DevTools Highlight updates): 방치 중 🪙 잎만 깜빡, 씬/HUD/패널 본문은 정지
- [ ] **행 격리**: 메뉴 A 업그레이드 시 A 행만 리렌더, 다른 행 정지
- [ ] Lv1·전메뉴 L0 → 약 192 G/h ≈ 0.053 G/s
- [ ] 업그레이드 → 골드 차감 + 그 메뉴·총 G/h 즉시↑ + 다음 틱부터 빨라짐
- [ ] 업그레이드 버튼: 잔액이 비용 경계를 넘는 순간에만 활성/회색 전환 (매 초 깜빡이지 않음)
- [ ] 2F+ 메뉴는 잠금 표시(오버레이+🔒+클릭불가)로 노출, 수익 기여 0
- [ ] `expand()` → 상위 층 해금 + 손님 배수↑로 총수익↑ (골드 비용만 게이팅)
- [ ] **오프라인은 지금 꺼져 있음**: 껐다 켜도 정산·모달 없음 (`OFFLINE_EARNINGS_ENABLED=false`). 로직은 단위 테스트로만 검증
- [ ] 기존 상점 구매(`spendCurrency`) 정상
