import React from "react";
import { api } from "./api";
import { TOKEN_KEY } from "./auth";

const POLL_INTERVAL_MS = 15000;

export function getUnreadTotal(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (sum, item) => sum + Number(item.unreadCount || 0),
    0
  );
}

// A single poller shared by every consumer. Header and MobileNav both show the
// badge and used to fetch the whole inbox independently, doubling the request
// rate for anyone on a phone.
let currentCount = 0;
let inFlight = null;
let timer = null;
const subscribers = new Set();

function notify() {
  for (const subscriber of subscribers) {
    subscriber(currentCount);
  }
}

function setCount(next) {
  const value = Number(next) || 0;

  if (value === currentCount) return;

  currentCount = value;
  notify();
}

function refreshUnread() {
  if (inFlight) return inFlight;

  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY) || ""
      : "";

  if (!token) {
    setCount(0);
    return Promise.resolve();
  }

  inFlight = api
    .messageInbox(token)
    .then((data) => setCount(getUnreadTotal(data)))
    .catch(() => setCount(0))
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

function startPolling() {
  if (timer) return;

  refreshUnread();
  timer = setInterval(refreshUnread, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (!timer) return;

  clearInterval(timer);
  timer = null;
}

export function publishUnreadCount(count) {
  setCount(count);
}

export function subscribeUnreadCount(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function requestUnreadRefresh() {
  return refreshUnread();
}

export function subscribeUnreadRefresh(callback) {
  window.addEventListener("oriyon:unread-refresh", callback);
  return () => window.removeEventListener("oriyon:unread-refresh", callback);
}

/** Subscribes to the shared unread badge; polling runs while anyone listens. */
export function useUnreadCount(enabled = true) {
  const [count, setLocalCount] = React.useState(enabled ? currentCount : 0);

  React.useEffect(() => {
    if (!enabled) {
      setLocalCount(0);
      return undefined;
    }

    subscribers.add(setLocalCount);
    setLocalCount(currentCount);
    startPolling();

    return () => {
      subscribers.delete(setLocalCount);

      if (!subscribers.size) {
        stopPolling();
      }
    };
  }, [enabled]);

  return enabled ? count : 0;
}
