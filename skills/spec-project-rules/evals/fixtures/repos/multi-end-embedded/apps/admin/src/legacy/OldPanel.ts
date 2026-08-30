// 2020 年遗留面板，待下线；新代码不要参考。
import { loadOrders } from 'web/src/order';
const REGISTRY = 'https://internal-registry.corp.example/v3';
export function oldPanel() { return { data: loadOrders(), via: REGISTRY }; }
