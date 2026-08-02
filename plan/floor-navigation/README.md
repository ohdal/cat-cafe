# 층 이동 시스템 (floor-navigation)

카페를 1F~7F(`CAFE_MAX_LEVEL`)의 여러 층으로 나누고, 좌측 상단 UI로 층을 골라 이동하는
기능. 지금 `useCafeStore.level`(1~7)은 이미 "해금된 최대 층수"와 정확히 일치하므로 이
값을 그대로 재사용한다.

## 목표

- 좌측 상단(햄버거 메뉴의 정반대편)에 현재 층을 표시하는 UI를 놓는다.
- 클릭하면 카페 메뉴 모달과 같은 스타일의 층 선택 모달이 뜬다.
- 해금된 층을 클릭하면 그 층으로 이동 — 실제로 다른 층들이 쌓여 있고 지금은 그중 한
  층만 보이는 것처럼, 건물이 카메라 앞을 지나가듯 중간층까지 스쳐 지나가는 이동
  애니메이션이 재생된다.

## 요구사항

| # | 내용 |
| --- | --- |
| 1 | 좌측 상단에 `N F` 표시 UI (Hud의 햄버거 버튼과 좌우 대칭 위치) |
| 2 | 클릭 시 층 선택 모달 오픈 (기존 `ModalOverlay` 재사용) |
| 3 | 모달에 1F~7F 목록, 잠긴 층(`floor > level`)은 `CafeMenuPanel`과 동일한 잠금 오버레이로 클릭 불가 |
| 4 | 해금된 층 클릭 → 모달 닫힘 + 해당 층으로 이동 |
| 5 | 이동은 **애니메이션**으로 보여준다 — 위층으로 갈 땐 건물이 아래로 흘러 내려가듯(엘리베이터를 타고 올라가는 시점), 아래층으로 갈 땐 반대로 |
| 6 | 여러 층을 건너뛰면(예: 1F→5F) 중간층(2F~4F)을 실제로 지나가는 것처럼 한 번의 연속된 움직임으로 통과해서 보여준다 |

## 결정 사항

- **층 해금 소스**: 새 데이터 만들지 않고 `useCafeStore.level`을 그대로 "해금된 최대
  층"으로 재사용 (`CAFE_MAX_LEVEL=7`과 이미 1:1 대응).
- **보는 중인 층은 새 상태**: `useCafeStore`에 `currentFloor`(1~`level`, 기본값 1)를
  추가. `level`(해금 진행도)과 `currentFloor`(지금 보는 층)는 별개 개념이라 분리한다.
- **`currentFloor`도 persist**: 재시작해도 마지막으로 보던 층을 기억한다 (이미 persist
  중인 스토어라 필드만 추가).
- **가구/벽지·바닥 스킨은 이번 범위에서 층별로 안 나눈다.** 층별로 다르게 꾸미는 건
  분명 필요하지만(`useFurnitureStore.placed`, `useDecorStore`의 스킨 상태를
  `Record<floor, ...>`로 스키마 변경 + 상점/꾸미기 UI가 "지금 보는 층" 기준으로 동작하도록
  바꿔야 함), 이번엔 **이동 UI + 애니메이션만** 먼저 구현하고 층별 꾸미기는 **후속
  계획으로 분리**한다 (`plan/floor-decor/` 예정, 아직 미작성).
  - 그때까지는 모든 층이 같은 벽지/바닥/가구를 공유한다 — 이동은 진짜로 되지만
    "방 내용"은 층마다 동일하게 보인다는 뜻. 사용자에게 혼동을 줄 수 있는 임시
    상태라는 점을 감안한다.
- **Counter/MenuBoard는 1F 전용**: 로비 개념의 계산대/메뉴판은 1층에서만 렌더링하고,
  2F~7F는 Wall/Floor/FurnitureLayer만 보여준다.
- **애니메이션은 "건물 shaft를 스윕"하는 단일 트랜지션**: from/to 두 씬만 슬라이드하는 게
  아니라, 이동 구간에 포함된 **모든 층(예: 1F→5F면 1~5F 전부)을 세로로 쌓은 shaft**를
  만들고 그 shaft 전체를 한 번의 `translateY` 트랜지션으로 움직인다. 그러면 중간층이
  자연스럽게 화면을 스쳐 지나간다(요구 6). 방향은 "위층으로 갈수록 건물이 내려간다"는
  엘리베이터 시점으로 통일한다(요구 5) — 아래 설계의 부호 계산 참고.

## 설계

### 상태 — `src/features/cafe/useCafeStore.ts`

```ts
interface CafeState {
  level: number;           // 기존: 해금된 최대 층 (1~7)
  currentFloor: number;    // 신규: 지금 보고 있는 층 (1~level)
  goToFloor: (floor: number) => boolean; // floor > level이면 거부(false), 아니면 이동(true)
  // expandCost/expand 기존 그대로
}
```

- `partialize`에 `currentFloor` 추가, `version` 올림 (기존 persist 마이그레이션 관례와
  동일하게 별도 migrate 없이 버전만 올려서 재초기화).

### UI 트리거 — `src/features/cafe/FloorIndicator.tsx` (신규)

`Hud.tsx`(`right-0 top-0`)와 좌우 대칭인 `left-0 top-0` 버튼. `CurrencyDisplay`처럼
`useCafeStore`의 `currentFloor`를 직접 구독하는 잎 컴포넌트로 만들어 리렌더 범위를
좁힌다.

```tsx
// 스케치
export default function FloorIndicator() {
  const currentFloor = useCafeStore((s) => s.currentFloor);
  const openModal = useUiStore((s) => s.openModal);
  return (
    <div className="absolute left-0 top-0 p-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => openModal("floorSelect")} className="...">
        {currentFloor}F
      </button>
    </div>
  );
}
```

`CafeScene.tsx`에서 `Hud`와 함께 렌더 (배치 모드 중 씬으로 클릭이 버블링되지 않도록
`stopPropagation`도 `Hud`와 동일하게 적용).

### 층 선택 모달 — `CafeMenu`/`CafeMenuPanel` 패턴 재사용

- `useUiStore.ModalName`에 `"floorSelect"` 추가.
- `src/components/Menu/FloorSelect.tsx`: `CafeMenu.tsx`와 동일한 래퍼(`ModalOverlay` + 패널).
- `src/components/Menu/FloorSelectPanel.tsx`: `CafeMenuPanel.tsx`의 `MenuRow`/잠금
  오버레이 패턴을 그대로 가져와 1F~7F 목록으로 렌더.
  - 잠긴 행(`floor > level`): `CafeMenuPanel`의 `bg-[rgba(0,0,0,0.7)]` 잠금 오버레이 +
    `🔒` 재사용 (동일하게 `bg-black/NN` 대신 리터럴 `rgba()` 사용 — 이 웹뷰가
    `color-mix()` opacity modifier를 지원하지 않는 이슈, [[modal-color-system]] 참고).
  - 해금된 행 클릭 → `goToFloor(floor)` 성공 시 `closeModal()`.
  - 현재 층(`currentFloor`) 행은 `modal-accent` 테두리로 강조(선택 표시, 기존
    `after:border-modal-accent` 패턴).

### 이동 애니메이션 — `src/features/cafe/CafeScene.tsx` 재구성

`CafeScene`을 고정 높이 뷰포트(`overflow-hidden`, 기존 바 높이 240px)로 감싸고, 그 안에
**"shaft"**(건물 전체를 세로로 쌓은 긴 컨테이너)를 두고 shaft 하나를 `translateY`로
움직여서 원하는 층이 뷰포트 안에 오도록 스크롤한다. 두 씬을 슬라이드시키는 게 아니라
**건물 자체가 카메라(뷰포트) 앞을 지나가는** 모델이라, 이동 구간에 걸친 층이 전부
자연스럽게 화면을 스쳐 지나간다(요구 6).

**층 순서 = 물리적 순서**: shaft 안에서는 층이 클수록 위, 작을수록 아래(1F가 맨 아래,
7F가 맨 위) — 실제 건물과 동일하게 DOM에도 위→아래로 `7F,6F,5F,4F,3F,2F,1F` 순서로
쌓는다. 각 층 슬라이스 높이 = 뷰포트 높이(240px).

**오프셋 계산** (뷰포트 높이 `H = 240px`, 이동 구간의 최고층 `maxF`):

```
offset(floor) = (maxF - floor) * H     // shaft 맨 위(maxF)를 기준으로 한 픽셀 오프셋
translateY(floor) = -offset(floor)
```

예: 1F→5F 이동이면 구간은 1~5F, `maxF = 5`.
- `translateY(1F) = -(5-1)*240 = -960px` (시작 값 — 5F~1F 5개 슬라이스 중 맨 아래인
  1F가 뷰포트에 보임)
- `translateY(5F) = -(5-5)*240 = 0px` (도착 값 — 맨 위인 5F가 뷰포트에 보임)

`-960px → 0px`로 애니메이션하면 shaft가 **아래로** 내려가면서(값이 증가하면서) 중간의
4F·3F·2F 슬라이스가 차례로 뷰포트를 스쳐 지나가고, 최종적으로 5F가 남는다. **"위층으로
갈수록 shaft(건물)가 아래로 흘러간다"**는 게 요구 5의 방향(엘리베이터를 타고 올라가는
시점 — 건물이 상대적으로 내려가는 것처럼 보임). 아래층으로 이동(`target < current`)하면
translateY가 반대로 줄어들며 shaft가 위로 올라간다 — 부호 조건 분기 없이 같은 offset
공식 하나로 자동으로 처리된다(시작/끝 오프셋 차이의 부호가 방향을 결정).

- 전환 로직은 `CafeScene.tsx`가 비대해지지 않도록 별도 훅으로 분리:
  `src/features/cafe/useFloorTransition.ts` — `currentFloor` 변화를 감지해 이동 구간
  `[min(from,to), max(from,to)]`에 해당하는 층 목록 + 시작/끝 `translateY`를 계산하고,
  트랜지션(`SLIDE_MS`, CSS `transition: transform`) 종료 후(`transitionend` 또는
  타임아웃) 목표 층 하나만 남기고 나머지 슬라이스를 언마운트한다 — 평소(이동 중이 아닐
  때)엔 shaft에 층 하나만 떠 있어 가볍다.
- 실제 "층 내용"(Wall/Floor/Counter/MenuBoard/FurnitureLayer)은 이번 범위에선 모든 층이
  동일 데이터를 공유하므로(결정 사항 참고), 씬 자체를 감싸는 `<FloorScene floor={n} />`
  래퍼만 새로 두고 지금 있는 컴포넌트들을 그대로 내부에 배치 — 이후 층별 꾸미기가
  들어올 때 이 래퍼에 `floor` prop을 실제로 사용하게 확장. 지금도 층 번호 워터마크 정도는
  `FloorScene`에서 `floor` prop으로 바로 표시할 수 있어, shaft가 스쳐 지나갈 때 몇 층을
  지나는지 눈으로 확인 가능하다.

## 컴포넌트 / 파일 구조 (예정)

```
src/
├─ features/
│  └─ cafe/
│     ├─ useCafeStore.ts          # currentFloor + goToFloor 추가
│     ├─ FloorIndicator.tsx       # 좌측 상단 "N F" 버튼 (신규)
│     ├─ useFloorTransition.ts    # shaft 구간(from~to) + translateY 스윕 상태 관리 (신규)
│     ├─ FloorScene.tsx           # 층 하나의 씬 래퍼 (신규, 지금은 전부 동일 내용)
│     └─ CafeScene.tsx            # 뷰포트 + shaft(구간 내 FloorScene 전부) 스윕 렌더로 재구성
└─ components/
   └─ Menu/
      ├─ FloorSelect.tsx          # ModalOverlay 래퍼 (신규)
      └─ FloorSelectPanel.tsx     # 1F~7F 목록 + 잠금 표시 (신규)
```

- `App.tsx`: `CafeMenu`와 나란히 `screen === "main" && activeModal === "floorSelect" && <FloorSelect />` 추가.

## 구현 단계

1. `useCafeStore`에 `currentFloor` + `goToFloor` 추가 (persist 버전 올림)
2. `FloorIndicator.tsx` — HUD 좌측 대칭 버튼, `CafeScene`에 배치
3. `useUiStore.ModalName`에 `"floorSelect"` 추가, `App.tsx` 배선
4. `FloorSelect.tsx` + `FloorSelectPanel.tsx` — `CafeMenuPanel` 잠금/선택 패턴 재사용
5. `useFloorTransition.ts` — `currentFloor` 변화 감지 → 이동 구간(shaft에 띄울 층 목록) +
   시작/끝 `translateY` 계산, 트랜지션 종료 후 목표 층만 남기고 정리
6. `FloorScene.tsx`로 기존 Wall/Floor/Counter/MenuBoard/FurnitureLayer/FurnitureGhost 감싸기
   (Counter/MenuBoard는 `floor === 1`일 때만 렌더)
7. `CafeScene.tsx`를 뷰포트 + shaft(구간 내 층을 물리적 순서로 쌓은 컨테이너)로 재구성,
   `Hud`/`FloorIndicator`는 shaft 바깥(항상 고정)에 둠
8. 타입체크 + 빌드

## 검증 (수동)

- [ ] 좌측 상단에 현재 층 표시, 우측 햄버거와 대칭 위치
- [ ] 클릭 → 층 선택 모달, 1F~7F 목록 노출
- [ ] `level`보다 높은 층은 잠금 표시, 클릭 안 됨
- [ ] 해금된 층 클릭 → 모달 닫히고 이동 애니메이션 재생
- [ ] **위층으로 이동 시 shaft가 아래로 흘러가는 방향**(엘리베이터로 올라가는 시점), 아래층은 반대 방향
- [ ] 1F→5F처럼 여러 층 건너뛰면 2F·3F·4F가 실제로 화면을 스쳐 지나가는 게 보임 (중간층 스킵 안 함)
- [ ] 이동 중 HUD/FloorIndicator는 그대로 고정, shaft만 움직임
- [ ] 앱 재시작 후 마지막으로 보던 층 유지 (persist 확인)
- [ ] 2F 이상에서는 Counter/MenuBoard 안 보임, Wall/Floor/가구는 정상 렌더
- [ ] 배치 모드 중에도 FloorIndicator 클릭이 씬으로 버블링되어 배치 커밋되지 않음

## 후속 작업

- **층별 꾸미기** (`plan/floor-decor/`, 미작성): `useFurnitureStore`/`useDecorStore`를
  층별로 분리해서 각 층을 실제로 다르게 꾸밀 수 있게 한다. 이번 이동 시스템이 먼저
  들어간 뒤, `FloorScene`의 `floor` prop을 실제 데이터 스코핑에 사용하는 방향으로 확장.

## 참고

- 레이아웃 러프 확인: [`layout.html`](layout.html) (브라우저로 열기)
