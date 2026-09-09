import { useMemo, useReducer, useState } from 'react';
import { AuthGate, type AuthenticatedAppProps } from './src/auth/AuthGate';
import { type CurrentProfile, useCurrentProfile } from './src/auth/useCurrentProfile';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { CustomerScreen } from './src/screens/CustomerScreen';
import { DriverScreen } from './src/screens/DriverScreen';
import type { Role } from './src/components/RoleSwitch';
import { colors } from './src/theme';
import {
  initialBuildYourOwnPricing,
  initialInventory,
  orders as initialOrders,
  products as initialProducts,
  type BuildYourOwnPricing,
  type Inventory,
  type Order,
  type Product,
  type WalkUpSaleEvent,
} from './src/data';
import { notifyVanArrived } from './src/notifications';

type StockState = {
  inventory: Inventory;
  walkUpSales: WalkUpSaleEvent[];
};

type StockAction =
  | { type: 'reserve'; productId: string; quantity: number }
  | { type: 'collect'; productId: string; quantity: number }
  | { type: 'sellWalkUp'; event: WalkUpSaleEvent }
  | { type: 'undoWalkUp'; eventId: string };

const currentWorkplace = 'Acero';

function stockReducer(state: StockState, action: StockAction): StockState {
  if (action.type === 'undoWalkUp') {
    const latestSale = state.walkUpSales[0];
    if (!latestSale || latestSale.id !== action.eventId) return state;

    const stock = state.inventory[latestSale.productId];
    if (!stock) return state;

    return {
      inventory: {
        ...state.inventory,
        [latestSale.productId]: {
          ...stock,
          physical: stock.physical + latestSale.quantity,
          walkUpBuffer: stock.walkUpBuffer + latestSale.quantity,
        },
      },
      walkUpSales: state.walkUpSales.slice(1),
    };
  }

  const productId = action.type === 'sellWalkUp' ? action.event.productId : action.productId;
  const stock = state.inventory[productId];
  if (!stock) return state;

  if (action.type === 'reserve') {
    if (stock.physical - stock.reserved - stock.walkUpBuffer < action.quantity) return state;
    return {
      ...state,
      inventory: {
        ...state.inventory,
        [productId]: { ...stock, reserved: stock.reserved + action.quantity },
      },
    };
  }

  if (action.type === 'collect') {
    return {
      ...state,
      inventory: {
        ...state.inventory,
        [productId]: {
          ...stock,
          physical: Math.max(stock.physical - action.quantity, 0),
          reserved: Math.max(stock.reserved - action.quantity, 0),
        },
      },
    };
  }

  if (stock.walkUpBuffer < action.event.quantity || stock.physical - stock.reserved < action.event.quantity) {
    return state;
  }

  return {
    inventory: {
      ...state.inventory,
      [productId]: {
        ...stock,
        physical: stock.physical - action.event.quantity,
        walkUpBuffer: stock.walkUpBuffer - action.event.quantity,
      },
    },
    walkUpSales: [action.event, ...state.walkUpSales],
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthGate>
        {(auth) => <AuthenticatedCobVanApp {...auth} />}
      </AuthGate>
    </SafeAreaProvider>
  );
}

function AuthenticatedCobVanApp({ session, signOut, signOutError, signingOut }: AuthenticatedAppProps) {
  const { error: profileError, profile } = useCurrentProfile(session.user);
  return (
    <CobVanPrototype
      onSignOut={signOut}
      profile={profile}
      profileError={profileError}
      signOutError={signOutError}
      signingOut={signingOut}
      user={session.user}
    />
  );
}

function CobVanPrototype({ onSignOut, profile, profileError, signOutError, signingOut, user }: { onSignOut: () => Promise<void>; profile: CurrentProfile; profileError: string | null; signOutError: string | null; signingOut: boolean; user: User }) {
  const [role, setRole] = useState<Role>('customer');
  const [{ inventory, walkUpSales }, dispatchStock] = useReducer(stockReducer, {
    inventory: initialInventory,
    walkUpSales: [],
  });
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [buildPricing, setBuildPricing] = useState<BuildYourOwnPricing>(initialBuildYourOwnPricing);
  const [stopMode, setStopMode] = useState(false);

  const pricedProducts = useMemo(() => products.map((product) => (
    product.custom ? { ...product, price: buildPricing.bases.Cob } : product
  )), [buildPricing.bases.Cob, products]);

  const reserveProduct = (product: Product, quantity: number, options: string) => {
    const currentProduct = pricedProducts.find((item) => item.id === product.id);
    const stock = inventory[product.id];
    if (!currentProduct?.available || !stock || stock.physical - stock.reserved - stock.walkUpBuffer < quantity) return;
    const orderedProduct = product.custom ? product : currentProduct;

    dispatchStock({ productId: product.id, quantity, type: 'reserve' });
    setOrders((current) => [
      {
        id: `local-${Date.now()}`,
        orderNumber: Math.max(...current.map((order) => order.orderNumber), 100) + 1,
        customer: profile.displayName,
        initials: profile.displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CV',
        productId: product.id,
        itemName: orderedProduct.name,
        quantity,
        options,
        total: orderedProduct.price * quantity,
        status: orderedProduct.fulfilmentType === 'ready_stock' ? 'ready' : 'reserved',
        fulfilmentType: orderedProduct.fulfilmentType,
      },
      ...current,
    ]);
  };

  const advanceOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status === 'collected') return;

    const nextStatus = order.status === 'reserved'
      ? (order.fulfilmentType === 'ready_stock' ? 'ready' : 'preparing')
      : order.status === 'preparing'
        ? 'ready'
        : 'collected';

    if (nextStatus === 'collected') {
      dispatchStock({ productId: order.productId, quantity: order.quantity, type: 'collect' });
    }

    setOrders((current) => current.map((item) => (
      item.id === orderId ? { ...item, status: nextStatus } : item
    )));
  };

  const recordWalkUpSale = (productId: string, workplace: string) => {
    const product = pricedProducts.find((item) => item.id === productId);
    const stock = inventory[productId];
    if (!product?.available || product.fulfilmentType !== 'ready_stock' || !stock || stock.walkUpBuffer <= 0 || stock.physical <= stock.reserved) return;

    const timestamp = Math.max(Date.now(), (walkUpSales[0]?.timestamp ?? 0) + 1);
    dispatchStock({
      event: {
        id: `${productId}-${timestamp}`,
        productId,
        productName: product.name,
        quantity: 1,
        timestamp,
        workplace,
      },
      type: 'sellWalkUp',
    });
  };

  const undoWalkUpSale = (eventId: string) => {
    dispatchStock({ eventId, type: 'undoWalkUp' });
  };

  const toggleStopMode = () => {
    const nextStopMode = !stopMode;
    setStopMode(nextStopMode);
    if (nextStopMode) void notifyVanArrived();
  };

  const saveProductMenuSettings = (productId: string, price: number, available: boolean) => {
    setProducts((current) => current.map((product) => (
      product.id === productId ? { ...product, available, price } : product
    )));
  };

  return (
    <View style={styles.app}>
      <StatusBar style={role === 'driver' ? 'light' : 'dark'} />
      {role === 'customer' ? (
        <CustomerScreen
          buildPricing={buildPricing}
          displayName={profile.displayName}
          inventory={inventory}
          onOpenDriverPreview={() => setRole('driver')}
          onReserve={reserveProduct}
          onSignOut={onSignOut}
          orders={orders}
          products={pricedProducts}
          profile={profile}
          profileError={profileError}
          stopMode={stopMode}
          signOutError={signOutError}
          signingOut={signingOut}
          user={user}
        />
      ) : (
        <DriverScreen
          buildPricing={buildPricing}
          currentWorkplace={currentWorkplace}
          inventory={inventory}
          onAdvanceOrder={advanceOrder}
          onRolePress={() => setRole('customer')}
          onSaveBuildPricing={setBuildPricing}
          onSaveProduct={saveProductMenuSettings}
          onToggleStopMode={toggleStopMode}
          onUndoWalkUpSale={undoWalkUpSale}
          onWalkUpSale={recordWalkUpSale}
          orders={orders}
          products={pricedProducts}
          stopMode={stopMode}
          walkUpSales={walkUpSales}
        />
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
