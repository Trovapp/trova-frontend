"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { exchangeCode } from "@/lib/api";
import { saveToken } from "@/lib/session";

/** 백엔드가 로그인 뒤 보내는 곳: ?code=(1회용, 60초) 또는 ?error=forbidden|oauth_failed. */
export default function AuthCallbackPage() {
  const router = useRouter();
  // 코드는 한 번만 쓸 수 있다 — 개발 모드에서 effect가 두 번 돌아도 한 번만 교환한다.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const code = params.get("code");
    // 코드를 주소창·방문 기록에 남기지 않는다.
    window.history.replaceState(null, "", "/auth/callback/");
    if (error || !code) {
      router.replace(`/login/?error=${encodeURIComponent(error ?? "oauth_failed")}`);
      return;
    }
    exchangeCode(code)
      .then(({ token, expiresInSeconds }) => {
        saveToken(token, expiresInSeconds);
        router.replace("/");
      })
      .catch(() => router.replace("/login/?error=exchange_failed"));
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p className="text-[var(--text-secondary)]">로그인 확인 중…</p>
    </main>
  );
}
