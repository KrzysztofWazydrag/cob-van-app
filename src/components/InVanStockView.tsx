import { Pressable, StyleSheet, Text, View } from 'react-native';
import { availableStock, type Inventory, type Product } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';
import { FoodImage } from './FoodImage';

type InVanStockViewProps = {
  onlineOrderingOpen: boolean;
  inventory: Inventory;
  onChoose: (product: Product) => void;
  products: Product[];
};

export function InVanStockView({ onlineOrderingOpen, inventory, onChoose, products }: InVanStockViewProps) {
  const readyStock = products.filter(
    (product) => product.available && product.fulfilmentType === 'ready_stock' && availableStock(inventory[product.id]) > 0,
  );

  return (
    <View style={styles.content}>
      <Text style={styles.eyebrow}>READY RIGHT NOW</Text>
      <Text style={styles.title}>In the van</Text>
      <Text style={styles.intro}>{onlineOrderingOpen ? 'Prepared and ready to collect. Reserve before it goes.' : 'Remaining stock is available to buy at the van.'}</Text>
      {readyStock.length > 0 ? (
        <View style={styles.list}>
          {readyStock.map((product) => {
            const stock = inventory[product.id];
            const available = availableStock(stock);

            return (
              <View key={product.id} style={styles.card}>
                <View style={styles.image}><FoodImage image={product.image} /></View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
                  <Text style={styles.available}>{available} available</Text>
                </View>
                <Pressable
                  accessibilityLabel={`Reserve ${product.name}, ${available} available`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !onlineOrderingOpen }}
                  disabled={!onlineOrderingOpen}
                  onPress={() => { if (onlineOrderingOpen) onChoose(product); }}
                  style={({ pressed }) => [styles.reserveButton, !onlineOrderingOpen && { opacity: 0.5 }, pressed && styles.reserveButtonPressed]}
                >
                  <Text style={styles.reserveText}>{onlineOrderingOpen ? 'Reserve' : 'Online ordering closed'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing ready just now</Text>
          <Text style={styles.emptyBody}>The full menu is still available for made-to-order food.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  eyebrow: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginTop: spacing.sm },
  title: { color: colors.ink, fontSize: type.hero, fontWeight: '900', marginTop: spacing.xs },
  intro: { color: colors.muted, fontSize: type.label, lineHeight: spacing.xl, marginBottom: spacing.xl, marginTop: spacing.xs },
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
  emptyTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  emptyBody: { color: colors.muted, fontSize: type.label, lineHeight: spacing.xl, marginTop: spacing.xs, textAlign: 'center' },
});
