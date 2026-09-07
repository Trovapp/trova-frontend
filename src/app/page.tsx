"use client";

import { UrlInputForm } from "@/components/UrlInputForm";
import { HomeDashboard } from "@/components/HomeDashboard";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <HomeDashboard user={user} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold leading-snug text-ink sm:text-4xl">
        여행 영상 링크 하나로,
        <br />
        <span className="text-accent">장소를 자동으로</span> 정리하세요
      </h1>
      <p className="mt-4 max-w-md text-sm text-ink-muted sm:text-base">
        인스타그램 릴스나 유튜브 쇼츠 링크를 붙여넣으면 AI가 영상 속 장소를
        찾아 지도에 저장해드려요.
      </p>

      <div className="mt-10 w-full max-w-lg">
        <UrlInputForm />
      </div>
    </main>
  );
}
