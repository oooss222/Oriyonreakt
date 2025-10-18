// src/lib/api.js
const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Универсальная обёртка над fetch
async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error || JSON.stringify(err);
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export const api = {
  // AUTH
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),

  // USERS
  me: (token) => request("/users/me", { token }),
  updateMe: (token, data) =>
    request("/users/me", { method: "PATCH", token, body: data }),

  // LISTINGS
  listings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/listings${q ? `?${q}` : ""}`);
  },
  listingById: (id) => request(`/listings/${id}`),
  createListing: (token, data) =>
    request("/listings", { method: "POST", token, body: data }),
  myListings: (token) => request("/listings/my", { token }),

  // FAVORITES
  favorites: (token) => request("/favorites", { token }),
  addFavorite: (token, id) =>
    request(`/favorites/${id}`, { method: "POST", token }),
  removeFavorite: (token, id) =>
    request(`/favorites/${id}`, { method: "DELETE", token }),

  // (на будущее) загрузка файлов
  uploadImage: (token, file) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("/upload/image", { method: "POST", token, body: fd });
  },
};

export const API_BASE = API;
