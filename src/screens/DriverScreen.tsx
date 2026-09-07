import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { orders as initialOrders, products } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type DriverScreenProps = {
  onRolePress: () => void;
};

export function DriverScreen({ onRolePress }: DriverScreenProps) {
  const [readyIds, setReadyIds] = useState(() => new Set(initialOrders.filter((order) => order.status === 'ready').map((order) => order.id)));
  const [tab, setTab] = useState<'orders' | 'stock'>('orders');
  const [arrived, setArrived] = useState(false);
  const readyCount = readyIds.size;
  const totalRevenue = useMemo(() => initialOrders.reduce((sum, order) => sum + order.total, 0), []);

  const toggleReady = (id: string) => {
    setReadyIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE COB VAN · MONDAY</Text>
          <Text style={styles.title}>Next stop</Text>
        </View>
        <Pressable accessibilityLabel="Switch to customer view" onPress={onRolePress} style={styles.crewAvatar}>
          <Text style={styles.crewAvatarText}>CV</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stopCard}>
          <View style={styles.stopTop}>
            <View style={styles.stopNumber}><Text style={styles.stopNumberText}>3</Text></View>
            <View style={styles.stopCopy}>
              <Text style={styles.stopName}>Acero</Text>
              <Text style={styles.stopAddress}>Manton Lane · 1.8 miles</Text>
            </View>
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaTime}>10:15</Text>
            </View>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <View style={styles.stopActions}>
            <Pressable style={styles.navigateButton}><Text style={styles.navigateText}>↗  Navigate</Text></Pressable>
            <Pressable onPress={() => setArrived(!arrived)} style={[styles.arrivedButton, arrived && styles.arrivedButtonDone]}>
              <Text style={[styles.arrivedText, arrived && styles.arrivedTextDone]}>{arrived ? '✓ Arrived' : 'Mark arrived'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{initialOrders.length}</Text>
            <Text style={styles.statLabel}>ORDERS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>£{totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>RESERVED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.greenText]}>{readyCount}/{initialOrders.length}</Text>
            <Text style={styles.statLabel}>READY</Text>
          </View>
        </View>

        <View style={styles.segmented}>
          <Pressable onPress={() => setTab('orders')} style={[styles.segment, tab === 'orders' && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === 'orders' && styles.segmentTextActive]}>Orders</Text>
          </Pressable>
          <Pressable onPress={() => setTab('stock')} style={[styles.segment, tab === 'stock' && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === 'stock' && styles.segmentTextActive]}>Stock</Text>
          </Pressable>
        </View>

        {tab === 'orders' ? (
          <View>
            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Acero orders</Text>
              <Text style={styles.listHint}>Tap when packed</Text>
            </View>
            <View style={styles.orderList}>
              {initialOrders.map((order, index) => {
                const isReady = readyIds.has(order.id);
                return (
                  <Pressable key={order.id} onPress={() => toggleReady(order.id)} style={[styles.orderCard, isReady && styles.orderCardReady]}>
                    <View style={[styles.initials, isReady && styles.initialsReady]}><Text style={[styles.initialsText, isReady && styles.initialsTextReady]}>{order.initials}</Text></View>
                    <View style={styles.orderCopy}>
                      <View style={styles.orderNameRow}>
                        <Text style={styles.orderName}>{order.customer}</Text>
                        <Text style={styles.orderNumber}>#{104 + index}</Text>
                      </View>
                      <Text style={styles.orderItems}>{order.items}</Text>
                    </View>
                    <View style={[styles.check, isReady && styles.checkReady]}><Text style={[styles.checkText, isReady && styles.checkTextReady]}>{isReady ? '✓' : ''}</Text></View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Stock for Acero</Text>
              <Text style={styles.listHint}>Reserved + walk-in</Text>
            </View>
            <View style={styles.stockHeader}>
              <Text style={[styles.stockHeaderText, styles.stockName]}>ITEM</Text>
              <Text style={styles.stockHeaderText}>RESERVED</Text>
              <Text style={styles.stockHeaderText}>WALK-IN</Text>
            </View>
            {products.map((product, index) => (
              <View key={product.id} style={styles.stockRow}>
                <View style={styles.stockName}>
                  <Text style={styles.stockItem}>{product.name}</Text>
                  <Text style={styles.stockTotal}>{product.stock + [12, 9, 5][index]} total</Text>
                </View>
                <View style={styles.reservedCount}><Text style={styles.reservedCountText}>{[12, 9, 5][index]}</Text></View>
                <View style={styles.walkInCount}><Text style={styles.walkInCountText}>{product.stock}</Text></View>
              </View>
            ))}
            <View style={styles.insightCard}>
              <Text style={styles.insightIcon}>↘</Text>
              <View style={styles.insightCopy}>
                <Text style={styles.insightTitle}>Less guesswork today</Text>
                <Text style={styles.insightBody}>26 items are already sold before you arrive.</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.upNext}>
          <Text style={styles.upNextLabel}>UP NEXT · 10:40</Text>
          <View style={styles.upNextRow}>
            <Text style={styles.upNextName}>Amazon BHX5</Text>
            <Text style={styles.upNextOrders}>6 orders  ›</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.mist, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.paper, fontSize: type.hero, fontWeight: '900', marginTop: spacing.xs },
  crewAvatar: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  crewAvatarText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  stopCard: { backgroundColor: colors.paper, borderRadius: radius.lg, marginTop: -spacing.lg, padding: spacing.lg, ...shadow },
  stopTop: { alignItems: 'center', flexDirection: 'row' },
  stopNumber: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 },
  stopNumberText: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  stopCopy: { flex: 1, marginLeft: spacing.md },
  stopName: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  stopAddress: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  etaBox: { alignItems: 'flex-end' },
  etaLabel: { color: colors.muted, fontSize: type.tiny, fontWeight: '800', letterSpacing: 0.8 },
  etaTime: { color: colors.orange, fontSize: type.title, fontWeight: '900', marginTop: 2 },
  progressTrack: { backgroundColor: colors.line, borderRadius: radius.pill, height: 6, marginVertical: spacing.lg, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.orange, borderRadius: radius.pill, height: '100%', width: '68%' },
  stopActions: { flexDirection: 'row', gap: spacing.sm },
  navigateButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 48 },
  navigateText: { color: colors.paper, fontSize: type.label, fontWeight: '800' },
  arrivedButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 48 },
  arrivedButtonDone: { backgroundColor: colors.greenSoft },
  arrivedText: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  arrivedTextDone: { color: colors.green },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  statCard: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, flex: 1, padding: spacing.md },
  statValue: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  greenText: { color: colors.green },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: spacing.xs },
  segmented: { backgroundColor: colors.line, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.xl, padding: spacing.xs },
  segment: { alignItems: 'center', borderRadius: radius.sm, flex: 1, minHeight: 42, justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.paper, ...shadow },
  segmentText: { color: colors.muted, fontSize: type.label, fontWeight: '800' },
  segmentTextActive: { color: colors.ink },
  listHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  listTitle: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  listHint: { color: colors.muted, fontSize: type.tiny },
  orderList: { gap: spacing.sm },
  orderCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.paper, borderRadius: radius.md, borderWidth: 2, flexDirection: 'row', minHeight: 82, padding: spacing.md },
  orderCardReady: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  initials: { alignItems: 'center', backgroundColor: colors.mist, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  initialsReady: { backgroundColor: colors.green },
  initialsText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  initialsTextReady: { color: colors.paper },
  orderCopy: { flex: 1, marginHorizontal: spacing.md },
  orderNameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  orderNumber: { color: colors.muted, fontSize: type.tiny, fontWeight: '700' },
  orderItems: { color: colors.muted, fontSize: type.tiny, lineHeight: 17, marginTop: spacing.xs },
  check: { alignItems: 'center', borderColor: colors.line, borderRadius: radius.pill, borderWidth: 2, height: 28, justifyContent: 'center', width: 28 },
  checkReady: { backgroundColor: colors.green, borderColor: colors.green },
  checkText: { color: colors.muted, fontSize: type.label, fontWeight: '900' },
  checkTextReady: { color: colors.paper },
  stockHeader: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  stockHeaderText: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center', width: 76 },
  stockName: { flex: 1 },
  stockRow: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 74, paddingHorizontal: spacing.md },
  stockItem: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  stockTotal: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  reservedCount: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.sm, justifyContent: 'center', minHeight: 36, width: 76 },
  reservedCountText: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  walkInCount: { alignItems: 'center', justifyContent: 'center', width: 76 },
  walkInCountText: { color: colors.ink, fontSize: type.body, fontWeight: '800' },
  insightCard: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.md, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.lg },
  insightIcon: { color: colors.green, fontSize: type.hero, fontWeight: '900' },
  insightCopy: { flex: 1, marginLeft: spacing.md },
  insightTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  insightBody: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  upNext: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: spacing.xxl, paddingTop: spacing.lg },
  upNextLabel: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  upNextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  upNextName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  upNextOrders: { color: colors.muted, fontSize: type.label, fontWeight: '700' },
});
