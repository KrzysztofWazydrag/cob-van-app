import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { products, reservableCount, type Inventory, type Order, type OrderStatus } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type DriverScreenProps = {
  inventory: Inventory;
  onAdvanceOrder: (orderId: string) => void;
  onRolePress: () => void;
  onToggleStopMode: () => void;
  onWalkUpSale: (productId: string) => void;
  orders: Order[];
  stopMode: boolean;
};

const statusLabels: Record<OrderStatus, string> = {
  reserved: 'Reserved',
  preparing: 'Preparing',
  ready: 'Ready',
  collected: 'Collected',
};

const actionLabels: Record<OrderStatus, string> = {
  reserved: 'Start preparing',
  preparing: 'Mark ready',
  ready: 'Hand over',
  collected: 'Collected',
};

export function DriverScreen({ inventory, onAdvanceOrder, onRolePress, onToggleStopMode, onWalkUpSale, orders, stopMode }: DriverScreenProps) {
  const [tab, setTab] = useState<'orders' | 'stock'>('orders');
  const readyCount = orders.filter((order) => order.status === 'ready').length;
  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const reservedItems = Object.values(inventory).reduce((sum, stock) => sum + stock.reserved, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
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
            <Pressable onPress={onToggleStopMode} style={[styles.arrivedButton, stopMode && styles.arrivedButtonDone]}>
              <Text style={[styles.arrivedText, stopMode && styles.arrivedTextDone]}>{stopMode ? '✓ Stop mode' : 'Mark arrived'}</Text>
            </Pressable>
          </View>
        </View>

        {stopMode ? (
          <View style={styles.modeBanner}>
            <View style={styles.modeDot} />
            <View style={styles.modeCopy}>
              <Text style={styles.modeTitle}>Stop Mode is live</Text>
              <Text style={styles.modeBody}>Walk-up buffer is protected. Record counter sales with one tap.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>ORDERS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>£{totalRevenue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>RESERVED</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.greenText]}>{readyCount}/{orders.length}</Text>
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
              <Text style={styles.listTitle}>ACERO · {orders.length} orders</Text>
              <Text style={styles.listHint}>Current stop</Text>
            </View>
            <View style={styles.orderList}>
              {orders.map((order) => {
                const isCollected = order.status === 'collected';
                const isReady = order.status === 'ready';
                return (
                  <View key={order.id} style={[styles.orderCard, isReady && styles.orderCardReady, isCollected && styles.orderCardCollected]}>
                    <View style={styles.orderMainRow}>
                      <View style={[styles.initials, isReady && styles.initialsReady]}>
                        <Text style={[styles.initialsText, isReady && styles.initialsTextReady]}>{order.initials}</Text>
                      </View>
                      <View style={styles.orderCopy}>
                        <View style={styles.orderNameRow}>
                          <Text style={styles.orderName}>{order.customer}</Text>
                          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                        </View>
                        <Text style={styles.orderItems}>{order.quantity}× {order.itemName}</Text>
                        <Text style={styles.orderOptions}>{order.options}</Text>
                      </View>
                      <Text style={styles.orderPrice}>£{order.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.orderActionRow}>
                      <View style={[styles.statusPill, styles[`status_${order.status}`]]}>
                        <Text style={[styles.statusText, order.status === 'ready' && styles.statusTextReady]}>{statusLabels[order.status]}</Text>
                      </View>
                      <Pressable
                        accessibilityLabel={`${actionLabels[order.status]} for order ${order.orderNumber}`}
                        accessibilityState={{ disabled: isCollected }}
                        disabled={isCollected}
                        onPress={() => onAdvanceOrder(order.id)}
                        style={[styles.orderActionButton, isCollected && styles.orderActionButtonDisabled]}
                      >
                        <Text style={[styles.orderActionText, isCollected && styles.orderActionTextDisabled]}>{actionLabels[order.status]}</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.listHeading}>
              <Text style={styles.listTitle}>Stock for Acero</Text>
              <Text style={styles.listHint}>Physical stock split</Text>
            </View>
            <View style={styles.stockList}>
              {products.map((product) => {
                const stock = inventory[product.id];
                const walkUpAvailable = Math.min(stock.walkUpBuffer, stock.physical - stock.reserved);
                const canSellWalkUp = stopMode && walkUpAvailable > 0;

                return (
                  <View key={product.id} style={styles.stockCard}>
                    <View style={styles.stockTopRow}>
                      <View style={styles.stockName}>
                        <Text style={styles.stockItem}>{product.name}</Text>
                        <Text style={styles.stockTotal}>{stock.physical} physically in van</Text>
                      </View>
                      <View style={[styles.stockHealth, reservableCount(stock) <= 2 && styles.stockHealthLow]}>
                        <Text style={styles.stockHealthText}>{reservableCount(stock) <= 2 ? 'LOW' : 'HEALTHY'}</Text>
                      </View>
                    </View>
                    <View style={styles.stockMetrics}>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{stock.reserved}</Text>
                        <Text style={styles.stockMetricLabel}>RESERVED</Text>
                      </View>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{reservableCount(stock)}</Text>
                        <Text style={styles.stockMetricLabel}>ONLINE</Text>
                      </View>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{walkUpAvailable}</Text>
                        <Text style={styles.stockMetricLabel}>WALK-UP</Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityLabel={`Record one walk-up sale of ${product.name}`}
                      accessibilityState={{ disabled: !canSellWalkUp }}
                      disabled={!canSellWalkUp}
                      onPress={() => onWalkUpSale(product.id)}
                      style={[styles.quickSaleButton, !canSellWalkUp && styles.quickSaleButtonDisabled]}
                    >
                      <Text style={[styles.quickSaleText, !canSellWalkUp && styles.quickSaleTextDisabled]}>
                        {stopMode ? (walkUpAvailable > 0 ? '−1  Walk-up sold' : 'Walk-up allocation sold') : 'Available after arrival'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <View style={styles.insightCard}>
              <Text style={styles.insightIcon}>↘</Text>
              <View style={styles.insightCopy}>
                <Text style={styles.insightTitle}>Less guesswork today</Text>
                <Text style={styles.insightBody}>{reservedItems} items are already reserved before service.</Text>
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
  modeBanner: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.md, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md },
  modeDot: { backgroundColor: colors.green, borderRadius: radius.pill, height: 12, width: 12 },
  modeCopy: { flex: 1, marginLeft: spacing.md },
  modeTitle: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  modeBody: { color: colors.muted, fontSize: type.tiny, lineHeight: 17, marginTop: spacing.xs },
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
  orderCard: { backgroundColor: colors.paper, borderColor: colors.paper, borderRadius: radius.md, borderWidth: 2, padding: spacing.md },
  orderCardReady: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  orderCardCollected: { opacity: 0.56 },
  orderMainRow: { alignItems: 'center', flexDirection: 'row' },
  initials: { alignItems: 'center', backgroundColor: colors.mist, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  initialsReady: { backgroundColor: colors.green },
  initialsText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  initialsTextReady: { color: colors.paper },
  orderCopy: { flex: 1, marginHorizontal: spacing.md },
  orderNameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  orderNumber: { color: colors.muted, fontSize: type.tiny, fontWeight: '700' },
  orderItems: { color: colors.muted, fontSize: type.tiny, lineHeight: 17, marginTop: spacing.xs },
  orderOptions: { color: colors.ink, fontSize: type.tiny, fontWeight: '700', marginTop: spacing.xs },
  orderPrice: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  orderActionRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  status_reserved: { backgroundColor: colors.cream },
  status_preparing: { backgroundColor: colors.mustard },
  status_ready: { backgroundColor: colors.green },
  status_collected: { backgroundColor: colors.line },
  statusText: { color: colors.ink, fontSize: type.tiny, fontWeight: '900' },
  statusTextReady: { color: colors.paper },
  orderActionButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.sm, flex: 1, justifyContent: 'center', marginLeft: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  orderActionButtonDisabled: { backgroundColor: colors.line },
  orderActionText: { color: colors.paper, fontSize: type.label, fontWeight: '900' },
  orderActionTextDisabled: { color: colors.muted },
  stockList: { gap: spacing.md },
  stockCard: { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.lg },
  stockTopRow: { alignItems: 'center', flexDirection: 'row' },
  stockName: { flex: 1 },
  stockItem: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  stockTotal: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  stockHealth: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  stockHealthLow: { backgroundColor: colors.cream },
  stockHealthText: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  stockMetrics: { backgroundColor: colors.mist, borderRadius: radius.md, flexDirection: 'row', marginVertical: spacing.md, paddingVertical: spacing.md },
  stockMetric: { alignItems: 'center', flex: 1 },
  stockMetricValue: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  stockMetricLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: spacing.xs },
  quickSaleButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, justifyContent: 'center', minHeight: 48 },
  quickSaleButtonDisabled: { backgroundColor: colors.line },
  quickSaleText: { color: colors.paper, fontSize: type.label, fontWeight: '900' },
  quickSaleTextDisabled: { color: colors.muted },
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
