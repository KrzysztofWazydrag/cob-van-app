import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme';

export type Role = 'customer' | 'driver';

type RoleSwitchProps = {
  role: Role;
  onChange: (role: Role) => void;
};

export function RoleSwitch({ role, onChange }: RoleSwitchProps) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {(['customer', 'driver'] as const).map((item) => {
        const active = role === item;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={item}
            onPress={() => onChange(item)}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {item === 'customer' ? 'Customer' : 'Van crew'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.inkSoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  optionActive: { backgroundColor: colors.paper },
  label: { color: colors.cream, fontSize: type.label, fontWeight: '700' },
  labelActive: { color: colors.ink },
});
