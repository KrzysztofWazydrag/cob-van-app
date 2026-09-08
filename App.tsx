import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CustomerScreen } from './src/screens/CustomerScreen';
import { DriverScreen } from './src/screens/DriverScreen';
import type { Role } from './src/components/RoleSwitch';
import { colors } from './src/theme';
import { initialInventory, orders as initialOrders, type Inventory, type Order, type Product } from './src/data';
import { notifyVanArrived } from './src/notifications';

export default function App() {
  const [role, setRole] = useState<Role>('customer');
  const [inventory, setInventory] = useState<Inventory>(initialInventory);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [stopMode, setStopMode] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(['bacon-egg', 'breakfast-wrap']);

  const toggleFavourite = (productId: string) => {
    setFavouriteIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  };

  const reserveProduct = (product: Product, quantity: number, options: string) => {
    const stock = inventory[product.id];
    if (!stock || stock.physical - stock.reserved - stock.walkUpBuffer < quantity) return;

    setInventory((current) => ({
      ...current,
      [product.id]: { ...current[product.id], reserved: current[product.id].reserved + quantity },
    }));
    setOrders((current) => [
      {
        id: `local-${Date.now()}`,
        orderNumber: Math.max(...current.map((order) => order.orderNumber), 100) + 1,
        customer: 'Jamie P.',
        initials: 'JP',
        productId: product.id,
        itemName: product.name,
        quantity,
        options,
        total: product.price * quantity,
        status: 'reserved',
      },
      ...current,
    ]);
  };

  const advanceOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status === 'collected') return;

    const nextStatus = order.status === 'reserved'
      ? 'preparing'
      : order.status === 'preparing'
        ? 'ready'
        : 'collected';

    if (nextStatus === 'collected') {
      setInventory((current) => {
        const stock = current[order.productId];
        if (!stock) return current;
        return {
          ...current,
          [order.productId]: {
            ...stock,
            physical: Math.max(stock.physical - order.quantity, 0),
            reserved: Math.max(stock.reserved - order.quantity, 0),
          },
        };
      });
    }

    setOrders((current) => current.map((item) => (
      item.id === orderId ? { ...item, status: nextStatus } : item
    )));
  };

  const recordWalkUpSale = (productId: string) => {
    setInventory((current) => {
      const stock = current[productId];
      if (!stock || stock.physical <= stock.reserved) return current;

      return {
        ...current,
        [productId]: {
          ...stock,
          physical: stock.physical - 1,
          walkUpBuffer: Math.max(stock.walkUpBuffer - 1, 0),
        },
      };
    });
  };

  const toggleStopMode = () => {
    const nextStopMode = !stopMode;
    setStopMode(nextStopMode);
    if (nextStopMode) void notifyVanArrived();
  };

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style={role === 'driver' ? 'light' : 'dark'} />
        {role === 'customer' ? (
          <CustomerScreen
            favouriteIds={favouriteIds}
            inventory={inventory}
            onReserve={reserveProduct}
            onRolePress={() => setRole('driver')}
            onToggleFavourite={toggleFavourite}
            orders={orders}
            stopMode={stopMode}
          />
        ) : (
          <DriverScreen
            inventory={inventory}
            onAdvanceOrder={advanceOrder}
            onRolePress={() => setRole('customer')}
            onToggleStopMode={toggleStopMode}
            onWalkUpSale={recordWalkUpSale}
            orders={orders}
            stopMode={stopMode}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});
