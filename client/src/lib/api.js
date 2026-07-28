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

    if (res.status === 401 && token) {
      localStorage.removeItem("auth_token");
    }

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

  sellerPublic: (id) => request(`/users/${id}/public`),

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

  listingStats: (cat) =>
    request(`/listings/stats?cat=${encodeURIComponent(cat)}`),

  listingCount: (params = {}) => {
    const q = new URLSearchParams(params).toString();

    return request(`/listings/count${q ? `?${q}` : ""}`);
  },

  listingSuggest: (q, limit = 8) =>
    request(
      `/listings/suggest?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`
    ),

  listingById: (id) =>
    request(`/listings/${id}`),

  recordListingView: (id) =>
    request(`/listings/${id}/view`, {
      method: "POST",
    }),

  reportListing: (token, id, body) =>
    request(`/listings/${id}/report`, {
      method: "POST",
      token,
      body,
    }),

  messageInbox: (token) =>
  request("/messages/inbox", {
    token,
  }),

  messageThread: (token, listingId, peerId) =>
  request(
    `/messages/${listingId}${peerId ? `?peerId=${encodeURIComponent(peerId)}` : ""}`,
    {
      token,
    }
  ),

  markMessagesRead: (token, listingId, peerId) =>
    request(
      `/messages/${listingId}/read?peerId=${encodeURIComponent(peerId)}`,
      {
        method: "POST",
        token,
      }
    ),

  sendMessage: (token, listingId, text, receiverId) =>
  request(`/messages/${listingId}`, {
    method: "POST",
    token,
    body: { text, receiverId },
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

  markListingSold: (token, id) =>
    request(`/listings/${id}/sold`, {
      method: "POST",
      token,
    }),

  archiveListing: (token, id) =>
    request(`/listings/${id}/archive`, {
      method: "POST",
      token,
    }),

  republishListing: (token, id) =>
    request(`/listings/${id}/republish`, {
      method: "POST",
      token,
    }),

  adminDeleteListing: (token, id) =>
  request(`/admin/listings/${id}`, {
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

  walletTransactions: (token, limit = 50) =>
    request(`/users/me/wallet/transactions?limit=${encodeURIComponent(limit)}`, {
      token,
    }),

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

  moderationReports: (token, status = "pending") =>
    request(
      `/moderation/reports?status=${encodeURIComponent(status)}`,
      {
        token,
      }
    ),

  moderationReviewReport: (token, reportId) =>
    request(`/moderation/reports/${reportId}/review`, {
      method: "POST",
      token,
    }),

  moderationDismissReport: (token, reportId) =>
    request(`/moderation/reports/${reportId}/dismiss`, {
      method: "POST",
      token,
    }),
};

export const API_BASE = API;