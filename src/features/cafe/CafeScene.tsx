import Wall from "./Wall";
import Floor from "./Floor";
import Counter from "./Counter";
import MenuBoard from "./MenuBoard";
import Hud from "./Hud";

/**
 * 카페 화면 구성.
 *
 * 레이어 순서(뒤 → 앞): 벽지 → 바닥 → 계산대 → 메뉴판.
 * 각 요소는 나중에 상점 시스템에서 스킨을 교체할 수 있도록 별도 컴포넌트로 분리함.
 */
export default function CafeScene() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <Wall />
      <Floor />
      <Counter />
      <MenuBoard />
      <Hud />
    </div>
  );
}
