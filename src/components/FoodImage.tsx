import { Image, type ImageStyle, StyleSheet } from 'react-native';
import { radius } from '../theme';
import type { Product } from '../data';

type FoodImageProps = {
  image: Product['image'];
  style?: ImageStyle;
};

const sources = {
  'build-your-own': require('../../assets/build-your-own.png'),
  'bacon-egg-cob': require('../../assets/bacon-egg-cob.png'),
  'sausage-egg-cob': require('../../assets/sausage-egg-cob.png'),
  'bacon-cheese-tomato-baguette': require('../../assets/bacon-cheese-tomato-baguette.png'),
  'egg-mayo-cob': require('../../assets/egg-mayo-cob.png'),
  'breakfast-wrap': require('../../assets/breakfast-wrap.png'),
  'veggie-breakfast-wrap': require('../../assets/veggie-breakfast-wrap.png'),
  'small-english-breakfast': require('../../assets/small-english-breakfast.png'),
  'full-english-breakfast': require('../../assets/full-english-box.png'),
};

export function FoodImage({ image, style }: FoodImageProps) {
  return (
    <Image
      accessibilityLabel={`${image} product photo`}
      source={sources[image]}
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
