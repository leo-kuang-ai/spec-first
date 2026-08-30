import { audit } from './audit';
import type { Order } from './domain';
export const placeOrder = (o: Order) => { audit('order:' + o.id); return o; };
