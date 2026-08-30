export function request(url: string): Promise<unknown> {
  return fetch(url).then((r) => r.json());
}
