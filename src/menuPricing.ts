export type PriceValidation =
  | { error: null; value: number }
  | { error: string; value: null };

export const priceSchema = {
  parse(rawValue: string): PriceValidation {
    const normalized = rawValue.trim().replace(',', '.');
    const value = Number(normalized);

    if (!normalized || !Number.isFinite(value)) {
      return { error: 'Enter a valid price.', value: null };
    }

    if (value <= 0 || value > 99.99) {
      return { error: 'Use a price between £0.01 and £99.99.', value: null };
    }

    if (!/^\d+(?:[.,]\d{1,2})?$/.test(rawValue.trim())) {
      return { error: 'Use no more than 2 decimal places.', value: null };
    }

    return { error: null, value: Math.round(value * 100) / 100 };
  },
};
