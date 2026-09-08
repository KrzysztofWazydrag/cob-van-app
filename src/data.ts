export type ProductImage =
  | 'build-your-own'
  | 'bacon-egg-cob'
  | 'sausage-egg-cob'
  | 'bacon-cheese-tomato-baguette'
  | 'egg-mayo-cob'
  | 'breakfast-wrap'
  | 'veggie-breakfast-wrap'
  | 'small-english-breakfast'
  | 'full-english-breakfast';

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  badge?: string;
  category: 'cobs' | 'wraps' | 'breakfast';
  image: ProductImage;
  custom?: boolean;
};

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
};

export type StockLevel = {
  physical: number;
  reserved: number;
  walkUpBuffer: number;
};

export type Inventory = Record<string, StockLevel>;

export const initialInventory: Inventory = {
  'build-your-own': { physical: 10, reserved: 0, walkUpBuffer: 2 },
  'bacon-egg': { physical: 8, reserved: 1, walkUpBuffer: 3 },
  'sausage-egg': { physical: 12, reserved: 2, walkUpBuffer: 2 },
  'bacon-cheese-tomato': { physical: 7, reserved: 1, walkUpBuffer: 2 },
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
    id: 'build-your-own',
    name: 'Build your own',
    description: 'Choose your bread, fillings and sauce',
    price: 2.5,
    badge: 'YOUR WAY',
    category: 'cobs',
    image: 'build-your-own',
    custom: true,
  },
  {
    id: 'bacon-egg',
    name: 'Bacon & egg cob',
    description: 'Crispy bacon, fried egg, soft white cob',
    price: 4.5,
    badge: 'MOST LOVED',
    category: 'cobs',
    image: 'bacon-egg-cob',
  },
  {
    id: 'sausage-egg',
    name: 'Sausage & egg cob',
    description: 'Two pork sausages, fried egg',
    price: 4.5,
    category: 'cobs',
    image: 'sausage-egg-cob',
  },
  {
    id: 'bacon-cheese-tomato',
    name: 'Bacon, cheese & tomato baguette',
    description: 'Back bacon, melted cheddar, tomato',
    price: 5.25,
    category: 'cobs',
    image: 'bacon-cheese-tomato-baguette',
  },
  {
    id: 'egg-mayo',
    name: 'Egg mayo cob',
    description: 'Egg mayo, cress, soft white cob',
    price: 3.5,
    category: 'cobs',
    image: 'egg-mayo-cob',
  },
  {
    id: 'breakfast-wrap',
    name: 'Big breakfast wrap',
    description: 'Bacon, sausage, egg, cheese, hash brown',
    price: 5.75,
    badge: 'BEST VALUE',
    category: 'wraps',
    image: 'breakfast-wrap',
  },
  {
    id: 'veggie-wrap',
    name: 'Veggie breakfast wrap',
    description: 'Egg, cheese, hash brown, mushrooms',
    price: 5.25,
    category: 'wraps',
    image: 'veggie-breakfast-wrap',
  },
  {
    id: 'small-english',
    name: 'Small English breakfast',
    description: 'Bacon, sausage, egg, hash brown, beans, toast',
    price: 6.5,
    category: 'breakfast',
    image: 'small-english-breakfast',
  },
  {
    id: 'full-english',
    name: 'Full English breakfast',
    description: '2 bacon, 2 sausage, 2 egg, hash browns, beans, tomato, mushrooms & toast',
    price: 8.5,
    badge: 'PROPER BREAKFAST',
    category: 'breakfast',
    image: 'full-english-breakfast',
  },
];

export const orders: Order[] = [
  { id: '1', orderNumber: 104, customer: 'Jamie P.', initials: 'JP', productId: 'bacon-egg', itemName: 'Bacon & egg cob', quantity: 1, options: 'Brown sauce', total: 4.5, status: 'reserved' },
  { id: '2', orderNumber: 105, customer: 'Mick S.', initials: 'MS', productId: 'sausage-egg', itemName: 'Sausage & egg cob', quantity: 2, options: 'Red sauce', total: 9, status: 'preparing' },
  { id: '3', orderNumber: 106, customer: 'Sarah L.', initials: 'SL', productId: 'breakfast-wrap', itemName: 'Big breakfast wrap', quantity: 1, options: 'No sauce', total: 5.75, status: 'ready' },
  { id: '4', orderNumber: 107, customer: 'Tom B.', initials: 'TB', productId: 'bacon-egg', itemName: 'Bacon & egg cob', quantity: 1, options: 'No sauce', total: 4.5, status: 'collected' },
];
