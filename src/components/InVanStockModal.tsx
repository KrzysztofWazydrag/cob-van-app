import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reservableCount, type Inventory, type Product } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';
import { FoodImage } from './FoodImage';

type InVanStockModalProps = {
  inventory: Inventory;
  onChoose: (product: Product) => void;
  onClose: () => void;
  products: Product[];
  visible: boolean;
};

export function InVanStockModal({ inventory, onChoose, onClose, products, visible }: InVanStockModalProps) {
  const readyStock = products.filter(
    (product) => product.available && product.fulfilmentType === 'ready_stock' && reservableCount(inventory[product.id]) > 0,
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>READY RIGHT NOW</Text>
            <Text style={styles.title}>In the van</Text>
          </View>
          <Pressable accessibilityLabel="Close in the van stock" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Prepared and ready to collect. Reserve before it goes.</Text>
          {readyStock.length > 0 ? (
            <View style={styles.list}>
              {readyStock.map((product) => {
                const stock = inventory[product.id];
                const available = reservableCount(stock);
                const inVanAvailable = Math.max(stock.physical - stock.reserved, 0);

                return (
                  <View key={product.id} style={styles.card}>
                    <View style={styles.image}><FoodImage image={product.image} /></View>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemName}>{product.name}</Text>
                      <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
                      <Text style={styles.available}>{inVanAvailable} in van · {available} to reserve</Text>
                    </View>
                    <Pressable
                      accessibilityLabel={`Reserve ${product.name}, ${available} available`}
                      accessibilityRole="button"
                      onPress={() => onChoose(product)}
                      style={({ pressed }) => [styles.reserveButton, pressed && styles.reserveButtonPressed]}
                    >
                      <Text style={styles.reserveText}>Reserve</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚐</Text>
              <Text style={styles.emptyTitle}>Nothing ready just now</Text>
              <Text style={styles.emptyBody}>The full menu is still available for made-to-order food.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.paper, fontSize: type.title, fontWeight: '900', marginTop: spacing.xs },
  closeButton: { alignItems: 'center', backgroundColor: colors.inkSoft, borderRadius: radius.pill, height: spacing.xxxl + spacing.sm, justifyContent: 'center', width: spacing.xxxl + spacing.sm },
  closeText: { color: colors.paper, fontSize: type.hero, lineHeight: spacing.xxxl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { color: colors.muted, fontSize: type.label, lineHeight: spacing.xl, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  card: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, flexDirection: 'row', padding: spacing.sm, ...shadow },
  image: { height: spacing.xxxl * 2, width: spacing.xxxl * 2 },
  itemCopy: { flex: 1, marginHorizontal: spacing.md },
  itemName: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  price: { color: colors.ink, fontSize: type.label, fontWeight: '800', marginTop: spacing.xs },
  available: { color: colors.green, fontSize: type.tiny, fontWeight: '800', marginTop: spacing.xs },
  reserveButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.sm, justifyContent: 'center', minHeight: spacing.xxxl + spacing.md, paddingHorizontal: spacing.md },
  reserveButtonPressed: { opacity: 0.8 },
  reserveText: { color: colors.ink, fontSize: type.tiny, fontWeight: '900' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, padding: spacing.xxl, ...shadow },
  emptyIcon: { fontSize: type.hero },
  emptyTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900', marginTop: spacing.md },
  emptyBody: { color: colors.muted, fontSize: type.label, lineHeight: spacing.xl, marginTop: spacing.xs, textAlign: 'center' },
});
