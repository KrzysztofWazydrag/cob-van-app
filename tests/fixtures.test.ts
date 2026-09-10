import { expect, it } from 'vitest';
import { initialInventory, orders, type OrderStatus } from '../src/data';

it('initial reserved stock matches active fixture order quantities for every product', () => {
  const activeStatuses: OrderStatus[] = ['reserved', 'preparing', 'ready'];
  const expected: Record<string, number> = Object.fromEntries(
    Object.keys(initialInventory).map((productId) => [productId, 0]),
  );

  for (const order of orders) {
    if (!activeStatuses.includes(order.status)) continue;
    expect(initialInventory[order.productId]).toBeDefined();
    expected[order.productId] += order.quantity;
  }

  const actual = Object.fromEntries(
    Object.entries(initialInventory).map(([productId, stock]) => [productId, stock.reserved]),
  );
  expect(actual).toEqual(expected);
});
