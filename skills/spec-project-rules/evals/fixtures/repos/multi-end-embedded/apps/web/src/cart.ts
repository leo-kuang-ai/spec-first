import { createClient } from '@shop/api-client';
import { Button } from '@shop/ui';
const api = createClient('https://api.example.com');
export function checkout() { return api.post('/checkout', { Button: Button('go') }); }
