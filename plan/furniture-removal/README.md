# 가구 삭제 (furniture-removal)

배치된 가구를 지우는 기능. [[furniture-placement]]의 후속 계획이며, 그 store에 이미
만들어져 있던 `removeFurniture(instanceId)` 액션(지금까지 미사용)을 그대로 사용한다.

## 목표

- 배치된 가구를 실수로(재배치와 헷갈려서) 지우지 않으면서도, 쉽게 지울 수 있게 한다.
- store/데이터 모델 변경 없이, UI 레이어만으로 구현한다.

## 배경 / 왜 별도 제스처가 필요한가

`PlacedFurniture`를 그냥 클릭하면 이미 **재배치**(`startPlacing(typeId, instanceId)`)가
실행된다. 삭제를 클릭 한 번에 묶으면 재배치와 항상 충돌하므로, 별도의 트리거가 필요하다.

## 요구사항

| # | 내용 |
| --- | --- |
| 1 | 배치된 가구에 마우스를 올리면(hover) 작은 **휴지통 아이콘**이 노출된다 |
| 2 | 휴지통 아이콘을 클릭하면 해당 가구가 **즉시 삭제**된다 (확인 절차 없음) |
| 3 | 호버 시 가구 자체에 **빨간 오버레이**를 씌워 "삭제 대상"임을 시각적으로 표시한다 |
| 4 | 가구 본체(휴지통 제외) 클릭은 **기존 재배치 동작 그대로** 유지한다 |
| 5 | 다른 가구를 배치/재배치하는 **도중에는** 삭제 UI(휴지통/빨간 오버레이)가 뜨지 않는다 |

## 결정 사항

- **확인 절차 없음**: 지금은 가구 획득에 재화 비용이 없는 무한 인벤토리라 삭제는 되돌리기
  쉽다. 삭제 확인 모달은 만들지 않는다.
  - **주의**: 나중에 가구 구매(재화 소모)나 희귀 아이템이 생기면, 그때 확인 절차를 다시
    검토해야 한다.
- **활성 조건**: 휴지통 아이콘/빨간 오버레이는 `placing === null`일 때만 표시(요구 5).
- **재사용 컴포넌트 안 씀**: 휴지통 버튼은 `ButtonComp.Icon`(HUD용, 고정 크기·톤)과 스타일이
  달라서(가구 모서리에 얹는 작은 배지) `PlacedFurniture` 안에 로컬로만 둔다. 범용화는
  나중에 비슷한 패턴이 한 번 더 생기면 그때 뺀다.

## 설계

### 컴포넌트 구조 변경 — `PlacedFurniture.tsx`

현재는 가구 전체가 `<button>` 하나다. 휴지통을 안에 넣으려면 인터랙티브 엘리먼트가
중첩되므로(`<button>` 안에 `<button>`은 불가), **바깥을 `<div>`로 바꾸고 안에 진짜
`<button>`(휴지통)을 중첩**하는 구조로 변경한다.

```tsx
// src/features/furniture/PlacedFurniture.tsx (변경 후 스케치)
export default function PlacedFurniture({ item, zIndex }: Props) {
  const startPlacing = useFurnitureStore((s) => s.startPlacing);
  const removeFurniture = useFurnitureStore((s) => s.removeFurniture);
  const isAnyPlacing = useFurnitureStore((s) => !!s.placing); // 요구 5
  const type = CATALOG[item.typeId];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (useFurnitureStore.getState().placing) return; // 씬으로 버블링 -> 커밋 (기존과 동일)
        startPlacing(item.typeId, item.instanceId);
      }}
      className="group absolute flex cursor-pointer items-center justify-center text-2xl leading-none"
      style={{ left: `${item.x - type.size.w / 2}%`, top: `${item.y - type.size.h}%`,
               width: `${type.size.w}%`, height: `${type.size.h}%`, zIndex }}
    >
      {type.icon}

      {!isAnyPlacing && (
        <>
          {/* 요구 3: 호버 시 빨간 오버레이. ::after라 박스 크기 영향 없음 */}
          <div className="pointer-events-none absolute inset-0 rounded bg-[#dc262666] opacity-0 transition-opacity group-hover:opacity-100" />

          {/* 요구 1·2: 호버 시 휴지통 노출, 클릭 시 즉시 삭제 */}
          <button
            type="button"
            aria-label="삭제"
            onClick={(e) => {
              e.stopPropagation(); // 재배치(startPlacing) 트리거 방지
              removeFurniture(item.instanceId);
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#dc2626] text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            🗑
          </button>
        </>
      )}
    </div>
  );
}
```

핵심 포인트:
- 클릭 로직(`useFurnitureStore.getState().placing` 체크 후 `startPlacing`)은 **그대로 이식**.
  기존 동작(요구 4) 변경 없음.
- 호버 표시는 Tailwind `group` / `group-hover:*` (이미 `Tooltip.tsx`에서 쓰는 패턴).
- 휴지통/오버레이는 `!isAnyPlacing`일 때만 아예 렌더하지 않음 → 요구 5를 JS 조건으로 보장
  (배치 중엔 hover해도 아무 UI도 안 뜸, CSS만으로는 이 조건 분기가 안 되므로 JS로 처리).
- 휴지통 `onClick`은 `stopPropagation` 필수 — 없으면 클릭이 바깥 `div`로 버블링되어
  재배치가 같이 트리거됨.
- `div`에 `role="button" tabIndex={0}`만 추가(키보드 포커스 힌트) — 풀 키보드 조작(Enter로
  재배치 트리거 등)은 이번 범위 밖, 나중에 필요해지면 `onKeyDown` 추가.

### 영향받는 파일

| 파일 | 변경 |
| --- | --- |
| `src/features/furniture/PlacedFurniture.tsx` | `<button>` → `<div>` + 중첩 휴지통 `<button>` + 빨간 오버레이 |
| (그 외 없음) | `useFurnitureStore.ts`의 `removeFurniture`는 이미 존재, 변경 불필요 |

## 구현 단계

1. `PlacedFurniture.tsx`를 위 스케치대로 재구조화 (`div` 루트 + 휴지통 버튼 + 오버레이)
2. `removeFurniture` 연결 (이미 있는 액션 호출만 추가)
3. `!isAnyPlacing` 가드로 배치 중 삭제 UI 억제 확인
4. 타입체크 + 빌드 (`pnpm build`)
5. 수동 검증 (아래 체크리스트)

## 검증 (수동)

구현 완료 (`PlacedFurniture.tsx`), 타입체크·빌드 통과. 아래는 실제 앱에서 눈으로 확인 필요:

- [ ] 아무것도 배치 중이 아닐 때, 배치된 가구 호버 → 빨간 오버레이 + 휴지통 아이콘 노출
- [ ] 휴지통 아이콘 클릭 → 해당 가구만 즉시 삭제 (확인 없음)
- [ ] 가구 본체(휴지통 제외) 클릭 → 기존처럼 재배치 진입, 삭제되지 않음
- [ ] 다른 가구를 배치/재배치하는 도중에는 다른 배치된 가구 위에 마우스가 있어도
      삭제 오버레이/아이콘이 뜨지 않음
- [ ] 삭제 후 인벤토리에서 같은 타입을 다시 배치 가능 (무한 인벤토리 확인)
