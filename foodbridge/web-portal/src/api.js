const API = import.meta.env.VITE_API_URL ?? ""; // empty = Vite proxy

export function createApi(getUser) {
  return async function call(path, { method = "GET", body } = {}) {
    const user = getUser();
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(user ? { "x-user-id": user.id } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };
}
