import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { CustomerScreen } from './src/screens/CustomerScreen';
import { DriverScreen } from './src/screens/DriverScreen';
import type { Role } from './src/components/RoleSwitch';
import { colors } from './src/theme';

export default function App() {
  const [role, setRole] = useState<Role>('customer');

  return (
    <View style={styles.app}>
      <StatusBar style={role === 'driver' ? 'light' : 'dark'} />
      {role === 'customer' ? (
        <CustomerScreen onRolePress={() => setRole('driver')} />
      ) : (
        <DriverScreen onRolePress={() => setRole('customer')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});
