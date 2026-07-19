import { useUiStore } from "@/store/useUiStore";
import StartScreen from "@/screens/StartScreen";
import MainScreen from "@/screens/MainScreen";
import MainMenu from "@/components/Menu/MainMenu";
import CafeMenu from "@/components/Menu/CafeMenu";
import { useInteractiveRegion } from "@/lib/interactiveRegion";

/**
 * 전체화면 투명 오버레이. 카페 바는 하단 밴드로 고정되고, 그 위(투명 영역)에
 * 모달(MainMenu/CafeMenu) 같은 오버레이 UI가 화면 중앙에 뜬다. 카페 바와 열린
 * 모달은 useInteractiveRegion으로 Rust에 보고되어, 그 영역 밖은 클릭이 데스크탑으로 통과된다.
 */
function App() {
  const screen = useUiStore((s) => s.screen);
  const activeModal = useUiStore((s) => s.activeModal);
  const barRef = useInteractiveRegion<HTMLDivElement>("cafe-bar");

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* 카페 바 (하단 240px 밴드) */}
      <div
        ref={barRef}
        className="absolute inset-x-0 bottom-0 flex h-60 flex-col overflow-hidden rounded-t-2xl bg-linear-to-b from-neutral-800 to-neutral-950 text-neutral-100"
      >
        {screen === "start" ? <StartScreen /> : <MainScreen />}
      </div>

      {/* 바 바깥(위쪽) 모달 오버레이 */}
      {screen === "main" && activeModal === "mainMenu" && <MainMenu />}
      {screen === "main" && activeModal === "cafeMenu" && <CafeMenu />}
    </div>
  );
}

export default App;
