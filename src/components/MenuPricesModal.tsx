import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  buildBaseNames,
  buildFillingNames,
  type BuildBaseName,
  type BuildFillingName,
  type BuildYourOwnPricing,
  type Product,
} from '../data';
import { priceSchema } from '../menuPricing';
import { colors, radius, shadow, spacing, type } from '../theme';

type MenuPricesModalProps = {
  buildPricing: BuildYourOwnPricing;
  onClose: () => void;
  onSaveBuildPricing: (pricing: BuildYourOwnPricing) => void;
  onSaveProduct: (productId: string, price: number, available: boolean) => void;
  products: Product[];
  visible: boolean;
};

type PriceDraft = {
  bases: Record<BuildBaseName, string>;
  fillings: Record<BuildFillingName, string>;
};

function createPriceDraft(pricing: BuildYourOwnPricing): PriceDraft {
  const bases = {} as Record<BuildBaseName, string>;
  const fillings = {} as Record<BuildFillingName, string>;

  buildBaseNames.forEach((name) => { bases[name] = pricing.bases[name].toFixed(2); });
  buildFillingNames.forEach((name) => { fillings[name] = pricing.fillings[name].toFixed(2); });

  return { bases, fillings };
}

type PriceInputProps = {
  accessibilityLabel?: string;
  error?: string;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

function PriceInput({ accessibilityLabel, error, label, onChangeText, value }: PriceInputProps) {
  return (
    <View style={styles.priceField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        <Text style={styles.currency}>£</Text>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? `${label} price`}
          accessibilityHint={error}
          keyboardType="decimal-pad"
          maxLength={5}
          onChangeText={onChangeText}
          selectTextOnFocus
          style={styles.input}
          value={value}
        />
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type ProductPriceCardProps = {
  onSave: (productId: string, price: number, available: boolean) => void;
  product: Product;
};

function ProductPriceCard({ onSave, product }: ProductPriceCardProps) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(product.price.toFixed(2));
  const [available, setAvailable] = useState(product.available);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setPrice(product.price.toFixed(2));
    setAvailable(product.available);
    setError(undefined);
  }, [product.available, product.price]);

  const cancel = () => {
    setPrice(product.price.toFixed(2));
    setAvailable(product.available);
    setError(undefined);
    setEditing(false);
  };

  const save = () => {
    const result = priceSchema.parse(price);
    if (result.value === null) {
      setError(result.error);
      return;
    }

    onSave(product.id, result.value, available);
    setError(undefined);
    setEditing(false);
  };

  return (
    <View style={styles.productCard}>
      <View style={styles.productSummary}>
        <View style={styles.productCopy}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productPrice}>£{product.price.toFixed(2)}</Text>
            <View style={[styles.availabilityPill, !product.available && styles.availabilityPillOff]}>
              <Text style={[styles.availabilityText, !product.available && styles.availabilityTextOff]}>{product.available ? 'ON' : 'OFF'}</Text>
            </View>
          </View>
        </View>
        <Pressable accessibilityLabel={`Edit ${product.name}`} onPress={() => setEditing((current) => !current)} style={styles.editButton}>
          <Text style={styles.editText}>{editing ? 'Close' : 'Edit'}</Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.editor}>
          <PriceInput accessibilityLabel={`${product.name} price`} error={error} label="Price" onChangeText={(value) => { setPrice(value); setError(undefined); }} value={price} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={styles.fieldLabel}>Available</Text>
              <Text style={styles.fieldHint}>Shown for new customer orders</Text>
            </View>
            <Switch
              accessibilityLabel={`${product.name} available`}
              onValueChange={setAvailable}
              trackColor={{ false: colors.line, true: colors.greenSoft }}
              thumbColor={available ? colors.green : colors.muted}
              value={available}
            />
          </View>
          <View style={styles.editorActions}>
            <Pressable accessibilityLabel={`Cancel editing ${product.name}`} onPress={cancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
            <Pressable accessibilityLabel={`Save ${product.name}`} onPress={save} style={styles.saveButton}><Text style={styles.saveText}>Save</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type BuildPricingEditorProps = {
  onSave: (pricing: BuildYourOwnPricing) => void;
  pricing: BuildYourOwnPricing;
};

function BuildPricingEditor({ onSave, pricing }: BuildPricingEditorProps) {
  const [draft, setDraft] = useState<PriceDraft>(() => createPriceDraft(pricing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(createPriceDraft(pricing));
  }, [pricing]);

  const updateDraft = (section: keyof PriceDraft, name: BuildBaseName | BuildFillingName, value: string) => {
    setDraft((current) => ({ ...current, [section]: { ...current[section], [name]: value } }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`${section}.${name}`];
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    const nextErrors: Record<string, string> = {};
    const bases = {} as BuildYourOwnPricing['bases'];
    const fillings = {} as BuildYourOwnPricing['fillings'];

    buildBaseNames.forEach((name) => {
      const result = priceSchema.parse(draft.bases[name]);
      if (result.value === null) nextErrors[`bases.${name}`] = result.error;
      else bases[name] = result.value;
    });
    buildFillingNames.forEach((name) => {
      const result = priceSchema.parse(draft.fillings[name]);
      if (result.value === null) nextErrors[`fillings.${name}`] = result.error;
      else fillings[name] = result.value;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSaved(false);
      return;
    }

    onSave({ bases, fillings });
    setSaved(true);
  };

  return (
    <View style={styles.buildCard}>
      <Text style={styles.groupLabel}>BASE PRICES</Text>
      {buildBaseNames.map((name) => (
        <PriceInput
          error={errors[`bases.${name}`]}
          key={name}
          label={name}
          onChangeText={(value) => updateDraft('bases', name, value)}
          value={draft.bases[name]}
        />
      ))}

      <Text style={styles.groupLabel}>FILLING PRICES</Text>
      {buildFillingNames.map((name) => (
        <PriceInput
          error={errors[`fillings.${name}`]}
          key={name}
          label={name}
          onChangeText={(value) => updateDraft('fillings', name, value)}
          value={draft.fillings[name]}
        />
      ))}

      {saved ? <Text accessibilityLiveRegion="polite" style={styles.savedText}>Prices saved</Text> : null}
      <Pressable onPress={save} style={styles.buildSaveButton}><Text style={styles.buildSaveText}>Save Build Your Own prices</Text></Pressable>
    </View>
  );
}

export function MenuPricesModal({ buildPricing, onClose, onSaveBuildPricing, onSaveProduct, products, visible }: MenuPricesModalProps) {
  const presetProducts = products.filter((product) => !product.custom);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>OWNER TOOLS</Text>
            <Text style={styles.title}>Menu & prices</Text>
          </View>
          <Pressable accessibilityLabel="Close menu and prices" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Update today’s menu. Changes apply immediately to new customer orders.</Text>

          <Text style={styles.sectionLabel}>PRESET MENU</Text>
          <Text style={styles.sectionHint}>Tap Edit to change one item.</Text>
          <View style={styles.productList}>
            {presetProducts.map((product) => <ProductPriceCard key={product.id} onSave={onSaveProduct} product={product} />)}
          </View>

          <Text style={styles.sectionLabel}>BUILD YOUR OWN</Text>
          <Text style={styles.sectionHint}>These values feed the customer’s live total.</Text>
          <BuildPricingEditor onSave={onSaveBuildPricing} pricing={buildPricing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.cream, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.ink, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  eyebrow: { color: colors.mustard, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.paper, fontSize: type.title, fontWeight: '900', marginTop: spacing.xs },
  closeButton: { alignItems: 'center', backgroundColor: colors.inkSoft, borderRadius: radius.pill, height: spacing.xxxl + spacing.sm, justifyContent: 'center', width: spacing.xxxl + spacing.sm },
  closeText: { color: colors.paper, fontSize: type.hero, lineHeight: spacing.xxxl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { color: colors.muted, fontSize: type.label, lineHeight: spacing.xl, marginBottom: spacing.xl },
  sectionLabel: { color: colors.orange, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginTop: spacing.md },
  sectionHint: { color: colors.muted, fontSize: type.tiny, marginBottom: spacing.md, marginTop: spacing.xs },
  productList: { gap: spacing.md, marginBottom: spacing.xl },
  productCard: { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.md, ...shadow },
  productSummary: { alignItems: 'center', flexDirection: 'row' },
  productCopy: { flex: 1, paddingRight: spacing.md },
  productName: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  productMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  productPrice: { color: colors.ink, fontSize: type.label, fontWeight: '800' },
  availabilityPill: { backgroundColor: colors.greenSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  availabilityPillOff: { backgroundColor: colors.line },
  availabilityText: { color: colors.green, fontSize: type.tiny, fontWeight: '900' },
  availabilityTextOff: { color: colors.muted },
  editButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.sm, justifyContent: 'center', minHeight: spacing.xxxl + spacing.sm, minWidth: spacing.xxxl * 2, paddingHorizontal: spacing.md },
  editText: { color: colors.ink, fontSize: type.label, fontWeight: '900' },
  editor: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: spacing.md, paddingTop: spacing.md },
  priceField: { marginBottom: spacing.md },
  fieldLabel: { color: colors.ink, fontSize: type.label, fontWeight: '900', marginBottom: spacing.xs },
  fieldHint: { color: colors.muted, fontSize: type.tiny },
  inputWrap: { alignItems: 'center', backgroundColor: colors.mist, borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flexDirection: 'row', minHeight: spacing.xxxl + spacing.md, paddingHorizontal: spacing.md },
  inputWrapError: { borderColor: colors.red },
  currency: { color: colors.ink, fontSize: type.body, fontWeight: '900' },
  input: { color: colors.ink, flex: 1, fontSize: type.body, fontWeight: '800', minHeight: spacing.xxxl + spacing.md, paddingHorizontal: spacing.sm },
  errorText: { color: colors.red, fontSize: type.tiny, marginTop: spacing.xs },
  toggleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  toggleCopy: { flex: 1, paddingRight: spacing.md },
  editorActions: { flexDirection: 'row', gap: spacing.sm },
  cancelButton: { alignItems: 'center', borderColor: colors.line, borderRadius: radius.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: spacing.xxxl + spacing.md },
  cancelText: { color: colors.muted, fontSize: type.label, fontWeight: '900' },
  saveButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.sm, flex: 1, justifyContent: 'center', minHeight: spacing.xxxl + spacing.md },
  saveText: { color: colors.paper, fontSize: type.label, fontWeight: '900' },
  buildCard: { backgroundColor: colors.paper, borderRadius: radius.md, padding: spacing.md, ...shadow },
  groupLabel: { color: colors.green, fontSize: type.tiny, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.sm },
  savedText: { color: colors.green, fontSize: type.label, fontWeight: '900', marginBottom: spacing.md, textAlign: 'center' },
  buildSaveButton: { alignItems: 'center', backgroundColor: colors.mustard, borderRadius: radius.md, justifyContent: 'center', minHeight: spacing.xxxl + spacing.xl, paddingHorizontal: spacing.lg },
  buildSaveText: { color: colors.ink, fontSize: type.label, fontWeight: '900', textAlign: 'center' },
});
