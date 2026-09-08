export type ProductImage =
  | 'build-your-own'
  | 'bacon-egg-cob'
  | 'sausage-egg-cob'
  | 'bacon-cheese-tomato-baguette'
  | 'coronation-chicken-sandwich'
  | 'ham-cheese-toastie'
  | 'tuna-mayo-cob'
  | 'egg-mayo-cob'
  | 'breakfast-wrap'
  | 'veggie-breakfast-wrap'
  | 'small-english-breakfast'
  | 'full-english-breakfast';

export type Product = {
  available: boolean;
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
  category: 'cobs' | 'wraps' | 'breakfast';
  image: ProductImage;
  custom?: boolean;
  fulfilmentType: FulfilmentType;
};

export const buildBaseNames = ['Cob', 'Baguette', 'Wrap'] as const;
export const buildFillingNames = [
  'Bacon',
  'Sausage',
  'Fried egg',
  'Hash brown',
  'Cheese',
  'Mushrooms',
  'Tomato',
  'Sweetcorn',
  'Cucumber',
  'Egg mayo',
] as const;

export type BuildBaseName = (typeof buildBaseNames)[number];
export type BuildFillingName = (typeof buildFillingNames)[number];

export type BuildYourOwnPricing = {
  bases: Record<BuildBaseName, number>;
  fillings: Record<BuildFillingName, number>;
};

export const initialBuildYourOwnPricing: BuildYourOwnPricing = {
  bases: { Baguette: 3, Cob: 2.5, Wrap: 2.75 },
  fillings: {
    Bacon: 1.25,
    Cheese: 0.8,
    Cucumber: 0.5,
    'Egg mayo': 0.75,
    'Fried egg': 0.95,
    'Hash brown': 0.75,
    Mushrooms: 0.65,
    Sausage: 1.25,
    Sweetcorn: 0.5,
    Tomato: 0.5,
  },
};

export type FulfilmentType = 'ready_stock' | 'made_to_order';

export type OrderStatus = 'reserved' | 'preparing' | 'ready' | 'collected';

export type Order = {
  id: string;
  orderNumber: number;
  customer: string;
  initials: string;
  productId: string;
  itemName: string;
  quantity: number;
  options: string;
  total: number;
  status: OrderStatus;
  fulfilmentType: FulfilmentType;
};

export type StockLevel = {
  physical: number;
  reserved: number;
  walkUpBuffer: number;
};

export type Inventory = Record<string, StockLevel>;

export type WalkUpSaleEvent = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  workplace: string;
  timestamp: number;
};

export const initialInventory: Inventory = {
  'build-your-own': { physical: 10, reserved: 0, walkUpBuffer: 2 },
  'bacon-egg': { physical: 8, reserved: 1, walkUpBuffer: 3 },
  'sausage-egg': { physical: 12, reserved: 2, walkUpBuffer: 2 },
  'bacon-cheese-tomato': { physical: 7, reserved: 1, walkUpBuffer: 2 },
  'coronation-chicken': { physical: 5, reserved: 0, walkUpBuffer: 1 },
  'ham-cheese-toastie': { physical: 6, reserved: 0, walkUpBuffer: 0 },
  'tuna-mayo': { physical: 5, reserved: 0, walkUpBuffer: 1 },
  'egg-mayo': { physical: 6, reserved: 1, walkUpBuffer: 1 },
  'breakfast-wrap': { physical: 7, reserved: 2, walkUpBuffer: 2 },
  'veggie-wrap': { physical: 5, reserved: 1, walkUpBuffer: 1 },
  'small-english': { physical: 5, reserved: 2, walkUpBuffer: 1 },
  'full-english': { physical: 4, reserved: 1, walkUpBuffer: 1 },
};

export function reservableCount(stock: StockLevel) {
  return Math.max(stock.physical - stock.reserved - stock.walkUpBuffer, 0);
}

export const products: Product[] = [
  {
    available: true,
    id: 'build-your-own',
    name: 'Build your own',
    description: 'Choose your bread, fillings and sauce',
    price: 2.5,
    badge: 'YOUR WAY',
    category: 'cobs',
    image: 'build-your-own',
    custom: true,
    fulfilmentType: 'made_to_order',
  },
  {
    available: true,
    id: 'bacon-egg',
    name: 'Bacon & egg cob',
    description: 'Crispy bacon, fried egg, soft white cob',
    price: 4.5,
    badge: 'MOST LOVED',
    category: 'cobs',
    image: 'bacon-egg-cob',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'sausage-egg',
    name: 'Sausage & egg cob',
    description: 'Two pork sausages, fried egg',
    price: 4.5,
    category: 'cobs',
    image: 'sausage-egg-cob',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'bacon-cheese-tomato',
    name: 'Bacon, cheese & tomato baguette',
    description: 'Back bacon, melted cheddar, tomato',
    price: 5.25,
    category: 'cobs',
    image: 'bacon-cheese-tomato-baguette',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'coronation-chicken',
    name: 'Coronation chicken sandwich',
    description: 'Curried chicken, sultanas and fresh leaves',
    price: 4.75,
    category: 'cobs',
    image: 'coronation-chicken-sandwich',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'ham-cheese-toastie',
    name: 'Ham & cheese toastie',
    description: 'Sliced ham and melted cheddar on toasted bread',
    price: 4.5,
    category: 'cobs',
    image: 'ham-cheese-toastie',
    fulfilmentType: 'made_to_order',
  },
  {
    available: true,
    id: 'tuna-mayo',
    name: 'Tuna mayo cob',
    description: 'Tuna mayonnaise and crisp lettuce',
    price: 4.25,
    category: 'cobs',
    image: 'tuna-mayo-cob',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'egg-mayo',
    name: 'Egg mayo cob',
    description: 'Egg mayo, cress, soft white cob',
    price: 3.5,
    category: 'cobs',
    image: 'egg-mayo-cob',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'breakfast-wrap',
    name: 'Big breakfast wrap',
    description: 'Bacon, sausage, egg, cheese, hash brown',
    price: 5.75,
    badge: 'BEST VALUE',
    category: 'wraps',
    image: 'breakfast-wrap',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'veggie-wrap',
    name: 'Veggie breakfast wrap',
    description: 'Egg, cheese, hash brown, mushrooms',
    price: 5.25,
    category: 'wraps',
    image: 'veggie-breakfast-wrap',
    fulfilmentType: 'ready_stock',
  },
  {
    available: true,
    id: 'small-english',
    name: 'Small English breakfast',
    description: 'Bacon, sausage, egg, hash brown, beans, toast',
    price: 6.5,
    category: 'breakfast',
    image: 'small-english-breakfast',
    fulfilmentType: 'made_to_order',
  },
  {
    available: true,
    id: 'full-english',
    name: 'Full English breakfast',
    description: '2 bacon, 2 sausage, 2 egg, hash browns, beans, tomato, mushrooms & toast',
    price: 8.5,
    badge: 'PROPER BREAKFAST',
    category: 'breakfast',
    image: 'full-english-breakfast',
    fulfilmentType: 'made_to_order',
  },
];

export const orders: Order[] = [
  { id: '1', orderNumber: 104, customer: 'Jamie P.', initials: 'JP', productId: 'bacon-egg', itemName: 'Bacon & egg cob', quantity: 1, options: 'Brown sauce', total: 4.5, status: 'ready', fulfilmentType: 'ready_stock' },
  { id: '2', orderNumber: 105, customer: 'Mick S.', initials: 'MS', productId: 'sausage-egg', itemName: 'Sausage & egg cob', quantity: 2, options: 'Red sauce', total: 9, status: 'ready', fulfilmentType: 'ready_stock' },
  { id: '3', orderNumber: 106, customer: 'Sarah L.', initials: 'SL', productId: 'breakfast-wrap', itemName: 'Big breakfast wrap', quantity: 1, options: 'No sauce', total: 5.75, status: 'ready', fulfilmentType: 'ready_stock' },
  { id: '4', orderNumber: 107, customer: 'Tom B.', initials: 'TB', productId: 'bacon-egg', itemName: 'Bacon & egg cob', quantity: 1, options: 'No sauce', total: 4.5, status: 'collected', fulfilmentType: 'ready_stock' },
];
