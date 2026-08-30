import { request } from '../api';
export async function UserList() {
  const users = await request('/users');
  return <ul>{String(users)}</ul>;
}
