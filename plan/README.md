# plan

cat-cafe 기능/작업 계획서를 모아두는 폴더.

- 기능 단위로 `plan/<feature>/` 디렉토리를 만들고, 그 안에 계획서(`README.md`)와
  필요 시 레이아웃 확인용 `layout.html`을 둡니다.
- 각 계획서는 목표 → 요구사항 → 설계 → 구현 단계 → 검증 순으로 정리합니다.

## 기능 계획

- [furniture-placement](furniture-placement/README.md) — 가구 배치 시스템
- [furniture-removal](furniture-removal/README.md) — 가구 삭제 (호버 휴지통 아이콘)
- [menu-economy](menu-economy/README.md) — 카페 레벨(1~7)·메뉴·재화(경제) 시스템: Gold/Hour 초당 적립 엔진 + 카페 레벨 해금 게이트 + 메뉴 업그레이드
- [floor-navigation](floor-navigation/README.md) — 1F~7F 층 이동 시스템: 좌측 상단 층 표시 UI + 층 선택 모달 + 슬라이드 이동 애니메이션
