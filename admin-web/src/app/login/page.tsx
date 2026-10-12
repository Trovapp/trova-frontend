"use client";

import { useEffect, useState } from "react";
import { loginUrl, type Provider } from "@/lib/api/admin";

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "관리자 계정이 아니에요. 관리자로 등록된 계정으로 로그인해 주세요.",
  oauth_failed: "로그인에 실패했어요. 다시 시도해 주세요.",
  exchange_failed: "로그인 확인이 만료됐거나 이미 쓰였어요. 다시 로그인해 주세요.",
  rate_limited: "로그인 시도가 너무 많아요. 1분 뒤 다시 시도해 주세요.",
  network: "서버에 연결하지 못했어요. 네트워크나 관리자 웹 주소 설정(APP_ADMIN_WEB_URL)을 확인해 주세요.",
  expired: "로그인이 만료됐어요(1시간). 다시 로그인해 주세요.",
  reauth: "위험한 조치는 로그인 10분 안에만 할 수 있어요. 다시 로그인해 주세요.",
};

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "kakao", label: "카카오로 로그인" },
  { id: "google", label: "구글로 로그인" },
];

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 정적 내보내기라 useSearchParams 대신 주소를 직접 읽는다.
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소의 오류 코드는 브라우저에서만 읽을 수 있다.
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.oauth_failed);
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Trova 관리자</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">운영 대시보드는 관리자 계정만 볼 수 있어요.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-[var(--critical-bg)] px-3 py-2 text-sm text-[var(--critical)]">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {PROVIDERS.map((p) => (
          <a
            key={p.id}
            href={loginUrl(p.id)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-center font-medium hover:border-[var(--accent)]"
          >
            {p.label}
          </a>
        ))}
      </div>
    </main>
  );
}
