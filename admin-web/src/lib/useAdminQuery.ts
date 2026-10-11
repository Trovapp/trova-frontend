"use client";

import { useEffect, useState } from "react";
import { ApiError } from "./api";

export type QueryState<T> =
  { status: "loading" } | { status: "error"; error: ApiError | Error } | { status: "ready"; data: T };

/**
 * 탭·카드마다 따로 불러온다 — 한 곳의 오류가 다른 곳에 번지지 않게(설계 "탭을 나눈 이유").
 * 401은 onUnauthorized로 넘겨 로그인 화면으로 보낸다.
 */
export function useAdminQuery<T>(load: () => Promise<T>, key: string, onUnauthorized: () => void): QueryState<T> {
  const [state, setState] = useState<{ key: string; value: QueryState<T> }>({ key, value: { status: "loading" } });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState({ key, value: { status: "ready", data } });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }
        setState({ key, value: { status: "error", error } });
      });
    return () => {
      cancelled = true;
    };
    // key가 바뀔 때(기간 변경)만 다시 부른다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 기간을 바꾼 직후에는 이전 기간 값 대신 로딩을 보여준다.
  return state.key === key ? state.value : { status: "loading" };
}

export function errorMessage(error: ApiError | Error): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "권한이 없어요. 관리자 계정인지 확인해 주세요.";
    if (error.status === 429) return "요청이 너무 많아요. 1분 뒤 다시 시도해 주세요.";
    return `불러오지 못했어요(${error.status}).`;
  }
  return "불러오지 못했어요. 네트워크를 확인해 주세요.";
}
