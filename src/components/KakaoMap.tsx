"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoMapLoader";

export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
};

// 카카오맵 SDK에는 마커 bounce 애니메이션(Animation.BOUNCE) 같은 API가 없다 —
// 구글맵과 달리 CustomOverlay로 직접 하이라이트 링을 그려서 선택 표시를 한다.
function buildHighlightHtml(color: string): string {
  return `<div style="width:28px;height:28px;border-radius:9999px;background:${color}48;border:2px solid ${color};"></div>`;
}

function buildPinElement(order: number, color: string, onClick: () => void): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = String(order);
  el.style.cssText = `
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    background: ${color};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    cursor: pointer;
  `;
  el.addEventListener("click", onClick);
  return el;
}

export function KakaoMap({
  pins,
  selectedId,
  onSelect,
  color = "#FF6B4A",
  center,
  onMapClick,
}: {
  pins: MapPin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  color?: string;
  /** pins가 비어 있을 때도 지도를 보여줘야 하는 경우(예: 위치 찍기)의 기본 중심 좌표 */
  center?: { latitude: number; longitude: number };
  /** 지도 클릭으로 좌표를 찍게 하고 싶을 때(예: 주변 추천) 전달 */
  onMapClick?: (latitude: number, longitude: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<InstanceType<typeof window.kakao.maps.Map> | null>(null);
  const pinOverlaysRef = useRef<
    Map<string, InstanceType<typeof window.kakao.maps.CustomOverlay>>
  >(new Map());
  const positionsRef = useRef<Map<string, unknown>>(new Map());
  const highlightRef = useRef<InstanceType<typeof window.kakao.maps.CustomOverlay> | null>(
    null
  );
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 지도가 아직 로드되기 전에 장소가 선택될 수 있다(카카오맵 SDK는 비동기 로드).
  // 그 순간엔 highlightRef/mapRef가 비어 있어 아래 applySelection이 조용히 아무것도
  // 못 하고 끝나는데, selectedId 자체는 그대로라 이후 재실행되지 않는다 — 그래서 지도
  // 로딩이 끝난 직후에도 한 번 더 최신 선택 상태를 적용해줘야 한다.
  const applySelection = useCallback((id: string | null | undefined) => {
    const highlight = highlightRef.current;
    const map = mapRef.current;
    if (!highlight || !map) return;

    if (!id) {
      highlight.setMap(null);
      return;
    }

    const position = positionsRef.current.get(id);
    if (!position) return;

    map.panTo(position);
    highlight.setPosition(position);
    highlight.setMap(map);
  }, []);

  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // pins는 호출 측에서 매 렌더마다 새 배열로 넘어오는 경우가 많아, 참조가 아니라
  // 내용(id+좌표)이 실제로 바뀔 때만 지도를 다시 만들도록 키로 비교한다 — 그래야
  // selectedId가 바뀌어 부모가 리렌더돼도 지도가 통째로 재생성되며 panTo가 씹히지 않는다.
  const pinsKey = pins.map((pin) => `${pin.id}:${pin.latitude}:${pin.longitude}`).join("|");
  const validPins = useMemo(
    () => pins.filter((pin) => pin.latitude !== 0 || pin.longitude !== 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinsKey]
  );

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (validPins.length === 0 && !center) return;

    let cancelled = false;

    loadKakaoMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        const initialCenter =
          validPins.length > 0
            ? new window.kakao.maps.LatLng(validPins[0].latitude, validPins[0].longitude)
            : new window.kakao.maps.LatLng(center!.latitude, center!.longitude);
        const map = new window.kakao.maps.Map(containerRef.current, {
          center: initialCenter,
          level: 6,
        });
        mapRef.current = map;

        if (onMapClickRef.current) {
          window.kakao.maps.event.addListener(
            map,
            "click",
            (mouseEvent: { latLng: { getLat(): number; getLng(): number } }) => {
              onMapClickRef.current?.(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
            }
          );
        }

        const bounds = new window.kakao.maps.LatLngBounds();
        const pinOverlays = new Map<
          string,
          InstanceType<typeof window.kakao.maps.CustomOverlay>
        >();
        const positions = new Map<string, unknown>();
        const path = validPins.map((pin, index) => {
          const position = new window.kakao.maps.LatLng(pin.latitude, pin.longitude);
          const element = buildPinElement(index + 1, color, () => {
            onSelectRef.current?.(pin.id);
          });
          const overlay = new window.kakao.maps.CustomOverlay({
            position,
            content: element,
            zIndex: 2,
          });
          overlay.setMap(map);
          pinOverlays.set(pin.id, overlay);
          positions.set(pin.id, position);
          bounds.extend(position);
          return position;
        });
        pinOverlaysRef.current = pinOverlays;
        positionsRef.current = positions;

        highlightRef.current = new window.kakao.maps.CustomOverlay({
          position: initialCenter,
          content: buildHighlightHtml(color),
          zIndex: 1,
        });

        if (path.length > 1) {
          new window.kakao.maps.Polyline({
            path,
            strokeWeight: 3,
            strokeColor: color,
            strokeOpacity: 0.8,
          }).setMap(map);
        }

        if (validPins.length > 0) {
          map.setBounds(bounds);
        }
        applySelection(selectedIdRef.current);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "지도를 불러오지 못했어요.");
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPins, color, applySelection, center?.latitude, center?.longitude]);

  useEffect(() => {
    applySelection(selectedId);
  }, [selectedId, applySelection]);

  if (validPins.length === 0 && !center) {
    return null;
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border-subtle text-sm text-ink-muted">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full rounded-xl border border-border-subtle"
    />
  );
}
