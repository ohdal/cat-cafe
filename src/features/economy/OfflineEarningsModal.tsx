import ModalOverlay from "@/components/ModalOverlay";

interface Props {
  elapsedSec: number;
  gained: number;
  onClose: () => void;
}

/** "n시간 m분 동안 +N Gold" 요약 모달. OFFLINE_EARNINGS_ENABLED가 켜진 뒤에만 실제로 뜬다. */
export default function OfflineEarningsModal({ elapsedSec, gained, onClose }: Props) {
  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex min-w-[288px] flex-col items-center gap-2 p-2 text-center text-sm text-modal-text">
        <p>
          {hours}시간 {minutes}분 동안 자리를 비운 사이
        </p>
        <p className="text-lg font-semibold text-currency-accent">+🪙{Math.floor(gained).toLocaleString()}</p>
      </div>
    </ModalOverlay>
  );
}
