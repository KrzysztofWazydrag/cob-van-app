export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  badge?: string;
  crop: 'front' | 'left' | 'right';
};

export type Order = {
  id: string;
  customer: string;
  initials: string;
  items: string;
  total: number;
  status: 'ready' | 'new';
};

export const products: Product[] = [
  {
    id: 'bacon-egg',
    name: 'Bacon & egg cob',
    description: 'Crispy bacon, fried egg, soft white cob',
    price: 4.5,
    stock: 4,
    badge: 'MOST LOVED',
    crop: 'front',
  },
  {
    id: 'sausage',
    name: 'Sausage cob',
    description: 'Two pork sausages, fried onions',
    price: 4.0,
    stock: 8,
    crop: 'left',
  },
  {
    id: 'tikka',
    name: 'Chicken tikka baguette',
    description: 'Warm tikka chicken, mint yoghurt',
    price: 5.5,
    stock: 3,
    badge: 'ONLY 3 LEFT',
    crop: 'right',
  },
];

export const orders: Order[] = [
  { id: '1', customer: 'Jamie P.', initials: 'JP', items: 'Bacon & egg · Brown sauce', total: 4.5, status: 'new' },
  { id: '2', customer: 'Mick S.', initials: 'MS', items: '2× Sausage · Red sauce', total: 8, status: 'new' },
  { id: '3', customer: 'Sarah L.', initials: 'SL', items: 'Chicken tikka baguette', total: 5.5, status: 'ready' },
  { id: '4', customer: 'Tom B.', initials: 'TB', items: 'Bacon & egg · No sauce', total: 4.5, status: 'new' },
];
