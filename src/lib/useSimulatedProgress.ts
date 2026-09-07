import { useEffect, useState } from "react";

// 실제 요청 진행률은 알 수 없으므로, 초반엔 빠르게 90%까지 채워서 "멈춰있지 않다"는
// 인상을 주고 거기서 멈춘다 — 로딩이 끝나면 이 훅을 쓰는 컴포넌트가 콘텐츠로 교체되며
// 언마운트되므로 별도의 리셋 로직은 필요 없다.
const TICK_MS = 200;
const CAP = 90;

export function useSimulatedProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= CAP) return prev;
        const step = prev < 60 ? 8 : 3;
        return Math.min(prev + step, CAP);
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  return progress;
}
