const API_URL = "http://localhost:3001";

export async function apiFetch(path, getToken, options = {}) {
  // Força a renovação do token, ignorando o cache que pode estar expirado
  const token = await getToken({ skipCache: true });

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status}`);
  }
  return data;
}
