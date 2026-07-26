const EVENT = "oriyon:unread";

export function getUnreadTotal(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Number(item.unreadCount || 0),
    0
  );
}

export function publishUnreadCount(count) {
  window.dispatchEvent(
    new CustomEvent(EVENT, {
      detail: { count: Number(count) || 0 },
    })
  );
}

export function subscribeUnreadCount(callback) {
  const handler = (event) => {
    callback(Number(event.detail?.count) || 0);
  };

  window.addEventListener(EVENT, handler);

  return () => window.removeEventListener(EVENT, handler);
}

export function requestUnreadRefresh() {
  window.dispatchEvent(new CustomEvent("oriyon:unread-refresh"));
}

export function subscribeUnreadRefresh(callback) {
  window.addEventListener("oriyon:unread-refresh", callback);
  return () => window.removeEventListener("oriyon:unread-refresh", callback);
}
