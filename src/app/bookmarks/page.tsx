"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { LoadingProgress } from "@/components/LoadingProgress";
import { listBookmarks, listFolders, removeBookmark, type Bookmark, type BookmarkFolder } from "@/lib/api/bookmarks";

const MOOD_LABEL: Record<string, string> = {
  CALM: "차분함",
  LIVELY: "활기참",
  ROMANTIC: "로맨틱",
  TRENDY: "트렌디",
  COZY: "아늑함",
  LUXURIOUS: "고급스러움",
};

const UNSORTED_ID = -1;

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<number>(0); // 0 = 전체
  const [dataLoading, setDataLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([listBookmarks(), listFolders()])
      .then(([b, f]) => {
        setBookmarks(b);
        setFolders(f);
      })
      .finally(() => setDataLoading(false));
  }, [authLoading, user]);

  async function handleRemove(id: number) {
    if (removingId !== null) return;
    setRemovingId(id);
    const previous = bookmarks;
    setBookmarks((current) => current.filter((b) => b.id !== id));
    try {
      await removeBookmark(id);
    } catch {
      setBookmarks(previous);
    } finally {
      setRemovingId(null);
    }
  }

  const loading = authLoading || (!!user && dataLoading);
  const unsortedCount = bookmarks.filter((b) => b.folderId === null).length;
  const visibleBookmarks =
    activeFolderId === 0
      ? bookmarks
      : activeFolderId === UNSORTED_ID
        ? bookmarks.filter((b) => b.folderId === null)
        : bookmarks.filter((b) => b.folderId === activeFolderId);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/discover" className="text-sm text-ink-muted hover:text-ink">
        ← 장소 추천
      </Link>

      <h1 className="mt-4 mb-6 text-xl font-semibold text-ink">찜한 장소</h1>

      {loading ? (
        <LoadingProgress />
      ) : !user ? (
        <p className="text-sm text-ink-muted">
          찜한 장소를 보려면{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : bookmarks.length === 0 ? (
        <p className="text-sm text-ink-muted">아직 찜한 장소가 없어요.</p>
      ) : (
        <>
          {folders.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFolderId(0)}
                className={`rounded-full px-3 py-1.5 text-xs ${activeFolderId === 0 ? "bg-accent text-white" : "bg-bg-muted text-ink-muted"}`}
              >
                전체
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${activeFolderId === folder.id ? "bg-accent text-white" : "bg-bg-muted text-ink-muted"}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: folder.color }} />
                  {folder.name} ({folder.placeCount})
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveFolderId(UNSORTED_ID)}
                className={`rounded-full px-3 py-1.5 text-xs ${activeFolderId === UNSORTED_ID ? "bg-accent text-white" : "bg-bg-muted text-ink-muted"}`}
              >
                미분류 ({unsortedCount})
              </button>
            </div>
          )}

          {visibleBookmarks.length === 0 ? (
            <p className="text-sm text-ink-muted">이 폴더엔 아직 저장한 장소가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visibleBookmarks.map((bookmark) => (
                <li
                  key={bookmark.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{bookmark.placeName}</p>
                    {bookmark.mood && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {MOOD_LABEL[bookmark.mood] ?? bookmark.mood}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(bookmark.id)}
                    disabled={removingId === bookmark.id}
                    className="shrink-0 text-xs text-ink-muted hover:text-accent disabled:opacity-40"
                  >
                    찜 해제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
