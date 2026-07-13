# cat-cafe

Steam으로 배포하는 데스크탑 카페 게임. Tauri 2 (Rust) + React 19 + TypeScript + Vite + Tailwind v4.

## 개발

```bash
nvm use 22 && . "$HOME/.cargo/env"   # Node 22 + Rust 환경
pnpm install
pnpm sidecar:package                  # Steam 사이드카 바이너리 빌드 (최초 1회 / 사이드카 수정 시)
pnpm tauri dev                        # 앱 실행
```

## 커밋 규칙

메시지 형식: `<prefix>: <설명>`

| prefix | 용도 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | 동작에 영향 없는 변경 (코드 포맷, UI 스타일/레이아웃 등) |
| `chore` | 그 외 (빌드/설정/의존성/문서/구조 정리 등) |

예: `feat: 상점 모달 추가`, `style: 계산대 위치 조정`, `chore: zustand 설치`

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
