import { request } from '../net/index';
export const audit = (e: string) => request('/audit?e=' + e);
