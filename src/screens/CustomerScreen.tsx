import { useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FoodImage } from '../components/FoodImage';
import { products, type Product } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type CustomerScreenProps = {
  onRolePress: () => void;
};

const sauces = ['Brown sauce', 'Red sauce', 'No sauce'];

export function CustomerScreen({ onRolePress }: CustomerScreenProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [sauce, setSauce] = useState(sauces[0]);
  const [quantity, setQuantity] = useState(1);
  const [reserved, setReserved] = useState(false);

  const openProduct = (product: Product) => {
    setSelected(product);
    setSauce(sauces[0]);
    setQuantity(1);
  };

  const closeProduct = () => setSelected(null);

  const reserve = () => {
    setReserved(true);
    setSelected(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>MONDAY · ACERO</Text>
            <Text style={styles.greeting}>Morning, Jamie</Text>
          </View>
          <Pressable accessibilityLabel="Switch to van crew view" onPress={onRolePress} style={styles.avatar}>
            <Text style={styles.avatarText}>JP</Text>
          </Pressable>
        </View>

        {reserved ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>Your cob is reserved</Text>
              <Text style={styles.successBody}>Collect at Acero · 10:15–10:25</Text>
            </View>
            <Pressable accessibilityLabel="Dismiss reservation message" onPress={() => setReserved(false)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
        ) : null}

        <ImageBackground
          source={require('../../assets/cob-selection.png')}
          imageStyle={styles.heroImage}
          style={styles.hero}
        >
          <View style={styles.heroShade} />
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>ON THE WAY</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>The Cob Van</Text>
            <View style={styles.etaRow}>
              <Text style={styles.etaTime}>10:15</Text>
              <View style={styles.etaDivider} />
              <View>
                <Text style={styles.etaLabel}>ARRIVING IN</Text>
                <Text style={styles.etaMinutes}>12 minutes</Text>
              </View>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Today’s menu</Text>
            <Text style={styles.sectionHint}>Reserve now. Pay at the van.</Text>
          </View>
          <Text style={styles.available}>{products.reduce((sum, item) => sum + item.stock, 0)} left</Text>
        </View>

        <View style={styles.productList}>
          {products.map((product) => (
            <Pressable
              accessibilityLabel={`Choose ${product.name}, £${product.price.toFixed(2)}`}
              key={product.id}
              onPress={() => openProduct(product)}
              style={({ pressed }) => [styles.productCard, pressed && styles.cardPressed]}
            >
              <View style={styles.productImageWrap}>
                <FoodImage crop={product.crop} />
                {product.badge ? (
                  <View style={[styles.badge, product.stock <= 3 && styles.badgeUrgent]}>
                    <Text style={styles.badgeText}>{product.badge}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.productCopy}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text numberOfLines={2} style={styles.productDescription}>{product.description}</Text>
                <View style={styles.productBottom}>
                  <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
                  <View style={styles.addButton}><Text style={styles.addButtonText}>+</Text></View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.routeCard}>
          <View style={styles.routeIcon}><Text style={styles.routeIconText}>↗</Text></View>
          <View style={styles.routeCopy}>
            <Text style={styles.routeTitle}>Track the van</Text>
            <Text style={styles.routeBody}>2 stops away · Birchwood Road</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <View style={styles.tabActive}><Text style={styles.tabIcon}>⌂</Text><Text style={styles.tabActiveText}>Home</Text></View>
        <View style={styles.tab}><Text style={styles.tabIconMuted}>♡</Text><Text style={styles.tabText}>Favourites</Text></View>
        <View style={styles.tab}><Text style={styles.tabIconMuted}>◷</Text><Text style={styles.tabText}>Orders</Text></View>
      </View>

      <Modal animationType="slide" onRequestClose={closeProduct} transparent visible={selected !== null}>
        <View style={styles.modalBackdrop}>
          <Pressable accessibilityLabel="Close product" onPress={closeProduct} style={styles.modalDismissArea} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetImage}><FoodImage crop={selected.crop} /></View>
                  <View style={styles.sheetTitleWrap}>
                    <Text style={styles.sheetTitle}>{selected.name}</Text>
                    <Text style={styles.sheetPrice}>£{selected.price.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.choiceLabel}>SAUCE</Text>
                <View style={styles.sauceRow}>
                  {sauces.map((item) => (
                    <Pressable key={item} onPress={() => setSauce(item)} style={[styles.sauceChip, sauce === item && styles.sauceChipActive]}>
                      <Text style={[styles.sauceText, sauce === item && styles.sauceTextActive]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.checkoutRow}>
                  <View style={styles.stepper}>
                    <Pressable accessibilityLabel="Decrease quantity" onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable>
                    <Text style={styles.quantity}>{quantity}</Text>
                    <Pressable accessibilityLabel="Increase quantity" onPress={() => setQuantity(quantity + 1)} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable>
                  </View>
                  <Pressable onPress={reserve} style={styles.reserveButton}>
                    <Text style={styles.reserveText}>Reserve mine</Text>
                    <Text style={styles.reservePrice}>£{(selected.price * quantity).toFixed(2)}</Text>
                  </Pressable>
                </View>
                <Text style={styles.payNote}>No payment now · Your food is held for 10 minutes</Text>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  eyebrow: { color: colors.orange, fontSize: type.tiny, fontWeight: '800', letterSpacing: 1.2 },
  greeting: { color: colors.ink, fontSize: type.title, fontWeight: '800', marginTop: spacing.xs },
  avatar: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.pill, height: 46, justifyContent: 'center', width: 46 },
  avatarText: { color: colors.mustard, fontSize: type.label, fontWeight: '800' },
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
  livePill: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.paper, borderRadius: radius.pill, flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  liveDot: { backgroundColor: colors.green, borderRadius: radius.pill, height: 8, marginRight: spacing.sm, width: 8 },
  liveText: { color: colors.ink, fontSize: type.tiny, fontWeight: '900', letterSpacing: 0.8 },
  heroCopy: { zIndex: 1 },
  heroTitle: { color: colors.paper, fontSize: type.hero, fontWeight: '900', letterSpacing: -0.8 },
  etaRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm },
  etaTime: { color: colors.mustard, fontSize: 42, fontWeight: '900', letterSpacing: -1.5 },
  etaDivider: { backgroundColor: colors.paper, height: 34, marginHorizontal: spacing.md, opacity: 0.45, width: 1 },
  etaLabel: { color: colors.paper, fontSize: type.tiny, fontWeight: '700', letterSpacing: 0.8, opacity: 0.8 },
  etaMinutes: { color: colors.paper, fontSize: type.body, fontWeight: '800', marginTop: 2 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  sectionHint: { color: colors.muted, fontSize: type.label, marginTop: spacing.xs },
  available: { color: colors.green, fontSize: type.label, fontWeight: '800' },
  productList: { gap: spacing.md },
  productCard: { backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row', minHeight: 142, padding: spacing.sm, ...shadow },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  productImageWrap: { height: 126, position: 'relative', width: 126 },
  badge: { backgroundColor: colors.mustard, borderRadius: radius.pill, left: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, position: 'absolute', top: spacing.sm },
  badgeUrgent: { backgroundColor: colors.red },
  badgeText: { color: colors.paper, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  productCopy: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  productName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  productDescription: { color: colors.muted, fontSize: type.tiny, lineHeight: 18 },
  productBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  price: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  addButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.pill, height: 36, justifyContent: 'center', width: 36 },
  addButtonText: { color: colors.ink, fontSize: type.title, fontWeight: '700', lineHeight: 25 },
  routeCard: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.md, flexDirection: 'row', marginTop: spacing.xl, padding: spacing.lg },
  routeIcon: { alignItems: 'center', backgroundColor: colors.inkSoft, borderRadius: radius.sm, height: 44, justifyContent: 'center', width: 44 },
  routeIconText: { color: colors.mustard, fontSize: type.title, fontWeight: '900' },
  routeCopy: { flex: 1, marginLeft: spacing.md },
  routeTitle: { color: colors.paper, fontSize: type.body, fontWeight: '800' },
  routeBody: { color: colors.paper, fontSize: type.tiny, marginTop: spacing.xs, opacity: 0.66 },
  chevron: { color: colors.paper, fontSize: type.hero, opacity: 0.7 },
  tabBar: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, bottom: 0, flexDirection: 'row', left: 0, paddingBottom: spacing.lg, paddingTop: spacing.md, position: 'absolute', right: 0 },
  tab: { alignItems: 'center', flex: 1, gap: spacing.xs },
  tabActive: { alignItems: 'center', flex: 1, gap: spacing.xs },
  tabIcon: { color: colors.orange, fontSize: type.title, fontWeight: '900' },
  tabIconMuted: { color: colors.muted, fontSize: type.title },
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
  choiceLabel: { color: colors.muted, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.md },
  sauceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  sauceChip: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  sauceChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  sauceText: { color: colors.ink, fontSize: type.label, fontWeight: '700' },
  sauceTextActive: { color: colors.paper },
  checkoutRow: { flexDirection: 'row', gap: spacing.md },
  stepper: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row' },
  stepButton: { alignItems: 'center', height: 56, justifyContent: 'center', width: 44 },
  stepText: { color: colors.ink, fontSize: type.title, fontWeight: '800' },
  quantity: { color: colors.ink, fontSize: type.body, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  reserveButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, flex: 1, flexDirection: 'row', height: 56, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  reserveText: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  reservePrice: { color: colors.ink, fontSize: type.body, fontWeight: '800' },
  payNote: { color: colors.muted, fontSize: type.tiny, marginTop: spacing.md, textAlign: 'center' },
});
