import IconButton from "./IconButton";
import SolidButton from "./SolidButton";

/**
 * 버튼 variant 네임스페이스. dot notation으로 사용.
 *   <ButtonComp.Solid onClick={...}>게임 시작</ButtonComp.Solid>
 *   <ButtonComp.Icon aria-label="상점">🛒</ButtonComp.Icon>
 *
 * variant를 추가하려면 파일을 만들고 여기에 등록하면 됩니다.
 */
export const ButtonComp = {
  Solid: SolidButton,
  Icon: IconButton,
};
