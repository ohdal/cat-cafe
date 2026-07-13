import { useUiStore } from "./store/useUiStore";
import StartScreen from "./screens/StartScreen";
import MainScreen from "./screens/MainScreen";

function App() {
  const screen = useUiStore((s) => s.screen);

  return (
    // The visible bottom bar. The area *above* this window is desktop and stays
    // fully clickable — see position_bottom_bar() in src-tauri/src/lib.rs.
    <main className="flex min-h-screen flex-col overflow-hidden rounded-t-2xl bg-linear-to-b from-neutral-800 to-neutral-950 text-neutral-100">
      {screen === "start" ? <StartScreen /> : <MainScreen />}
    </main>
  );
}

export default App;
