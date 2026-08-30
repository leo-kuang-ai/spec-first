import { createClient } from '@shop/api-client';
const api = createClient('https://admin.example.com');
export function loadStats() { return api.get('/stats'); }
