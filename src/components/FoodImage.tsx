import { Image, type ImageStyle, StyleSheet } from 'react-native';
import { radius } from '../theme';
import type { Product } from '../data';

type FoodImageProps = {
  crop: Product['crop'];
  style?: ImageStyle;
};

export function FoodImage({ crop, style }: FoodImageProps) {
  return (
    <Image
      accessibilityLabel={`${crop} cob product photo`}
      source={require('../../assets/cob-selection.png')}
      resizeMode="cover"
      style={[styles.image, style]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
});
