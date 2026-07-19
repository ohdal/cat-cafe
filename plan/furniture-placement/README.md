# 가구 배치 시스템 (furniture-placement)

카페 화면에 가구를 배치·재배치하는 시스템. 인벤토리에서 가구를 골라 마우스로 원하는
위치에 놓는다. (동물의 숲 / 심즈류 배치 UX)

## 목표

- HUD에서 배치 모드를 토글하고, 인벤토리에서 가구를 선택해 카페 씬에 배치한다.
- 배치된 가구는 다시 클릭해 재배치할 수 있다.
- 가구별로 배치 가능한 영역이 제한된다(공중 배치 방지 등).

## 요구사항

| # | 내용 |
| --- | --- |
| 1 | HUD에 가구 배치 토글 아이콘 버튼 추가 |
| 2 | 토글 ON 시 가구 인벤토리 UI를 **화면 상단(카페 바 바깥)** 에 표시 |
| 3 | 인벤토리 기본 노출 영역은 **5×3 그리드**, 초과분은 스크롤 |
| 4 | 가구는 우선 **책상(desk), 의자(chair), 액자(frame)** 3종 |
| 5 | 인벤토리에서 가구 클릭 → 카페 씬에 **반투명 프리뷰(ghost)** 가 마우스를 따라다니다가, 클릭하면 배치 완료 |
| 6 | 배치된 가구를 클릭하면 다시 **재배치** 모드로 진입 |
| 7 | 가구마다 **배치 가능 영역**이 지정됨 (예: 책상=바닥, 액자=벽만, 공중 배치 불가) |
| 8 | **우클릭 시 배치 취소** |
| 9 | 아이템끼리 **겹쳐서 배치** 가능 → z-order 관리 |
| 10 | 배치 중 **스크롤로 z-order 조절** — **겹치는 가구들 사이에서만** 순서 이동(안 겹치는 건 건너뜀) |
| + | 배치 중이면 인벤토리에 **어떤 가구를 배치 중인지 표시** (셀 테두리) |
| + | **이미 배치된 가구**는 인벤토리 칸 **하단 중앙에 '배치완료' 배지** 표시 |
| + | 인벤토리 아이템 **호버 시 이름 툴팁** 표시 (공용 Tooltip 컴포넌트) |
| + | 공통으로 뺄 수 있는 건 공용 컴포넌트로 분리 |

## 결정 사항

- **창 구조**: 하단 240px 바 → **전체화면 투명 오버레이** (아래 선행 작업)
- **인벤토리 위치**: 화면 상단 중앙 (카페 바 바깥, 오버레이 상단 영역)
- **재배치 중 원본**: 숨김 처리
- **배치 좌표 단위**: 씬 기준 **%** (모니터 폭이 달라도 유효)
- **아트 렌더링**: **Rive → 단일 `<canvas>`** (씬 전체를 캔버스 1개에 통합 렌더)
- **고양이 이동 범위**: **카페 씬 영역 내** (화면 전체 X)
- **가구 종류**: 책상 / 의자 / **액자(벽 전용)**
- **겹침 배치**: 허용, z-order=`placed` 배열 순서. **스크롤 z 조절은 겹치는 가구 기준으로만**(안 겹치는 건 건너뜀). Y-자동/바닥 레이어 안 씀
- **zone 정의**: 확장 위해 **predicate 함수**(type별 임의 모양) — rect 외 형태도 지원

## 선행: 창 구조 전환 (전체화면 투명 오버레이)

인벤토리를 하단 바 바깥(화면 상단)에 띄우려면 웹뷰가 그 영역을 덮어야 하므로, 창을
**하단 240px 바 → 전체화면 투명 오버레이**로 전환한다. (이 feature의 선행 작업이며, 별도
태스크로 분리 가능)

- **창**: 전체화면(작업영역), `transparent`, `decorations:false`, 항상 위(옵션).
- **카페 씬**: 오버레이 **하단에 밴드**로 고정(기존 바 높이 유지). 위쪽은 투명.
- **인벤토리/모달**: 위쪽 투명 영역에 렌더.
- **고양이**: 카페 씬 영역 안에서만 이동.
- **클릭 통과**: 기본 ON(투명 영역 → 데스크탑 클릭 유지). **상호작용 영역**(하단 카페 바 +
  열린 패널) 위에 커서가 있을 때만 OFF. 단일 창은 부분 통과가 안 되므로, **Rust가 전역 커서
  위치를 폴링해 `set_ignore_cursor_events`를 토글**(프론트가 현재 상호작용 rect를 Rust에 전달).
  → **이 구조의 핵심 기술 리스크**.
- **변경 파일**: `tauri.conf.json`(창 전체화면/크기), `src-tauri/src/lib.rs`(배치·커서 토글),
  기존 `set_click_through` 재사용.

## 설계

### 좌표계

- 배치 좌표는 **CafeScene(상대 컨테이너) 기준 %** (0~100). 가구 기준점은 **밑변 중앙(base)**.
- 배치 가능 영역(zone)도 scene 기준 **%** 로 정의.
- ghost 위치 = `mousemove`의 clientX/Y를 scene `getBoundingClientRect()` 기준 %로 환산.

### 렌더링 (Rive / Canvas)

가구·고양이 아트는 Rive. **성능·확장성을 위해 씬 전체를 캔버스 1개에 그린다.** (아이템 수가
늘고 고양이가 계속 애니메이션되므로, 아이템별 개별 canvas는 컨텍스트 오버헤드·WebGL 컨텍스트
개수 한도에 걸림.)

- **단일 `<canvas>` + Rive 로우레벨 렌더러**: `File`에서 각 가구/고양이 `Artboard` 인스턴스를
  만들고, `requestAnimationFrame` 루프에서 각 인스턴스를 자기 위치(store %)로 transform 후
  draw → `flush`. 아이템마다 StateMachine 인스턴스를 따로 돌려 독립 애니메이션.
  (간단한 `<Rive>` React 컴포넌트는 1 artboard/1 canvas라 다중 배치엔 부적합.)
- **상호작용은 데이터 기반**: 위치·크기가 store에 %로 있으므로 **hit-test는 JS point-in-rect**
  (zone 판정과 동일). 캔버스 위 **투명 DOM 오버레이**(또는 캔버스 pointer 핸들러)로
  mousemove(ghost)/click(배치·재배치)/hover(툴팁) 처리.
- **z-order = `placed` 배열 순서**(painter's algorithm): 앞 index부터 draw → 뒤 index가 위에 그려짐.
  DOM placeholder 단계에선 `z-index = index`. ghost는 `placing.stackPos` 위치에 미리보기.
  (스크롤 조절은 "겹치는 기준" — 아래 z-order 절 참고.)
- **툴팁·인벤토리·HUD는 DOM** (캔버스 아님). ghost는 캔버스에 반투명 draw 하거나 DOM 오버레이로.
- **렌더러 무관 설계**: 배치/store 로직은 좌표 데이터만 다루므로 렌더러와 분리. 초기엔 DOM 박스
  placeholder로 배치 로직을 완성하고, 이후 단일 캔버스 Rive 렌더러(SceneCanvas)로 교체.

### 상태 (zustand) — `features/furniture/useFurnitureStore.ts`

```ts
type FurnitureTypeId = "desk" | "chair" | "frame";

interface PlacedFurniture {
  instanceId: string;         // nanoid 등
  typeId: FurnitureTypeId;
  x: number; y: number;       // scene 기준 % (0~100, base 기준)
}
// z-order = placed 배열 순서 (index 0 = 맨 뒤 … 마지막 = 맨 앞). 겹침 허용, 바닥 깔개류 없어 레이어 불필요.

interface FurnitureState {
  inventoryOpen: boolean;
  placed: PlacedFurniture[];
  // 배치/재배치 중. x,y = 현재 ghost 위치(%), stackPos = 배치될 z 위치(placed 삽입 index)
  placing: { typeId: FurnitureTypeId; instanceId?: string; x: number; y: number; stackPos: number } | null;

  toggleInventory(): void;
  startPlacing(typeId: FurnitureTypeId, instanceId?: string): void; // 신규=맨앞, 재배치=기존 위치
  setPlacingPos(x: number, y: number): void;    // mousemove
  cyclePlacingZ(dir: 1 | -1): void;             // 스크롤: 겹치는 가구 기준 한 칸 앞/뒤 (안 겹치면 무시)
  commitPlacing(): void;                         // isValidPlacement 재검사 후 placed[stackPos]에 삽입
  cancelPlacing(): void;                         // 우클릭 / ESC
  removeFurniture(instanceId: string): void;
}
```

- `placed` 목록은 persist(localStorage)로 저장. (`useGameStore`와 별도 슬라이스)

### 데이터 모델 — `features/furniture/catalog.ts`

```ts
type Zone = (xPct: number, yPct: number) => boolean; // base가 유효영역 안인지 (확장 가능)

interface FurnitureType {
  id: FurnitureTypeId;
  name: string;                       // 툴팁/표시용 ("책상", "의자", "액자")
  icon: string;                       // 인벤토리 아이콘 (임시 이모지, 이후 Rive/이미지)
  size: { w: number; h: number };     // 배치 크기
  zone: Zone;                         // 배치영역 predicate (rect/band/wall 등 자유)
}

// 공용 zone 빌더 (zone.ts) — 예: rectZone(xMin,xMax,yMin,yMax)
export const CATALOG: Record<FurnitureTypeId, FurnitureType> = {
  desk:  { /* … */ zone: rectZone(0, 100, 78, 92) },  // 바닥 밴드
  chair: { /* … */ zone: rectZone(0, 100, 80, 94) },  // 바닥 밴드
  frame: { /* … */ zone: rectZone(0, 100, 6, 55) },   // 벽 영역 (바닥/공중 불가)
};
```

### 배치 영역(zone) 제약 (요구 7)

- 각 가구 type이 `zone`을 가진다. **확장성을 위해 rect가 아니라 predicate 함수**로 정의:
  `zone: (xPct, yPct) => boolean`. 공용 빌더(`rectZone`, 이후 `bandZone`/`wallZone` 등)로 선언.
- **유효성 판정 단일 함수**: `isValidPlacement(typeId, xPct, yPct) = CATALOG[typeId].zone(x, y)`
  (`features/furniture/zone.ts`). base(밑변 중앙) 기준.
- 같은 함수를 **두 곳**에서 사용 (규칙 중복 방지):
  - `FurnitureGhost` — 매 mousemove마다 호출 → **유효/무효 표시**(무효면 붉은 tint).
  - `useFurnitureStore.commitPlacing` — 커밋 시 **재검사**해 무효면 배치 무시(방어).
- 예: 책상/의자 = 바닥선 근처 밴드, **액자 = 벽 영역**(바닥/공중 불가).

### z-order (겹침 기준)

- z-order = `placed` 배열 순서(뒤→앞). 겹침 허용, 바닥 깔개류가 없어 레이어 개념 불필요.
- **스크롤 z 조절은 '지금 ghost와 겹치는 가구'만 대상**:
  - ghost bbox와 겹치는 placed 아이템을 z순으로 모음.
  - 휠 위 → 바로 앞 겹침 아이템의 **앞**으로, 휠 아래 → 바로 뒤 겹침 아이템의 **뒤**로 `stackPos` 이동.
  - 겹치지 않는 아이템은 건너뜀 → 스크롤 몇 번이면 원하는 깊이. 겹치는 게 없으면 스크롤 무시.
- ghost는 `stackPos` 위치에 미리보기. 신규 배치 기본은 맨 앞.

### 상호작용 플로우

```
[배치]  인벤토리 아이템 클릭 → startPlacing(typeId)
        → CafeScene에서 mousemove로 ghost 추적
        → (배치 중) 마우스 휠 → cyclePlacingZ: 겹치는 가구 기준 앞/뒤 한 칸, ghost가 해당 z로 미리보기
        → 유효영역에서 좌클릭 → commitPlacing() → placed[stackPos]에 삽입
        → 우클릭/ESC → cancelPlacing (둘 다 CafeScene에서 처리: onContextMenu / keydown)

[재배치] 배치된 가구 클릭 → startPlacing(typeId, instanceId)
        → 원본은 배치 중 숨김 → commit 시 좌표 갱신
        → 취소 시 원위치 유지

[삭제]   (후속) 배치 모드에서 가구 우클릭 등 — 이번 범위 밖
```

## 컴포넌트 / 파일 구조 (예정)

```
src/
├─ components/
│  └─ Tooltip.tsx                     # 공용 툴팁 (호버 표시)
├─ features/
│  └─ furniture/
│     ├─ types.ts
│     ├─ catalog.ts                   # 책상/의자/액자 정의 + zone(predicate)
│     ├─ zone.ts                      # isValidPlacement + zone 빌더(rectZone 등) — 순수 함수
│     ├─ useFurnitureStore.ts         # 상태
│     ├─ FurnitureToggleButton.tsx    # HUD 토글 버튼 (ButtonComp.Icon)
│     ├─ FurnitureInventory.tsx       # 화면 상단 패널 (5×3 grid + scroll)
│     ├─ FurnitureInventoryItem.tsx   # 셀: 아이콘 + Tooltip + 배치중(테두리) + 배치완료 배지(하단 중앙)
│     ├─ SceneCanvas.tsx             # 단일 캔버스 Rive 렌더러 (배치 가구 + 고양이 그림)
│     ├─ FurnitureLayer.tsx           # 배치 아이템 DOM 오버레이 (hit area / 클릭 재배치)
│     ├─ PlacedFurniture.tsx          # 개별 hit area (클릭 재배치); 그림은 SceneCanvas가 담당
│     └─ FurnitureGhost.tsx           # 마우스 추적 반투명 프리뷰 (유효/무효)
```

- **HUD**: `Hud.tsx`에 `FurnitureToggleButton` 추가.
- **인벤토리**: `FurnitureInventory`를 오버레이 **상단 중앙**에 렌더.
  - 셀 상태 표시 2가지(독립): **배치중**(현재 배치 중인 type → 주황 **점선** 테두리 `::after`) /
    **배치완료**(`placed`에 해당 type ≥1 → 셀 하단 중앙 배지). placed 여부는 `placed`에서 파생(selector).
- **배치 레이어/ghost**: `CafeScene` 안에 `FurnitureLayer` + `FurnitureGhost`. mousemove/contextmenu(우클릭) 핸들러는 scene 컨테이너에 부착.

### 레이어 순서 (뒤 → 앞)

```
Wall → Floor → Counter/MenuBoard → SceneCanvas(가구+고양이, Rive) → Ghost → FurnitureLayer(투명 hit 오버레이) → Hud → Inventory(열렸을 때)
```

## 공용 컴포넌트

- **Tooltip** (`components/Tooltip.tsx`): children을 감싸고 hover 시 지정 텍스트를 위/아래에 표시.
  인벤토리 아이템 이름 표시에 사용, 이후 다른 곳에서도 재사용.
- (후보) **Panel**: 인벤토리·상점·설정 모달이 공유할 패널 래퍼 — 상점 붙일 때 함께 검토.

## 구현 단계

0. **(선행) 창 구조 전환** — 전체화면 투명 오버레이 + 커서 기반 클릭 통과 토글
1. `types.ts` + `catalog.ts`(책상/의자/액자 + zone predicate) + `zone.ts` + `useFurnitureStore.ts`
2. 공용 `Tooltip.tsx`
3. HUD `FurnitureToggleButton` → `toggleInventory`
4. `FurnitureInventory`(상단, 5×3 grid, scroll) + `FurnitureInventoryItem`(아이콘 + Tooltip + 배치중 표시)
5. `FurnitureLayer` + `PlacedFurniture`(클릭 재배치)
6. `FurnitureGhost`(mousemove 추적) + 좌클릭 commit / 우클릭 cancel
7. zone 제약 — `zone.ts`의 `isValidPlacement`로 유효/무효 표시(ghost) + 커밋 차단(store)
8. **겹침 z-order** — `placed` 배열 순서 렌더 + 배치 중 휠 → `cyclePlacingZ`(**겹치는 가구 기준** 앞/뒤)
9. `placed` persist 연결
10. (후속) 단일 캔버스 Rive 렌더러(SceneCanvas) — DOM 박스 placeholder → 캔버스 렌더로 교체,
    DOM 레이어는 투명 hit 오버레이로 전환

## 검증 (수동)

- [x] (선행) 오버레이 전환 후 하단 카페 바 상호작용 OK, 투명 영역 데스크탑 클릭 통과 OK
- [x] HUD 토글 버튼으로 인벤토리 열림/닫힘
- [x] 인벤토리 화면 상단(카페 바 바로 위), 5×3 노출 + 초과 시 스크롤
- [x] 책상/의자/액자 3종 노출, 호버 시 이름 툴팁
- [x] 아이템 클릭 → ghost가 마우스 따라다님, 배치 중 인벤토리에 해당 가구 표시
- [x] 유효영역에서 좌클릭 → 배치 완료 / 영역 밖은 무효 표시 & 배치 안 됨 (액자=벽만)
- [x] 아이템 **겹쳐 배치** 가능, 배치 중 **휠로 겹치는 가구 기준 앞/뒤 조절**(안 겹치면 변화 없음)
- [x] 배치된 가구 클릭 → 재배치 진입(원본 숨김)
- [x] 우클릭 / **ESC** → 배치 취소
- [ ] (재시작) 배치 상태 유지(persist 적용 후) — store엔 이미 연결됨, 재시작 재확인 필요

## 참고

- 레이아웃 러프 확인: [`layout.html`](layout.html) (브라우저로 열기)
