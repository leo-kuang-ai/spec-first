import { request } from '../api';
export async function OrderList() {
  const orders = await request('/orders');
  return <ul>{String(orders)}</ul>;
}
