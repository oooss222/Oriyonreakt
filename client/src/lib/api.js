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

  promoteListing: (token, id, type) =>
    request(`/listings/${id}/promote`, {
      method: "POST",
      token,
      body: { type },
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

  paymentConfig: () => request("/payments/config"),

  initAlifWalletTopUp: (token, amount) =>
    request("/payments/alif/wallet-top-up", {
      method: "POST",
      token,
      body: { amount },
    }),

  syncAlifPayment: (token, orderId) =>
    request(`/payments/alif/sync/${encodeURIComponent(orderId)}`, {
      method: "POST",
      token,
    }),

  walletTransactions: (token, limit = 50) =>
    request(`/users/me/wallet/transactions?limit=${encodeURIComponent(limit)}`, {
      token,
    }),

  adminUsers: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.q) qs.set("q", params.q);
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const query = qs.toString();

    return request(`/admin/users${query ? `?${query}` : ""}`, { token });
  },

  adminStats: (token) =>
    request("/admin/stats", {
      token,
    }),

  adminFinanceSummary: (token) =>
    request("/admin/finance/summary", { token }),

  adminFinanceTransactions: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.type) qs.set("type", params.type);
    if (params.q) qs.set("q", params.q);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.userId) qs.set("userId", params.userId);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));

    const query = qs.toString();

    return request(`/admin/finance/transactions${query ? `?${query}` : ""}`, {
      token,
    });
  },

  adminFinanceReports: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);

    const query = qs.toString();

    return request(`/admin/finance/reports${query ? `?${query}` : ""}`, { token });
  },

  adminFinancePayments: (token) =>
    request("/admin/finance/payments", { token }),

  adminFinanceAlifOrders: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.status) qs.set("status", params.status);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();

    return request(`/admin/finance/alif-orders${query ? `?${query}` : ""}`, { token });
  },

  adminSyncAlifOrder: (token, orderId) =>
    request(`/admin/finance/alif-orders/${encodeURIComponent(orderId)}/sync`, {
      method: "POST",
      token,
    }),

  savedSearches: (token) => request("/saved-searches", { token }),

  saveSavedSearch: (token, body) =>
    request("/saved-searches", {
      method: "POST",
      token,
      body,
    }),

  deleteSavedSearch: (token, id) =>
    request(`/saved-searches/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),

  sellerReviews: (sellerId) =>
    request(`/reviews/seller/${encodeURIComponent(sellerId)}`),

  createSellerReview: (token, body) =>
    request("/reviews", {
      method: "POST",
      token,
      body,
    }),

  ads: ({ placement, cat = "" } = {}) => {
    const qs = new URLSearchParams();

    qs.set("placement", placement);

    if (cat) {
      qs.set("cat", cat);
    }

    return request(`/ads?${qs.toString()}`);
  },

  trackAd: (id, type = "impression") =>
    request(`/ads/${encodeURIComponent(id)}/track`, {
      method: "POST",
      body: { type },
    }),

  adminAdStats: (token) => request("/admin/ads/stats", { token }),

  adminAds: (token) => request("/admin/ads", { token }),

  adminCreateAd: (token, body) =>
    request("/admin/ads", {
      method: "POST",
      token,
      body,
    }),

  adminUpdateAd: (token, id, body) =>
    request(`/admin/ads/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body,
    }),

  adminDeleteAd: (token, id) =>
    request(`/admin/ads/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    }),

  adminFinancePromotions: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);

    const query = qs.toString();

    return request(`/admin/finance/promotions${query ? `?${query}` : ""}`, { token });
  },

  adminFinanceAudit: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();

    return request(`/admin/finance/audit${query ? `?${query}` : ""}`, { token });
  },

  adminFinanceSendReport: (token, body = {}) =>
    request("/admin/finance/send-report", {
      method: "POST",
      token,
      body,
    }),

  adminGetUser: (token, userId) =>
    request(`/admin/users/${userId}`, {
      token,
    }),

  adminUserWalletTransactions: (token, userId, limit = 50) =>
    request(
      `/admin/users/${userId}/wallet/transactions?limit=${encodeURIComponent(limit)}`,
      { token }
    ),

  adminAdjustUserWallet: (token, userId, amount, description = "") =>
    request(`/admin/users/${userId}/wallet/adjust`, {
      method: "POST",
      token,
      body: { amount, description },
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

  adminListings: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.cat) qs.set("cat", params.cat);
    if (params.owner) qs.set("owner", params.owner);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();

    return request(`/admin/listings${query ? `?${query}` : ""}`, { token });
  },

  adminSetListingStatus: (token, listingId, status) =>
    request(`/admin/listings/${listingId}/status`, {
      method: "POST",
      token,
      body: { status },
    }),

  adminAuditLog: (token, params = {}) => {
    const qs = new URLSearchParams();

    if (params.action) qs.set("action", params.action);
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.offset) qs.set("offset", String(params.offset));

    const query = qs.toString();

    return request(`/admin/audit${query ? `?${query}` : ""}`, { token });
  },

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

  moderationReportDeleteListing: (token, reportId) =>
    request(`/moderation/reports/${reportId}/delete-listing`, {
      method: "POST",
      token,
    }),

  moderationReportBlockOwner: (token, reportId) =>
    request(`/moderation/reports/${reportId}/block-owner`, {
      method: "POST",
      token,
    }),

  siteSettings: () => request("/settings"),

  sitePolicy: () => request("/settings/policy"),

  adminAnalytics: (token, days = 30) =>
    request(`/admin/analytics?days=${encodeURIComponent(days)}`, { token }),

  adminGetSettings: (token) =>
    request("/admin/settings", { token }),

  adminUpdateSettings: (token, body) =>
    request("/admin/settings", {
      method: "PUT",
      token,
      body,
    }),

  adminExport: async (token, type, params = {}) => {
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const qs = new URLSearchParams();

    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);

    const query = qs.toString();
    const url = `${API}/admin/export/${encodeURIComponent(type)}${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers,
    });

    if (!res.ok) {
      let message = "Export failed";

      try {
        const data = await res.json();
        message = data.error || message;
      } catch {
        // ignore
      }

      throw new Error(message);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${type}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  },
};

export const API_BASE = API;