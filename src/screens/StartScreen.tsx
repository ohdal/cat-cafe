import { ButtonComp } from "@/components/ButtonComp";
import { useUiStore } from "@/store/useUiStore";

/** 시작 화면: 정중앙 "게임 시작" 버튼 하나. */
export default function StartScreen() {
  const setScreen = useUiStore((s) => s.setScreen);

  return (
    <div className="flex flex-1 items-center justify-center">
      <ButtonComp.Solid onClick={() => setScreen("main")} className="px-8 py-4 text-lg">
        게임 시작
      </ButtonComp.Solid>
    </div>
  );
}
