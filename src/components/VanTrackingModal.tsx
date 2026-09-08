import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VanMap, vanRoute } from './VanMap';
import { colors, radius, shadow, spacing, type } from '../theme';

type VanTrackingModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function VanTrackingModal({ onClose, visible }: VanTrackingModalProps) {
  const [routeIndex, setRouteIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setRouteIndex(0);
      return undefined;
    }

    const timer = setInterval(() => {
      setRouteIndex((current) => Math.min(current + 1, vanRoute.length - 1));
    }, 1800);

    return () => clearInterval(timer);
  }, [visible]);

  const arrived = routeIndex === vanRoute.length - 1;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{arrived ? 'ARRIVED' : 'LIVE · 2 STOPS AWAY'}</Text>
            <Text style={styles.title}>The Cob Van</Text>
          </View>
          <Pressable accessibilityLabel="Close van tracking" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        <View style={styles.mapWrap}>
          <VanMap coordinate={vanRoute[routeIndex]} />
        </View>
        <View style={styles.arrivalCard}>
          <View style={styles.arrivalIcon}><Text style={styles.arrivalIconText}>{arrived ? '✓' : '🚐'}</Text></View>
          <View style={styles.arrivalCopy}>
            <Text style={styles.arrivalLabel}>{arrived ? 'The van is at Acero' : 'Arriving at Acero'}</Text>
            <Text style={styles.arrivalTime}>{arrived ? 'Collect your order now' : `${Math.max(1, 4 - routeIndex)} minutes`}</Text>
          </View>
          <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.cream, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.paper, fontSize: type.title, fontWeight: '900', marginTop: spacing.xs },
  closeButton: { alignItems: 'center', backgroundColor: colors.inkSoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  closeText: { color: colors.paper, fontSize: type.hero, lineHeight: 36 },
  mapWrap: { flex: 1 },
  arrivalCard: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, bottom: spacing.xl, flexDirection: 'row', left: spacing.lg, padding: spacing.lg, position: 'absolute', right: spacing.lg, ...shadow },
  arrivalIcon: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 },
  arrivalIconText: { fontSize: type.title },
  arrivalCopy: { flex: 1, marginLeft: spacing.md },
  arrivalLabel: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  arrivalTime: { color: colors.ink, fontSize: type.title, fontWeight: '900', marginTop: spacing.xs },
  livePill: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.pill, flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  liveDot: { backgroundColor: colors.green, borderRadius: radius.pill, height: 7, marginRight: spacing.xs, width: 7 },
  liveText: { color: colors.green, fontSize: type.tiny, fontWeight: '900' },
});
