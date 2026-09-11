import { canOrderOnline, initialOrderCutoffAt } from './src/onlineOrdering';
import { useMemo, useRef, useState } from 'react';
import { AuthGate, type AuthenticatedAppProps } from './src/auth/AuthGate';
import { type CurrentProfile, useCurrentProfile } from './src/auth/useCurrentProfile';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { User } from '@supabase/supabase-js';
import { WorkplaceOnboardingScreen } from './src/screens/WorkplaceOnboardingScreen';
import { CustomerScreen } from './src/screens/CustomerScreen';
import { DriverScreen } from './src/screens/DriverScreen';
import type { Role } from './src/components/RoleSwitch';
import { colors } from './src/theme';
import {
  initialBuildYourOwnPricing,
  initialInventory,
  availableStock,
  orders as initialOrders,
  products as initialProducts,
  type BuildYourOwnPricing,
  type Inventory,
  type Order,
  type Product,
  type WalkUpSaleEvent,
} from './src/data';
import { notifyVanArrived } from './src/notifications';

type LocalOrderState = {
  orderCutoffAt: number;
  orders: Order[];
  nextOrderId: number;
  inventory: Inventory;
  walkUpSales: WalkUpSaleEvent[];
};

type LocalOrderAction =
  | { type: 'reserve'; attemptedAt: number; order: Omit<Order, 'id' | 'orderNumber'> }
  | { type: 'advance'; orderId: string; expectedStatus: Order['status'] }
  | { type: 'sellWalkUp'; event: WalkUpSaleEvent }
  | { type: 'undoWalkUp'; eventId: string };

const currentWorkplace = 'Acero';

function localOrderReducer(state: LocalOrderState, action: LocalOrderAction): LocalOrderState {
  if (action.type === 'reserve') {
    if (!canOrderOnline(state.orderCutoffAt, action.attemptedAt)) return state;
    const { productId, quantity } = action.order;
    const stock = state.inventory[productId];
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || !stock
      || availableStock(stock) < quantity) return state;

    const order: Order = {
      ...action.order,
      id: `local-${state.nextOrderId}`,
      orderNumber: Math.max(...state.orders.map((item) => item.orderNumber), 100) + 1,
    };
    return {
      ...state,
      nextOrderId: state.nextOrderId + 1,
      orders: [order, ...state.orders],
      inventory: {
        ...state.inventory,
        [productId]: { ...stock, reserved: stock.reserved + quantity },
      },
    };
  }

  if (action.type === 'advance') {
    const order = state.orders.find((item) => item.id === action.orderId);
    if (!order || order.status !== action.expectedStatus) return state;

    let nextStatus: Order['status'];
    switch (order.status) {
      case 'reserved':
        nextStatus = order.fulfilmentType === 'ready_stock' ? 'ready' : 'preparing';
        break;
      case 'preparing':
        nextStatus = 'ready';
        break;
      case 'ready':
        nextStatus = 'collected';
        break;
      default:
        return state;
    }

    let inventory = state.inventory;
    if (nextStatus === 'collected') {
      const stock = inventory[order.productId];
      if (!stock || !Number.isSafeInteger(order.quantity) || order.quantity <= 0
        || stock.physical < order.quantity || stock.reserved < order.quantity) return state;
      inventory = {
        ...inventory,
        [order.productId]: {
          ...stock,
          physical: stock.physical - order.quantity,
          reserved: stock.reserved - order.quantity,
        },
      };
    }
    return {
      ...state,
      inventory,
      orders: state.orders.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item),
    };
  }

  if (action.type === 'undoWalkUp') {
    const latestSale = state.walkUpSales[0];
    if (!latestSale || latestSale.id !== action.eventId) return state;

    const stock = state.inventory[latestSale.productId];
    if (!stock) return state;

    return {
      ...state,
      inventory: {
        ...state.inventory,
        [latestSale.productId]: {
          ...stock,
          physical: stock.physical + latestSale.quantity,
        },
      },
      walkUpSales: state.walkUpSales.slice(1),
    };
  }

  const productId = action.event.productId;
  const stock = state.inventory[productId];
  if (!stock) return state;

  if (!Number.isSafeInteger(action.event.quantity) || action.event.quantity <= 0 || availableStock(stock) < action.event.quantity) {
    return state;
  }

  return {
    ...state,
    inventory: {
      ...state.inventory,
      [productId]: {
        ...stock,
        physical: stock.physical - action.event.quantity,
      },
    },
    walkUpSales: [action.event, ...state.walkUpSales],
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthGate>
        {(auth) => <AuthenticatedCobVanApp key={auth.session.user.id} {...auth} />}
      </AuthGate>
    </SafeAreaProvider>
  );
}

function AuthenticatedCobVanApp({ session, signOut, signOutError, signingOut }: AuthenticatedAppProps) {
  const { error: profileError, profile, loading, reload } = useCurrentProfile(session.user);
  const roleError = !loading && !['customer', 'owner', 'driver'].includes(profile.role)
    ? 'Your account role is not supported. Please contact support.'
    : null;
  const entryError = profileError || roleError;
  if (loading || entryError) {
    return (
      <SafeAreaView style={styles.profileStatus}>
        <StatusBar style="dark" />
        {loading ? <ActivityIndicator color={colors.ink} /> : null}
        <Text accessibilityRole={entryError ? 'alert' : undefined}>{entryError || 'Loading your profile…'}</Text>
        {entryError ? <Pressable accessibilityRole="button" onPress={reload} style={styles.retry}><Text>Try again</Text></Pressable> : null}
        {signOutError ? <Text accessibilityRole="alert">{signOutError}</Text> : null}
        <Pressable accessibilityRole="button" disabled={signingOut} onPress={signOut} style={styles.retry}><Text>{signingOut ? 'Logging out…' : 'Log out'}</Text></Pressable>
      </SafeAreaView>
    );
  }
  if (profile.role === 'customer' && !profile.workplaceId) {
    return <WorkplaceOnboardingScreen onJoined={reload} onSignOut={signOut} signingOut={signingOut} signOutError={signOutError} />;
  }
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
  const [devPreviewRole, setDevPreviewRole] = useState<Role | null>(null);
  const role = __DEV__ && devPreviewRole !== null
    ? devPreviewRole
    : profile.role === 'owner' || profile.role === 'driver' ? 'driver' : 'customer';
  const [localOrderState, setLocalOrderState] = useState<LocalOrderState>(() => ({
    orderCutoffAt: initialOrderCutoffAt(),
    orders: initialOrders,
    nextOrderId: 1,
    inventory: initialInventory,
    walkUpSales: [],
  }));
  const localOrderStateRef = useRef(localOrderState);
  const { orders, inventory, walkUpSales, orderCutoffAt } = localOrderState;

  const dispatchLocalOrder = (action: LocalOrderAction): boolean => {
    // Advance before React renders so batched callers observe each other's accepted transitions.
    const current = localOrderStateRef.current;
    const next = localOrderReducer(current, action);
    if (next === current) return false;
    localOrderStateRef.current = next;
    setLocalOrderState(next);
    return true;
  };
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [buildPricing, setBuildPricing] = useState<BuildYourOwnPricing>(initialBuildYourOwnPricing);
  const [stopMode, setStopMode] = useState(false);

  const pricedProducts = useMemo(() => products.map((product) => (
    product.custom ? { ...product, price: buildPricing.bases.Cob } : product
  )), [buildPricing.bases.Cob, products]);

  const reserveProduct = (product: Product, quantity: number, options: string) => {
    const attemptedAt = Date.now();
    if (!canOrderOnline(orderCutoffAt, attemptedAt)) return false;
    const currentProduct = pricedProducts.find((item) => item.id === product.id);
    if (!currentProduct?.available) return false;
    const orderedProduct = product.custom ? product : currentProduct;

    return dispatchLocalOrder({
      type: 'reserve',
      attemptedAt,
      order: {
        customerId: user.id,
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
    });
  };

  const advanceOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status === 'collected') return;

    dispatchLocalOrder({ type: 'advance', orderId, expectedStatus: order.status });
  };

  const recordWalkUpSale = (productId: string, workplace: string) => {
    const product = pricedProducts.find((item) => item.id === productId);
    const stock = inventory[productId];
    if (!product?.available || product.fulfilmentType !== 'ready_stock' || !stock || availableStock(stock) <= 0) return;

    const timestamp = Math.max(Date.now(), (walkUpSales[0]?.timestamp ?? 0) + 1);
    dispatchLocalOrder({
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
    dispatchLocalOrder({ eventId, type: 'undoWalkUp' });
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
          orderCutoffAt={orderCutoffAt}
          displayName={profile.displayName}
          inventory={inventory}
          onOpenDriverPreview={() => { if (__DEV__) setDevPreviewRole('driver'); }}
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
          onRolePress={() => { if (__DEV__) setDevPreviewRole('customer'); }}
          onSignOut={onSignOut}
          signOutError={signOutError}
          signingOut={signingOut}
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
  profileStatus: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  retry: { padding: 16, backgroundColor: colors.mustard, borderRadius: 24 },
  app: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});
