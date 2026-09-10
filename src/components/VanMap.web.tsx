import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, type } from '../theme';
import type { VanCoordinate } from './VanMap.native';

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

export function VanMap({ coordinate }: VanMapProps) {
  const index = Math.max(0, vanRoute.findIndex((point) => point.latitude === coordinate.latitude));
  const progress = `${14 + index * 16}%` as `${number}%`;

  return (
    <View style={styles.map}>
      <View style={styles.roadOne} />
      <View style={styles.roadTwo} />
      <View style={styles.route} />
      <View style={[styles.vanMarker, { left: progress }]}><Text style={styles.vanText}>🚐</Text></View>
      <View style={styles.stopMarker}><Text style={styles.stopText}>A</Text></View>
      <Text style={styles.mapLabel}>Simulated map preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { backgroundColor: colors.greenSoft, flex: 1, overflow: 'hidden' },
  roadOne: { backgroundColor: colors.paper, height: 74, left: '-10%', position: 'absolute', top: '42%', transform: [{ rotate: '-12deg' }], width: '120%' },
  roadTwo: { backgroundColor: colors.paper, height: 56, left: '28%', position: 'absolute', top: '10%', transform: [{ rotate: '68deg' }], width: '90%' },
  route: { backgroundColor: colors.orange, borderRadius: radius.pill, height: 7, left: '12%', position: 'absolute', top: '53%', transform: [{ rotate: '-12deg' }], width: '70%' },
  vanMarker: { alignItems: 'center', backgroundColor: colors.mustard, borderColor: colors.paper, borderRadius: radius.pill, borderWidth: 3, height: 50, justifyContent: 'center', position: 'absolute', top: '44%', width: 50 },
  vanText: { fontSize: 25 },
  stopMarker: { alignItems: 'center', backgroundColor: colors.ink, borderColor: colors.paper, borderRadius: radius.pill, borderWidth: 3, height: 42, justifyContent: 'center', left: '82%', position: 'absolute', top: '36%', width: 42 },
  stopText: { color: colors.mustard, fontSize: type.body, fontWeight: '900' },
  mapLabel: { bottom: 18, color: colors.muted, fontSize: type.tiny, fontWeight: '800', left: 18, position: 'absolute' },
});
