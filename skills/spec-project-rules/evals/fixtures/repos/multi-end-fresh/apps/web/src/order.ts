import { createClient } from '@shop/api-client';
const api = createClient('https://api.example.com');
export function loadOrders() { return api.get('/orders'); }
