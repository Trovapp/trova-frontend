"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthStatus } from "@/components/AuthStatus";
import { useAuth } from "@/lib/auth/AuthContext";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isPlacesActive = pathname === "/places";
  const isTripsActive = pathname === "/trips" || pathname.startsWith("/trips/");
  const isDiscoverActive = pathname === "/discover" || pathname === "/bookmarks";

  return (
    <header className="border-b border-border-subtle">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/trova-icon.svg" alt="" width={24} height={24} priority />
            <span className="text-base font-semibold text-ink">Trova</span>
          </Link>

          {user && (
            <Link
              href="/places"
              aria-current={isPlacesActive ? "page" : undefined}
              className={`group flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isPlacesActive ? "text-accent" : "text-ink-muted hover:text-ink"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`transition-transform ${isPlacesActive ? "" : "group-hover:-translate-y-0.5"}`}
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              저장한 장소
            </Link>
          )}

          {user && (
            <Link
              href="/trips"
              aria-current={isTripsActive ? "page" : undefined}
              className={`group flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isTripsActive ? "text-accent" : "text-ink-muted hover:text-ink"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`transition-transform ${isTripsActive ? "" : "group-hover:-translate-y-0.5"}`}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M8 2v4M16 2v4" />
              </svg>
              내 여행
            </Link>
          )}

          {user && (
            <Link
              href="/discover"
              aria-current={isDiscoverActive ? "page" : undefined}
              className={`group flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isDiscoverActive ? "text-accent" : "text-ink-muted hover:text-ink"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`transition-transform ${isDiscoverActive ? "" : "group-hover:-translate-y-0.5"}`}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              추천
            </Link>
          )}
        </div>

        <AuthStatus />
      </div>
    </header>
  );
}
