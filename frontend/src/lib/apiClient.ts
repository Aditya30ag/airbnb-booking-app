const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    if (userId) headers.set('X-User-Id', userId);
    if (userRole) headers.set('X-User-Role', userRole);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.error('Unauthorized response', response.status);
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as any)?.detail || `API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
