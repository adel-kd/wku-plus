import React, { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView as WebViewType } from 'react-native-webview';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WebView = WebViewType as any;
import { colors } from '@/theme';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  emphasize?: boolean;
}

interface Props {
  markers: MapMarker[];
  me?: { lat: number; lng: number } | null;
  runner?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerPress?: (id: string) => void;
  height?: number;
  routeTo?: { lat: number; lng: number } | null;
}

/** Leaflet + OpenStreetMap tiles inside a WebView — no API key, no native map SDK. */
export const LeafletMap: React.FC<Props> = ({
  markers,
  me,
  runner,
  center,
  zoom = 16,
  onMarkerPress,
  height = 260,
  routeTo,
}) => {
  const ref = useRef<WebViewType>(null);
  const c = center ?? (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 8.2143, lng: 37.8038 });

  const html = useMemo(
    () => `<!DOCTYPE html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html,body,#map{height:100%;margin:0;padding:0;background:${colors.bg};}
        .wku-pin{width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;border:2px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);}
        .wku-pin .dot{width:10px;height:10px;border-radius:50%;background:#fff;transform:rotate(45deg);}
        .wku-me{width:18px;height:18px;border-radius:50%;background:#1EAEFF;border:3px solid #fff;
          box-shadow:0 0 0 4px rgba(30,174,255,0.25);}
        .wku-runner{width:26px;height:26px;border-radius:50%;background:#2E9E6B;border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;
          font-size:13px;}
        .leaflet-control-attribution{font-size:9px;}
      </style>
    </head><body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: true })
          .setView([${c.lat}, ${c.lng}], ${zoom});
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        function pin(color){
          return L.divIcon({ className:'', html: '<div class="wku-pin" style="background:'+color+'"><span class="dot"></span></div>', iconSize:[30,30], iconAnchor:[15,30] });
        }

        var markers = ${JSON.stringify(markers)};
        markers.forEach(function(m){
          var mk = L.marker([m.lat, m.lng], { icon: pin(m.color || '#1EAEFF') }).addTo(map);
          mk.bindTooltip(m.label, { direction: 'top', offset: [0,-28] });
          mk.on('click', function(){
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(m.id);
          });
          if (m.emphasize) mk.openTooltip();
        });

        var me = ${me ? JSON.stringify(me) : 'null'};
        if (me) {
          L.marker([me.lat, me.lng], { icon: L.divIcon({ className:'', html:'<div class="wku-me"></div>', iconSize:[18,18] }) })
            .addTo(map).bindTooltip('You', { direction:'top' });
        }
        var runner = ${runner ? JSON.stringify(runner) : 'null'};
        if (runner) {
          L.marker([runner.lat, runner.lng], { icon: L.divIcon({ className:'', html:'<div class="wku-runner">🛵</div>', iconSize:[26,26] }) })
            .addTo(map).bindTooltip('Runner', { direction:'top' });
        }
        var routeTo = ${routeTo ? JSON.stringify(routeTo) : 'null'};
        if (routeTo && me) {
          L.polyline([[me.lat, me.lng],[routeTo.lat, routeTo.lng]], { color:'#1EAEFF', weight:3, dashArray:'6,8' }).addTo(map);
        }

        if (markers.length > 1 && !${center ? 'true' : 'false'}) {
          var bounds = L.latLngBounds(markers.map(function(m){ return [m.lat, m.lng]; }));
          map.fitBounds(bounds, { padding: [30,30] });
        }
      </script>
    </body></html>`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [markers, me, runner, routeTo],
  );

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: colors.bg }}
        onMessage={(e: any) => onMarkerPress?.(e.nativeEvent.data)}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
