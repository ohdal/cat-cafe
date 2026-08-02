import Wall from "@/features/cafe/Wall";
import Floor from "@/features/cafe/Floor";
import Counter from "@/features/cafe/Counter";
import MenuBoard from "@/features/cafe/MenuBoard";
import FurnitureLayer from "@/features/decor/furniture/FurnitureLayer";
import FurnitureGhost from "@/features/decor/furniture/FurnitureGhost";

interface Props {
  floor: number;
}

/**
 * 층 하나의 씬. 지금은 모든 층이 같은 가구/스킨 데이터를 공유해 내용이 사실상
 * 동일하지만(층별 꾸미기는 후속 작업, plan/floor-navigation/README.md 참고),
 * 이동 애니메이션이 실제 여러 층을 지나가는 것처럼 보이도록 층마다 별도로
 * 마운트한다. Counter/MenuBoard는 1F 전용.
 */
export default function FloorScene({ floor }: Props) {
  return (
    <div className="relative h-60 w-full shrink-0 overflow-hidden">
      <Wall />
      <Floor />
      {floor === 1 && <Counter />}
      {floor === 1 && <MenuBoard />}
      <FurnitureLayer />
      <FurnitureGhost />
    </div>
  );
}
