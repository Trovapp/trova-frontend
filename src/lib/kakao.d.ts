export {};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new () => { extend: (latlng: unknown) => void };
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number }
        ) => {
          setBounds: (bounds: unknown) => void;
          panTo: (latlng: unknown) => void;
        };
        Marker: new (options: { position: unknown; map?: unknown }) => {
          setMap: (map: unknown | null) => void;
          getPosition: () => unknown;
        };
        Polyline: new (options: {
          path: unknown[];
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
        }) => { setMap: (map: unknown | null) => void };
        CustomOverlay: new (options: {
          position: unknown;
          content: string | HTMLElement;
          zIndex?: number;
        }) => {
          setMap: (map: unknown | null) => void;
          setPosition: (latlng: unknown) => void;
        };
        event: {
          addListener: (
            target: unknown,
            type: string,
            handler: (event: { latLng: { getLat: () => number; getLng: () => number } }) => void
          ) => void;
        };
      };
    };
  }
}
