import { ButtonComp } from "@/components/ButtonComp";
import { useUiStore } from "@/store/useUiStore";

/** 시작 화면: 타이틀 로고 + 그 아래 "START" 버튼. 배경은 로고의 하늘색과 통일. */
export default function StartScreen() {
  const setScreen = useUiStore((s) => s.setScreen);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#a9cff5]">
      <img src="/title-logo.png" alt="Nyan Cafe" className="h-44 w-auto" />
      <ButtonComp.Solid onClick={() => setScreen("main")} className="-mt-7 px-4 py-1 text-xs">
        START
      </ButtonComp.Solid>
    </div>
  );
}
