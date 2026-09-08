import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Product } from '../data';
import { colors, radius, shadow, spacing, type } from '../theme';

type BaseOption = {
  name: 'Cob' | 'Baguette' | 'Wrap';
  price: number;
};

type FillingOption = {
  name: 'Bacon' | 'Sausage' | 'Fried egg' | 'Hash brown' | 'Cheese' | 'Mushrooms';
  price: number;
};

type BuildYourOwnModalProps = {
  available: number;
  onClose: () => void;
  onReserve: (product: Product, quantity: number, options: string) => void;
  visible: boolean;
};

const bases: BaseOption[] = [
  { name: 'Cob', price: 2.5 },
  { name: 'Baguette', price: 3 },
  { name: 'Wrap', price: 2.75 },
];

const fillings: FillingOption[] = [
  { name: 'Bacon', price: 1.25 },
  { name: 'Sausage', price: 1.25 },
  { name: 'Fried egg', price: 0.95 },
  { name: 'Hash brown', price: 0.75 },
  { name: 'Cheese', price: 0.8 },
  { name: 'Mushrooms', price: 0.65 },
];

const sauces = ['Brown sauce', 'Red sauce', 'No sauce'] as const;

export function BuildYourOwnModal({ available, onClose, onReserve, visible }: BuildYourOwnModalProps) {
  const [base, setBase] = useState<BaseOption>(bases[0]);
  const [selectedFillings, setSelectedFillings] = useState<FillingOption[]>([]);
  const [sauce, setSauce] = useState<(typeof sauces)[number]>(sauces[0]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!visible) return;
    setBase(bases[0]);
    setSelectedFillings([]);
    setSauce(sauces[0]);
    setQuantity(1);
  }, [visible]);

  const unitPrice = base.price + selectedFillings.reduce((sum, filling) => sum + filling.price, 0);
  const canReserve = available > 0 && selectedFillings.length > 0;

  const toggleFilling = (filling: FillingOption) => {
    setSelectedFillings((current) => current.some((item) => item.name === filling.name)
      ? current.filter((item) => item.name !== filling.name)
      : [...current, filling]);
  };

  const reserve = () => {
    if (!canReserve) return;

    onReserve(
      {
        id: 'build-your-own',
        name: `Build your own ${base.name.toLowerCase()}`,
        description: 'Custom breakfast sandwich',
        price: unitPrice,
        category: 'cobs',
        image: 'build-your-own',
        custom: true,
        fulfilmentType: 'made_to_order',
      },
      quantity,
      `Base: ${base.name}\nFillings: ${selectedFillings.map((item) => item.name).join(', ')}\nSauce: ${sauce}`,
    );
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MADE YOUR WAY</Text>
            <Text style={styles.title}>Build your own</Text>
          </View>
          <Pressable accessibilityLabel="Close custom order" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepLabel}>1 · CHOOSE BASE</Text>
          <View style={styles.optionRow}>
            {bases.map((item) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: base.name === item.name }}
                key={item.name}
                onPress={() => setBase(item)}
                style={[styles.baseChip, base.name === item.name && styles.optionActive]}
              >
                <Text style={[styles.optionName, base.name === item.name && styles.optionTextActive]}>{item.name}</Text>
                <Text style={[styles.optionPrice, base.name === item.name && styles.optionTextActive]}>£{item.price.toFixed(2)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.stepLabel}>2 · CHOOSE FILLINGS</Text>
          <View style={styles.fillingGrid}>
            {fillings.map((item) => {
              const active = selectedFillings.some((selected) => selected.name === item.name);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  key={item.name}
                  onPress={() => toggleFilling(item)}
                  style={[styles.fillingChip, active && styles.optionActive]}
                >
                  <Text style={[styles.optionName, active && styles.optionTextActive]}>{active ? '✓  ' : ''}{item.name}</Text>
                  <Text style={[styles.optionPrice, active && styles.optionTextActive]}>+£{item.price.toFixed(2)}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.stepLabel}>3 · CHOOSE SAUCE</Text>
          <View style={styles.optionRow}>
            {sauces.map((item) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: sauce === item }}
                key={item}
                onPress={() => setSauce(item)}
                style={[styles.sauceChip, sauce === item && styles.optionActive]}
              >
                <Text style={[styles.sauceText, sauce === item && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeading}>
              <View>
                <Text style={styles.summaryLabel}>YOUR ORDER</Text>
                <Text style={styles.summaryTitle}>Build your own {base.name.toLowerCase()}</Text>
              </View>
              <Text style={styles.summaryPrice}>£{unitPrice.toFixed(2)}</Text>
            </View>
            <Text style={styles.summaryLine}>Base: {base.name}</Text>
            <Text style={styles.summaryLine}>
              Fillings: {selectedFillings.length > 0 ? selectedFillings.map((item) => item.name).join(', ') : 'Choose at least one'}
            </Text>
            <Text style={styles.summaryLine}>Sauce: {sauce}</Text>
          </View>
        </ScrollView>

        <View style={styles.checkout}>
          <View style={styles.stepper}>
            <Pressable accessibilityLabel="Decrease quantity" onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.stepButton}>
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable
              accessibilityLabel="Increase quantity"
              accessibilityState={{ disabled: quantity >= available }}
              disabled={quantity >= available}
              onPress={() => setQuantity(Math.min(available, quantity + 1))}
              style={[styles.stepButton, quantity >= available && styles.disabled]}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityState={{ disabled: !canReserve }}
            disabled={!canReserve}
            onPress={reserve}
            style={[styles.reserveButton, !canReserve && styles.reserveButtonDisabled]}
          >
            <Text style={styles.reserveText}>{available === 0 ? 'Sold out' : selectedFillings.length === 0 ? 'Choose a filling' : 'Reserve mine'}</Text>
            <Text style={styles.reservePrice}>£{(unitPrice * quantity).toFixed(2)}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.paper, fontSize: type.title, fontWeight: '900', marginTop: spacing.xs },
  closeButton: { alignItems: 'center', backgroundColor: colors.inkSoft, borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  closeText: { color: colors.paper, fontSize: type.hero, lineHeight: 36 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  stepLabel: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.md },
  optionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  baseChip: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flex: 1, minHeight: 68, justifyContent: 'center' },
  optionActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  optionName: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  optionPrice: { color: colors.muted, fontSize: type.tiny, fontWeight: '700', marginTop: spacing.xs },
  optionTextActive: { color: colors.paper },
  fillingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  fillingChip: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, justifyContent: 'center', minHeight: 62, paddingHorizontal: spacing.md, width: '48.5%' },
  sauceChip: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.sm },
  sauceText: { color: colors.ink, fontSize: type.tiny, fontWeight: '800', textAlign: 'center' },
  summaryCard: { backgroundColor: colors.paper, borderRadius: radius.md, marginTop: spacing.sm, padding: spacing.lg, ...shadow },
  summaryHeading: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  summaryLabel: { color: colors.green, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  summaryTitle: { color: colors.ink, fontSize: type.body, fontWeight: '900', marginTop: spacing.xs },
  summaryPrice: { color: colors.orange, fontSize: type.title, fontWeight: '900' },
  summaryLine: { color: colors.muted, fontSize: type.label, lineHeight: 21, marginTop: spacing.xs },
  checkout: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  stepper: { alignItems: 'center', backgroundColor: colors.mist, borderRadius: radius.md, flexDirection: 'row' },
  stepButton: { alignItems: 'center', height: 58, justifyContent: 'center', width: 42 },
  stepText: { color: colors.ink, fontSize: type.title, fontWeight: '900' },
  quantity: { color: colors.ink, fontSize: type.body, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  reserveButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, flex: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: spacing.lg },
  reserveButtonDisabled: { backgroundColor: colors.line },
  reserveText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  reservePrice: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  disabled: { opacity: 0.3 },
});
