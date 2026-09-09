import { useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import type { User } from '@supabase/supabase-js';
import cobSelection from '../../assets/cob-selection.png';
import { BuildYourOwnModal } from '../components/BuildYourOwnModal';
import { FoodImage } from '../components/FoodImage';
import { InVanStockView } from '../components/InVanStockView';
import { VanTrackingModal } from '../components/VanTrackingModal';
import { ProfileScreen } from './ProfileScreen';
import { reservableCount, type BuildYourOwnPricing, type Inventory, type Order, type OrderStatus, type Product } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type CustomerScreenProps = {
  buildPricing: BuildYourOwnPricing;
  inventory: Inventory;
  onOpenDriverPreview: () => void;
  onReserve: (product: Product, quantity: number, options: string) => void;
  onSignOut: () => Promise<void>;
  orders: Order[];
  products: Product[];
  signOutError: string | null;
  signingOut: boolean;
  stopMode: boolean;
  user: User;
};

type CustomerTab = 'home' | 'inVan' | 'orders' | 'profile';

const sauces = ['No sauce', 'Brown sauce', 'Red sauce'];
const categories: Array<{ id: Product['category']; label: string }> = [
  { id: 'cobs', label: 'Cobs & baguettes' },
  { id: 'wraps', label: 'Wraps' },
  { id: 'breakfast', label: 'Breakfast boxes' },
];

const statusLabels: Record<OrderStatus, string> = {
  reserved: 'Reserved',
  preparing: 'Preparing',
  ready: 'Ready',
  collected: 'Collected',
};

export function CustomerScreen({ buildPricing, inventory, onOpenDriverPreview, onReserve, onSignOut, orders, products, signOutError, signingOut, stopMode, user }: CustomerScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Product | null>(null);
  const [sauce, setSauce] = useState(sauces[0]);
  const [quantity, setQuantity] = useState(1);
  const [reserved, setReserved] = useState(false);
  const [category, setCategory] = useState<Product['category']>('cobs');
  const [tracking, setTracking] = useState(false);
  const [building, setBuilding] = useState(false);
  const [tab, setTab] = useState<CustomerTab>('home');

  const openProduct = (product: Product) => {
    setSelected(product);
    setSauce(sauces[0]);
    setQuantity(1);
  };

  const closeProduct = () => setSelected(null);

  const reserve = () => {
    if (!selected || reservableCount(inventory[selected.id]) < quantity) return;
    onReserve(selected, quantity, selected.id === 'tuna-mayo' ? 'No sauce' : sauce);
    setReserved(true);
    setSelected(null);
  };

  const totalAvailable = products.reduce(
    (sum, product) => sum + (product.available ? reservableCount(inventory[product.id]) : 0),
    0,
  );

  const selectedAvailable = selected ? reservableCount(inventory[selected.id]) : 0;
  const visibleProducts = products.filter((product) => product.available && product.category === category);
  const customerOrders = orders.filter((order) => order.customer === 'Jamie P.');

  const renderProductCard = (product: Product) => {
    const available = reservableCount(inventory[product.id]);
    const showLowStock = product.category === 'cobs' && available <= 3;
    const stockLabel = available === 0
      ? 'SOLD OUT ONLINE'
      : showLowStock
        ? `ONLY ${available} LEFT`
        : product.badge;
    return (
      <Pressable
        accessibilityLabel={`Choose ${product.name}, £${product.price.toFixed(2)}`}
        accessibilityState={{ disabled: available === 0 }}
        key={product.id}
        onPress={() => {
          if (available === 0) return;
          if (product.custom) setBuilding(true);
          else openProduct(product);
        }}
        style={({ pressed }) => [styles.productCard, available === 0 && styles.cardDisabled, pressed && styles.cardPressed]}
      >
        <View style={styles.productImageWrap}>
          <FoodImage image={product.image} />
          {stockLabel ? (
            <View style={[styles.badge, (available === 0 || showLowStock) && styles.badgeUrgent]}>
              <Text style={styles.badgeText}>{stockLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.productCopy}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text numberOfLines={2} style={styles.productDescription}>{product.description}</Text>
          <View style={styles.productBottom}>
            <Text style={styles.price}>{product.custom ? 'FROM ' : ''}£{product.price.toFixed(2)}</Text>
            <View style={[styles.addButton, available === 0 && styles.addButtonDisabled]}>
              <Text style={styles.addButtonText}>{available === 0 ? '×' : '+'}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'home' ? <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>MONDAY · ACERO</Text>
            <Text style={styles.greeting}>Morning, Jamie</Text>
          </View>
        </View> : null}

        {tab === 'home' ? (
          <>
        {reserved ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>Your food is reserved</Text>
              <Text style={styles.successBody}>Collect at Acero · 10:15–10:25</Text>
            </View>
            <Pressable accessibilityLabel="Dismiss reservation message" onPress={() => setReserved(false)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        ) : null}

        <ImageBackground
          source={cobSelection}
          imageStyle={styles.heroImage}
          style={styles.hero}
        >
          <View style={styles.heroShade} />
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityLabel={`${stopMode ? 'At Acero now' : 'On the way'}. Track the van on the map`}
              accessibilityRole="button"
              onPress={() => setTracking(true)}
              style={({ pressed }) => [styles.livePill, pressed && styles.heroControlPressed]}
            >
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{stopMode ? 'AT ACERO NOW' : 'ON THE WAY'}</Text>
              <Text style={styles.liveLinkIcon}>↗</Text>
            </Pressable>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>The Cob Van</Text>
            <View style={styles.etaRow}>
              <Text style={styles.etaTime}>{stopMode ? 'NOW' : '10:15'}</Text>
              <View style={styles.etaDivider} />
              <View>
                <Text style={styles.etaLabel}>{stopMode ? 'STOP MODE' : 'ARRIVING IN'}</Text>
                <Text style={styles.etaMinutes}>{stopMode ? 'Order before it goes' : '12 minutes'}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.cutoffCard}>
          <View style={styles.cutoffClock}><Text style={styles.cutoffClockText}>◷</Text></View>
          <View style={styles.cutoffCopy}>
            <Text style={styles.cutoffTitle}>Breakfast orders close at 9:45</Text>
            <Text style={styles.cutoffBody}>18 minutes left to reserve for Acero</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Order ahead</Text>
            <Text style={styles.sectionHint}>Choose from today’s menu before the van arrives.</Text>
          </View>
          <Text style={styles.available}>{totalAvailable} to reserve</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.categoryRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: category === item.id }}
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[styles.categoryChip, category === item.id && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryText, category === item.id && styles.categoryTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.productList}>{visibleProducts.map(renderProductCard)}</View>

          </>
        ) : tab === 'inVan' ? (
          <InVanStockView inventory={inventory} onChoose={openProduct} products={products} />
        ) : tab === 'orders' ? (
          <View style={styles.tabScreen}>
            <Text style={styles.tabEyebrow}>ACERO · TODAY</Text>
            <Text style={styles.tabTitle}>Your orders</Text>
            <Text style={styles.tabSubtitle}>Current and recent reservations.</Text>
            {customerOrders.length > 0 ? (
              <View style={styles.customerOrderList}>
                {customerOrders.map((order) => (
                  <View key={order.id} style={styles.customerOrderCard}>
                    <View style={styles.customerOrderTop}>
                      <View style={styles.customerOrderCopy}>
                        <Text style={styles.customerOrderName}>{order.quantity}× {order.itemName}</Text>
                        <Text style={styles.customerOrderNumber}>ORDER #{order.orderNumber}</Text>
                      </View>
                      <Text style={styles.customerOrderPrice}>£{order.total.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.customerOrderOptions}>{order.options}</Text>
                    <View style={styles.customerOrderBottom}>
                      <View style={[styles.customerStatus, styles[`customerStatus_${order.status}`]]}>
                        <Text style={[styles.customerStatusText, order.status === 'ready' && styles.customerStatusTextReady]}>{statusLabels[order.status]}</Text>
                      </View>
                      <View style={styles.collectionCopy}>
                        <Text style={styles.collectionLocation}>Acero</Text>
                        <Text style={styles.collectionTime}>10:15–10:25</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>◷</Text>
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptyBody}>Your reservations will appear here.</Text>
                <Pressable onPress={() => setTab('home')} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Order breakfast</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <ProfileScreen
            onOpenDriverPreview={onOpenDriverPreview}
            onSignOut={onSignOut}
            signOutError={signOutError}
            signingOut={signingOut}
            user={user}
          />
        )}
      </ScrollView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'home' }} onPress={() => setTab('home')} style={styles.tab}>
          <Feather color={tab === 'home' ? colors.orange : colors.muted} name="home" size={22} strokeWidth={2.2} />
          <Text style={tab === 'home' ? styles.tabActiveText : styles.tabText}>Home</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'inVan' }} onPress={() => setTab('inVan')} style={styles.tab}>
          <Feather color={tab === 'inVan' ? colors.orange : colors.muted} name="truck" size={22} strokeWidth={2.2} />
          <Text style={tab === 'inVan' ? styles.tabActiveText : styles.tabText}>In the van</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'orders' }} onPress={() => setTab('orders')} style={styles.tab}>
          <Feather color={tab === 'orders' ? colors.orange : colors.muted} name="clipboard" size={22} strokeWidth={2.2} />
          <Text style={tab === 'orders' ? styles.tabActiveText : styles.tabText}>Orders</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'profile' }} onPress={() => setTab('profile')} style={styles.tab}>
          <Feather color={tab === 'profile' ? colors.orange : colors.muted} name="user" size={22} strokeWidth={2.2} />
          <Text style={tab === 'profile' ? styles.tabActiveText : styles.tabText}>Profile</Text>
        </Pressable>
      </View>

      <Modal animationType="slide" onRequestClose={closeProduct} transparent visible={selected !== null}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityLabel="Close product" onPress={closeProduct} style={styles.modalDismissArea} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xxl) }]}>
            <View style={styles.sheetHandle} />
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetImage}><FoodImage image={selected.image} /></View>
                  <View style={styles.sheetTitleWrap}>
                    <Text style={styles.sheetTitle}>{selected.name}</Text>
                    <Text style={styles.sheetPrice}>£{selected.price.toFixed(2)}</Text>
                    <Text style={styles.sheetStock}>{selectedAvailable} available to reserve</Text>
                  </View>
                </View>
                {selected.id !== 'tuna-mayo' ? (
                  <>
                    <Text style={styles.choiceLabel}>SAUCE</Text>
                    <View style={styles.sauceRow}>
                      {sauces.map((item) => (
                        <Pressable key={item} onPress={() => setSauce(item)} style={[styles.sauceChip, sauce === item && styles.sauceChipActive]}>
                          <Text style={[styles.sauceText, sauce === item && styles.sauceTextActive]}>{item}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}
                <View style={styles.checkoutRow}>
                  <View style={styles.stepper}>
                    <Pressable accessibilityLabel="Decrease quantity" onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Pressable
                      accessibilityLabel="Increase quantity"
                      accessibilityState={{ disabled: quantity >= selectedAvailable }}
                      disabled={quantity >= selectedAvailable}
                      onPress={() => setQuantity(Math.min(selectedAvailable, quantity + 1))}
                      style={[styles.stepButton, quantity >= selectedAvailable && styles.stepButtonDisabled]}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityState={{ disabled: selectedAvailable === 0 }}
                    disabled={selectedAvailable === 0}
                    onPress={reserve}
                    style={[styles.reserveButton, selectedAvailable === 0 && styles.reserveButtonDisabled]}
                  >
                    <Text style={styles.reserveText}>{selectedAvailable === 0 ? 'Buy at the van' : 'Reserve mine'}</Text>
                    <Text style={styles.reservePrice}>£{(selected.price * quantity).toFixed(2)}</Text>
                  </Pressable>
                </View>
                <Text style={styles.payNote}>No payment now · Your food is held for 10 minutes</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <BuildYourOwnModal
        available={reservableCount(inventory['build-your-own'])}
        onClose={() => setBuilding(false)}
        onReserve={(product, customQuantity, options) => {
          onReserve(product, customQuantity, options);
          setReserved(true);
        }}
        pricing={buildPricing}
        visible={building}
      />
      <VanTrackingModal onClose={() => setTracking(false)} visible={tracking} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  topBar: { marginBottom: spacing.xl },
  eyebrow: { color: colors.orange, fontSize: type.tiny, fontWeight: '800', letterSpacing: 1.2 },
  greeting: { color: colors.ink, fontSize: type.title, fontWeight: '800', marginTop: spacing.xs },
  successCard: { alignItems: 'center', backgroundColor: colors.greenSoft, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.md, padding: spacing.md },
  successIcon: { alignItems: 'center', backgroundColor: colors.green, borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 },
  successIconText: { color: colors.paper, fontSize: type.body, fontWeight: '900' },
  successCopy: { flex: 1, marginLeft: spacing.md },
  successTitle: { color: colors.ink, fontSize: type.body, fontWeight: '800' },
  successBody: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  closeText: { color: colors.muted, fontSize: type.title, padding: spacing.sm },
  hero: { height: 272, justifyContent: 'space-between', marginBottom: spacing.xxl, overflow: 'hidden', padding: spacing.lg },
  heroImage: { borderRadius: radius.lg },
  heroShade: { backgroundColor: 'rgba(13,27,42,0.38)', borderRadius: radius.lg, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  heroTopRow: { alignItems: 'center', flexDirection: 'row', zIndex: 1 },
  livePill: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.pill, flexDirection: 'row', minHeight: spacing.xxxl + spacing.sm, paddingHorizontal: spacing.md },
  liveDot: { backgroundColor: colors.green, borderRadius: radius.pill, height: 8, marginRight: spacing.sm, width: 8 },
  liveText: { color: colors.ink, fontSize: type.tiny, fontWeight: '900', letterSpacing: 0.8 },
  liveLinkIcon: { color: colors.orange, fontSize: type.body, fontWeight: '900', marginLeft: spacing.sm },
  heroControlPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  heroCopy: { zIndex: 1 },
  heroTitle: { color: colors.paper, fontSize: type.hero, fontWeight: '900', letterSpacing: -0.8 },
  etaRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm },
  etaTime: { color: colors.mustard, fontSize: 42, fontWeight: '900', letterSpacing: -1.5 },
  etaDivider: { backgroundColor: colors.paper, height: 34, marginHorizontal: spacing.md, opacity: 0.45, width: 1 },
  etaLabel: { color: colors.paper, fontSize: type.tiny, fontWeight: '700', letterSpacing: 0.8, opacity: 0.8 },
  etaMinutes: { color: colors.paper, fontSize: type.body, fontWeight: '800', marginTop: 2 },
  cutoffCard: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, flexDirection: 'row', marginBottom: spacing.xxl, padding: spacing.md },
  cutoffClock: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.pill, height: 40, justifyContent: 'center', width: 40 },
  cutoffClockText: { color: colors.mustard, fontSize: type.title, fontWeight: '900' },
  cutoffCopy: { flex: 1, marginLeft: spacing.md },
  cutoffTitle: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  cutoffBody: { color: colors.inkSoft, fontSize: type.tiny, marginTop: spacing.xs },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  sectionHint: { color: colors.muted, fontSize: type.label, marginTop: spacing.xs },
  available: { color: colors.green, fontSize: type.label, fontWeight: '800' },
  categoryRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  categoryChip: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg },
  categoryChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  categoryText: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  categoryTextActive: { color: colors.paper },
  productList: { gap: spacing.md },
  productCard: { backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row', minHeight: 142, padding: spacing.sm, ...shadow },
  cardDisabled: { opacity: 0.58 },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  productImageWrap: { height: 126, position: 'relative', width: 126 },
  badge: { backgroundColor: colors.mustard, borderRadius: radius.pill, left: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, position: 'absolute', top: spacing.sm },
  badgeUrgent: { backgroundColor: colors.red },
  badgeText: { color: colors.paper, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  productCopy: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  productName: { color: colors.ink, flex: 1, fontSize: type.body, fontWeight: '900', paddingRight: spacing.xs },
  productDescription: { color: colors.muted, fontSize: type.tiny, lineHeight: 18 },
  productBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  price: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  addButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, height: 36, justifyContent: 'center', width: 36 },
  addButtonDisabled: { backgroundColor: colors.line },
  addButtonText: { color: colors.ink, fontSize: type.title, fontWeight: '700', lineHeight: 25 },
  tabScreen: { paddingBottom: spacing.xxl },
  tabEyebrow: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginTop: spacing.sm },
  tabTitle: { color: colors.ink, fontSize: type.hero, fontWeight: '900', marginTop: spacing.xs },
  tabSubtitle: { color: colors.muted, fontSize: type.label, marginBottom: spacing.xl, marginTop: spacing.xs },
  emptyCard: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, padding: spacing.xxl, ...shadow },
  emptyIcon: { color: colors.orange, fontSize: type.hero },
  emptyTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900', marginTop: spacing.md },
  emptyBody: { color: colors.muted, fontSize: type.label, lineHeight: 20, marginTop: spacing.xs, textAlign: 'center' },
  emptyButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 48, paddingHorizontal: spacing.xl },
  emptyButtonText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  customerOrderList: { gap: spacing.md },
  customerOrderCard: { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.lg, ...shadow },
  customerOrderTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  customerOrderCopy: { flex: 1, paddingRight: spacing.md },
  customerOrderName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  customerOrderNumber: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 0.6, marginTop: spacing.xs },
  customerOrderPrice: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  customerOrderOptions: { color: colors.muted, fontSize: type.label, lineHeight: 20, marginTop: spacing.md },
  customerOrderBottom: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md },
  customerStatus: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  customerStatus_reserved: { backgroundColor: colors.cream },
  customerStatus_preparing: { backgroundColor: colors.mustard },
  customerStatus_ready: { backgroundColor: colors.green },
  customerStatus_collected: { backgroundColor: colors.line },
  customerStatusText: { color: colors.ink, fontSize: type.tiny, fontWeight: '900' },
  customerStatusTextReady: { color: colors.paper },
  collectionCopy: { alignItems: 'flex-end' },
  collectionLocation: { color: colors.ink, fontSize: type.tiny, fontWeight: '900' },
  collectionTime: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.xs },
  tabBar: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, bottom: 0, flexDirection: 'row', left: 0, paddingBottom: spacing.lg, paddingTop: spacing.md, position: 'absolute', right: 0 },
  tab: { alignItems: 'center', flex: 1, gap: spacing.xs },
  tabActiveText: { color: colors.ink, fontSize: type.tiny, fontWeight: '800' },
  tabText: { color: colors.muted, fontSize: type.tiny, fontWeight: '700' },
  modalBackdrop: { backgroundColor: 'rgba(13,27,42,0.56)', flex: 1, justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  sheetHandle: { alignSelf: 'center', backgroundColor: colors.line, borderRadius: radius.pill, height: 5, marginBottom: spacing.lg, width: 52 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xl },
  sheetImage: { height: 84, width: 84 },
  sheetTitleWrap: { flex: 1, marginLeft: spacing.lg },
  sheetTitle: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  sheetPrice: { color: colors.orange, fontSize: type.body, fontWeight: '900', marginTop: spacing.xs },
  sheetStock: { color: colors.green, fontSize: type.tiny, fontWeight: '800', marginTop: spacing.xs },
  choiceLabel: { color: colors.muted, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.md },
  sauceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  sauceChip: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  sauceChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  sauceText: { color: colors.ink, fontSize: type.label, fontWeight: '700' },
  sauceTextActive: { color: colors.paper },
  checkoutRow: { flexDirection: 'row', gap: spacing.md },
  stepper: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row' },
  stepButton: { alignItems: 'center', height: 56, justifyContent: 'center', width: 44 },
  stepButtonDisabled: { opacity: 0.3 },
  stepText: { color: colors.ink, fontSize: type.title, fontWeight: '800' },
  quantity: { color: colors.ink, fontSize: type.body, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  reserveButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, flex: 1, flexDirection: 'row', height: 56, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  reserveButtonDisabled: { backgroundColor: colors.line },
  reserveText: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  reservePrice: { color: colors.ink, fontSize: type.body, fontWeight: '800' },
  payNote: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.md, textAlign: 'center' },
});
