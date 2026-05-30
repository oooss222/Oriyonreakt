const API = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "/api"
).replace(/\/$/, "");

async function request(
  path,
  {
    method = "GET",
    body,
    token,
  } = {}
) {
  const headers = {};

  if (!(body instanceof FormData)) {
    headers["Content-Type"] =
      "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${API}${path}`,
    {
      method,
      headers,

      body: body
        ? body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined,
    }
  );

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;

    try {
      const err = await res.json();

      msg =
        err.error ||
        JSON.stringify(err);
    } catch {}

    throw new Error(msg);
  }

  const text = await res.text();

  try {
    return text
      ? JSON.parse(text)
      : null;
  } catch {
    return text;
  }
}

export const api = {
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: data,
    }),

  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: data,
    }),

  me: (token) =>
    request("/users/me", {
      token,
    }),

  updateMe: (token, data) =>
    request("/users/me", {
      method: "PUT",
      token,
      body: data,
    }),

  getVerification: (token) =>
    request("/auth/verification", {
      token,
    }),

  requestEmailVerification: (
    token
  ) =>
    request("/auth/verification", {
      method: "POST",
      token,
    }),

  listings: (params = {}) => {
    const q = new URLSearchParams(
      params
    ).toString();

    return request(
      `/listings${q ? `?${q}` : ""}`
    );
  },

  adByPlacement: (placement) =>
  request(`/ads/${encodeURIComponent(placement)}`),

  listingById: (id) =>
    request(`/listings/${id}`),

  messageInbox: (token) =>
  request("/messages/inbox", {
    token,
  }),

  messageThread: (token, listingId) =>
  request(`/messages/${listingId}`, {
    token,
  }),

  sendMessage: (token, listingId, text) =>
  request(`/messages/${listingId}`, {
    method: "POST",
    token,
    body: { text },
  }),

  myListings: (token) =>
    request("/listings/mine", {
      token,
    }),


  uploadImages: (
    token,
    formData
  ) =>
    request("/upload/images", {
      method: "POST",
      token,
      body: formData,
    }),

  createListing: (token, data) =>
    request("/listings", {
      method: "POST",
      token,
      body: data,
    }),

  updateListing: (
    token,
    id,
    body
  ) =>
    request(`/listings/${id}`, {
      method: "PUT",
      token,
      body,
    }),

  deleteListing: (token, id) =>
    request(`/listings/${id}`, {
      method: "DELETE",
      token,
    }),

  adminDeleteListing: (token, id) =>
  request(`/admin/listings/${id}`, {
    method: "DELETE",
    token,
  }),

  

  adminAds: (token) =>
  request("/admin/ads", {
    token,
  }),

adminCreateAd: (token, data) =>
  request("/admin/ads", {
    method: "POST",
    token,
    body: data,
  }),

adminToggleAd: (token, id, isActive) =>
  request(`/admin/ads/${id}/toggle`, {
    method: "PUT",
    token,
    body: { isActive },
  }),

adminDeleteAd: (token, id) =>
  request(`/admin/ads/${id}`, {
    method: "DELETE",
    token,
  }),

  favorites: (token) =>
    request("/favorites", {
      token,
    }),

  addFavorite: (token, id) =>
    request(`/favorites/${id}`, {
      method: "POST",
      token,
    }),

  removeFavorite: (
    token,
    id
  ) =>
    request(`/favorites/${id}`, {
      method: "DELETE",
      token,
    }),

  topUpWallet: (
    token,
    amount
  ) =>
    request(
      "/users/me/wallet/top-up",
      {
        method: "POST",
        token,
        body: {
          amount,
        },
      }
    ),

  adminUsers: (token) =>
    request("/admin/users", {
      token,
    }),

  adminSetUserRole: (
    token,
    userId,
    role
  ) =>
    request(
      `/admin/users/${userId}/role`,
      {
        method: "PUT",
        token,
        body: {
          role,
        },
      }
    ),

  adminBlockUser: (
    token,
    userId
  ) =>
    request(
      `/admin/users/${userId}/block`,
      {
        method: "POST",
        token,
      }
    ),

  adminUnblockUser: (
    token,
    userId
  ) =>
    request(
      `/admin/users/${userId}/unblock`,
      {
        method: "POST",
        token,
      }
    ),

  moderationListings: (
    token,
    status = "pending"
  ) =>
    request(
      `/moderation/listings?status=${encodeURIComponent(
        status
      )}`,
      {
        token,
      }
    ),

  moderationApproveListing: (
    token,
    listingId
  ) =>
    request(
      `/moderation/listings/${listingId}/approve`,
      {
        method: "POST",
        token,
      }
    ),

  moderationRejectListing: (
    token,
    listingId,
    reason
  ) =>
    request(
      `/moderation/listings/${listingId}/reject`,
      {
        method: "POST",
        token,
        body: {
          reason,
        },
      }
    ),
};

export const API_BASE = API;