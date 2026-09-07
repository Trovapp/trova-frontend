import { Fragment, type ReactNode } from "react";

/** "**text**" 마크다운 굵게 표시를 <mark> 하이라이트로 렌더링한다. */
export function renderHighlightedText(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-accent-bg px-0.5 font-semibold text-ink">
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}
