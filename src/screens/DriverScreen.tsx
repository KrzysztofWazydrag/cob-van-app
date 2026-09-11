import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuPricesModal } from '../components/MenuPricesModal';
import { availableStock, type BuildYourOwnPricing, type Inventory, type Order, type OrderStatus, type Product, type WalkUpSaleEvent } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type DriverScreenProps = {
  buildPricing: BuildYourOwnPricing;
  currentWorkplace: string;
  inventory: Inventory;
  onAdvanceOrder: (orderId: string) => void;
  onRolePress: () => void;
  onSignOut: () => Promise<void>;
  signOutError: string | null;
  signingOut: boolean;
  onSaveBuildPricing: (pricing: BuildYourOwnPricing) => void;
  onSaveProduct: (productId: string, price: number, available: boolean) => void;
  onToggleStopMode: () => void;
  onUndoWalkUpSale: (eventId: string) => void;
  onWalkUpSale: (productId: string, workplace: string) => void;
  orders: Order[];
  products: Product[];
  stopMode: boolean;
  walkUpSales: WalkUpSaleEvent[];
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

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function DriverScreen({ buildPricing, currentWorkplace, inventory, onAdvanceOrder, onRolePress, onSignOut, signOutError, signingOut, onSaveBuildPricing, onSaveProduct, onToggleStopMode, onUndoWalkUpSale, onWalkUpSale, orders, products, stopMode, walkUpSales }: DriverScreenProps) {
  const [tab, setTab] = useState<'orders' | 'stock'>('orders');
  const [menuPricesOpen, setMenuPricesOpen] = useState(false);
  const readyCount = orders.filter((order) => order.status === 'ready').length;
  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const reservedItems = Object.values(inventory).reduce((sum, stock) => sum + stock.reserved, 0);
  const latestSale = walkUpSales[0];
  const recentSales = walkUpSales.filter((sale) => sale.workplace === currentWorkplace).slice(0, 3);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>THE COB VAN · MONDAY</Text>
          <Text style={styles.title}>Next stop</Text>
        </View>
        {__DEV__ ? (
          <Pressable accessibilityLabel="Return to customer preview" onPress={onRolePress} style={styles.devExitButton}>
            <Text style={styles.devExitText}>DEV · CUSTOMER</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {signOutError ? <Text accessibilityRole="alert" style={styles.signOutError}>{signOutError}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: signingOut, busy: signingOut }} disabled={signingOut} onPress={onSignOut} style={styles.logoutButton}>
          <Text style={styles.navigateText}>{signingOut ? 'Logging out…' : 'Log out'}</Text>
        </Pressable>
        <View style={styles.stopCard}>
          <View style={styles.stopTop}>
            <View style={styles.stopNumber}><Text style={styles.stopNumberText}>3</Text></View>
            <View style={styles.stopCopy}>
              <Text style={styles.stopName}>{currentWorkplace}</Text>
              <Text style={styles.stopAddress}>Manton Lane · 1.8 miles</Text>
            </View>
            <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaTime}>10:15</Text>
            </View>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <View style={styles.stopActions}>
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
              <Text style={styles.modeBody}>Reserved orders are protected. Record counter sales with one tap.</Text>
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

        <Pressable
          accessibilityLabel="Open Menu and prices"
          onPress={() => setMenuPricesOpen(true)}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <View style={styles.menuButtonIcon}><Text style={styles.menuButtonIconText}>£</Text></View>
          <View style={styles.menuButtonCopy}>
            <Text style={styles.menuButtonTitle}>Menu & prices</Text>
            <Text style={styles.menuButtonHint}>Prices and availability</Text>
          </View>
          <Text style={styles.menuButtonArrow}>›</Text>
        </Pressable>

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
              <Text style={styles.listTitle}>{currentWorkplace.toUpperCase()} · {orders.length} orders</Text>
              <Text style={styles.listHint}>Current stop</Text>
            </View>
            <View style={styles.orderList}>
              {orders.map((order) => {
                const isCollected = order.status === 'collected';
                const isReady = order.status === 'ready';
                const actionLabel = order.fulfilmentType === 'ready_stock' && order.status === 'reserved'
                  ? 'Mark ready'
                  : actionLabels[order.status];
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
                        accessibilityLabel={`${actionLabel} for order ${order.orderNumber}`}
                        accessibilityState={{ disabled: isCollected }}
                        disabled={isCollected}
                        onPress={() => onAdvanceOrder(order.id)}
                        style={[styles.orderActionButton, isCollected && styles.orderActionButtonDisabled]}
                      >
                        <Text style={[styles.orderActionText, isCollected && styles.orderActionTextDisabled]}>{actionLabel}</Text>
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
              <Text style={styles.listTitle}>Stock for {currentWorkplace}</Text>
              <Text style={styles.listHint}>Shared physical stock</Text>
            </View>
            {recentSales.length > 0 ? (
              <View style={styles.recentSales}>
                <Text style={styles.recentSalesTitle}>Recent sales</Text>
                {recentSales.map((sale, index) => (
                  <View key={sale.id} style={[styles.recentSaleRow, index > 0 && styles.recentSaleDivider]}>
                    <Text numberOfLines={2} style={styles.recentSaleText}>
                      {sale.quantity > 1 ? `${sale.quantity}× ` : ''}{sale.productName} · {sale.workplace} · {timeFormatter.format(sale.timestamp)}
                    </Text>
                    {sale.id === latestSale?.id ? (
                      <Pressable
                        accessibilityLabel={`Undo sale of ${sale.productName}`}
                        accessibilityRole="button"
                        onPress={() => onUndoWalkUpSale(sale.id)}
                        style={({ pressed }) => [styles.undoButton, pressed && styles.undoButtonPressed]}
                      >
                        <Text style={styles.undoText}>Undo</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
            <View style={[styles.stockList, recentSales.length > 0 && styles.stockListAfterRecent]}>
              {products.filter((product) => product.fulfilmentType === 'ready_stock').map((product) => {
                const stock = inventory[product.id];
                const available = availableStock(stock);
                const canSellWalkUp = product.available && stopMode && available > 0;

                return (
                  <View key={product.id} style={styles.stockCard}>
                    <View style={styles.stockTopRow}>
                      <View style={styles.stockName}>
                        <Text style={styles.stockItem}>{product.name}</Text>
                        <Text style={styles.stockTotal}>{stock.physical} physically in van</Text>
                      </View>
                      <View style={[styles.stockHealth, availableStock(stock) <= 2 && styles.stockHealthLow]}>
                        <Text style={styles.stockHealthText}>{availableStock(stock) <= 2 ? 'LOW' : 'HEALTHY'}</Text>
                      </View>
                    </View>
                    <View style={styles.stockMetrics}>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{stock.physical}</Text>
                        <Text style={styles.stockMetricLabel}>PHYSICAL</Text>
                      </View>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{stock.reserved}</Text>
                        <Text style={styles.stockMetricLabel}>RESERVED</Text>
                      </View>
                      <View style={styles.stockMetric}>
                        <Text style={styles.stockMetricValue}>{available}</Text>
                        <Text style={styles.stockMetricLabel}>AVAILABLE</Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityLabel={`Record one walk-up sale of ${product.name}`}
                      accessibilityState={{ disabled: !canSellWalkUp }}
                      disabled={!canSellWalkUp}
                      onPress={() => onWalkUpSale(product.id, currentWorkplace)}
                      style={[styles.quickSaleButton, !canSellWalkUp && styles.quickSaleButtonDisabled]}
                    >
                      <Text style={[styles.quickSaleText, !canSellWalkUp && styles.quickSaleTextDisabled]}>
                        {!product.available ? 'Unavailable in menu' : stopMode ? (available > 0 ? 'Sell 1' : 'No unreserved stock') : 'Available after arrival'}
                      </Text>
                    </Pressable>
                    {latestSale?.productId === product.id && latestSale.workplace === currentWorkplace ? (
                      <Text accessibilityLiveRegion="polite" style={styles.saleFeedback}>
                        ✓ Sold {latestSale.quantity} · {latestSale.workplace} · {timeFormatter.format(latestSale.timestamp)}
                      </Text>
                    ) : null}
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
      <MenuPricesModal
        buildPricing={buildPricing}
        onClose={() => setMenuPricesOpen(false)}
        onSaveBuildPricing={onSaveBuildPricing}
        onSaveProduct={onSaveProduct}
        products={products}
        visible={menuPricesOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.mist, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.paper, fontSize: type.hero, fontWeight: '900', marginTop: spacing.xs },
  devExitButton: { alignItems: 'center', borderColor: colors.mustard, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: spacing.md },
  devExitText: { color: colors.mustard, fontSize: type.tiny, fontWeight: '900', letterSpacing: 0.5 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  signOutError: { color: colors.red, marginTop: spacing.md },
  logoutButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, justifyContent: 'center', minHeight: 48, marginTop: spacing.md, marginBottom: spacing.xxl },
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
  menuButton: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.lg, minHeight: spacing.xxxl * 2, padding: spacing.md, ...shadow },
  menuButtonPressed: { opacity: 0.82 },
  menuButtonIcon: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, height: spacing.xxxl + spacing.sm, justifyContent: 'center', width: spacing.xxxl + spacing.sm },
  menuButtonIconText: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  menuButtonCopy: { flex: 1, marginLeft: spacing.md },
  menuButtonTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  menuButtonHint: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  menuButtonArrow: { color: colors.orange, fontSize: type.hero, fontWeight: '900' },
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
  stockListAfterRecent: { marginTop: spacing.lg },
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
  saleFeedback: { color: colors.green, fontSize: type.tiny, fontWeight: '900', marginTop: spacing.sm, textAlign: 'center' },
  recentSales: { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.lg },
  recentSalesTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900', marginBottom: spacing.sm },
  recentSaleRow: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  recentSaleDivider: { borderTopColor: colors.line, borderTopWidth: 1 },
  recentSaleText: { color: colors.muted, flex: 1, fontSize: type.tiny, lineHeight: spacing.lg },
  undoButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.sm, justifyContent: 'center', marginLeft: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  undoButtonPressed: { backgroundColor: colors.mustardDark },
  undoText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
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
