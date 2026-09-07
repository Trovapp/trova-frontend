"use client";

import { useEffect, useState } from "react";
import { DAY_COLORS } from "@/lib/itinerary";
import { createFolder, listFolders, type BookmarkFolder } from "@/lib/api/bookmarks";

export function FolderPickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (folderId: number | null) => void;
}) {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(DAY_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    listFolders()
      .then((f) => {
        setFolders(f);
        setError(null);
      })
      .catch(() => setError("폴더를 불러오지 못했어요."));
  }, [visible]);

  async function handleCreateAndPick() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const folder = await createFolder(newName.trim(), newColor);
      setCreating(false);
      setNewName("");
      onPick(folder.id);
    } catch {
      setError("폴더를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl border border-border-subtle bg-bg p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 font-medium text-ink">어느 폴더에 저장할까요?</p>

        {error && <p className="mb-3 text-sm text-accent">{error}</p>}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded-lg border border-border-subtle p-3 text-left text-sm text-ink hover:bg-bg-muted"
          >
            미분류로 저장
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onPick(folder.id)}
              className="flex items-center gap-2 rounded-lg border border-border-subtle p-3 text-left text-sm hover:bg-bg-muted"
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: folder.color }} />
              <span className="flex-1 text-ink">{folder.name}</span>
              <span className="text-xs text-ink-muted">{folder.placeCount}개</span>
            </button>
          ))}

          {creating ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border-subtle p-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="새 폴더 이름"
                className="rounded border border-border px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                {DAY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded-full ${newColor === color ? "ring-2 ring-ink ring-offset-1" : ""}`}
                    aria-label={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateAndPick}
                disabled={!newName.trim() || busy}
                className="rounded bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                만들고 저장
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-lg border border-dashed border-border-subtle p-3 text-left text-sm text-accent hover:bg-bg-muted"
            >
              + 새 폴더 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
