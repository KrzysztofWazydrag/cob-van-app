import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, spacing, type } from '../theme';

export type VanCoordinate = {
  latitude: number;
  longitude: number;
};

type VanMapProps = {
  coordinate: VanCoordinate;
};

export const vanRoute: VanCoordinate[] = [
  { latitude: 52.1288, longitude: -0.4484 },
  { latitude: 52.1301, longitude: -0.4456 },
  { latitude: 52.1318, longitude: -0.4428 },
  { latitude: 52.1335, longitude: -0.4402 },
  { latitude: 52.1351, longitude: -0.4381 },
];

function createMapHtml(initialCoordinate: VanCoordinate) {
  const route = JSON.stringify(vanRoute.map((point) => [point.latitude, point.longitude]));
  const destination = vanRoute[vanRoute.length - 1];

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; background: ${colors.cream}; }
      .leaflet-control-attribution { font: 10px system-ui, sans-serif; }
      .van-pin, .stop-pin { display: grid; place-items: center; border: 3px solid ${colors.paper}; border-radius: 999px; box-shadow: 0 5px 14px rgba(13, 27, 42, 0.25); }
      .van-pin { width: 44px; height: 44px; background: ${colors.mustard}; font-size: 24px; }
      .stop-pin { width: 36px; height: 36px; background: ${colors.ink}; color: ${colors.mustard}; font: 900 16px system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const route = ${route};
      const map = L.map('map', { attributionControl: true, zoomControl: false }).setView([52.132, -0.443], 15);
      const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(map);
      L.polyline(route, { color: '${colors.orange}', opacity: 0.95, weight: 5 }).addTo(map);

      const stopIcon = L.divIcon({ className: '', html: '<div class="stop-pin">A</div>', iconAnchor: [21, 21], iconSize: [42, 42] });
      const vanIcon = L.divIcon({ className: '', html: '<div class="van-pin">🚐</div>', iconAnchor: [25, 25], iconSize: [50, 50] });
      L.marker([${destination.latitude}, ${destination.longitude}], { icon: stopIcon }).addTo(map).bindTooltip('Acero');
      const vanMarker = L.marker([${initialCoordinate.latitude}, ${initialCoordinate.longitude}], { icon: vanIcon }).addTo(map).bindTooltip('The Cob Van');

      window.setVanCoordinate = function(latitude, longitude) {
        vanMarker.setLatLng([latitude, longitude]);
      };

      tiles.once('load', function() {
        window.ReactNativeWebView.postMessage('tiles-ready');
      });
      window.setTimeout(function() { map.invalidateSize(); }, 100);
    </script>
  </body>
</html>`;
}

export function VanMap({ coordinate }: VanMapProps) {
  const mapRef = useRef<WebView>(null);
  const [tilesReady, setTilesReady] = useState(false);
  const source = useMemo(() => ({ html: createMapHtml(coordinate) }), []);

  useEffect(() => {
    mapRef.current?.injectJavaScript(
      `window.setVanCoordinate && window.setVanCoordinate(${coordinate.latitude}, ${coordinate.longitude}); true;`,
    );
  }, [coordinate]);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === 'tiles-ready') setTilesReady(true);
  };

  return (
    <View style={styles.map}>
      <WebView
        javaScriptEnabled
        onMessage={handleMessage}
        originWhitelist={['*']}
        ref={mapRef}
        source={source}
        style={styles.webView}
      />
      {!tilesReady ? (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { backgroundColor: colors.cream, flex: 1 },
  webView: { backgroundColor: colors.cream, flex: 1 },
  loading: { alignItems: 'center', backgroundColor: colors.cream, bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  loadingText: { color: colors.muted, fontSize: type.label, fontWeight: '700', marginTop: spacing.md },
});
