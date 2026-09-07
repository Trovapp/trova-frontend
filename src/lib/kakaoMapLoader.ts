let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY;
    if (!appKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_JS_KEY가 설정되지 않았어요."));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-kakao-maps-sdk]"
    );
    if (existing) {
      existing.addEventListener("load", () => window.kakao.maps.load(() => resolve()));
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoMapsSdk = "true";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
