export interface Client { get(url: string): Promise<unknown>; post(url: string, body: unknown): Promise<unknown>; }
export function createClient(base: string): Client {
  return { get: async (url) => fetch(base + url).then((r) => r.json()),
    post: async (url, body) => fetch(base + url, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json()) };
}
