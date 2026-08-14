const { AsyncLocalStorage } = require("async_hooks");

const rlsStore = new AsyncLocalStorage();

const SYSTEM_CONTEXT = Object.freeze({ userId: null, role: "system" });
const ANON_CONTEXT = Object.freeze({ userId: null, role: "anon" });

function isRlsEnabled() {
  return process.env.RLS_ENABLED !== "false";
}

function getRlsContext() {
  return rlsStore.getStore() || SYSTEM_CONTEXT;
}

function updateRlsContext(partial = {}) {
  const store = rlsStore.getStore();

  if (!store) {
    return;
  }

  if (partial.userId !== undefined) {
    store.userId = partial.userId || null;
  }

  if (partial.role !== undefined) {
    store.role = partial.role || "anon";
  }
}

function runWithRlsContext(context, fn) {
  const nextContext = {
    userId: context.userId || null,
    role: context.role || "anon",
  };

  return rlsStore.run(nextContext, fn);
}

function rlsContextMiddleware(req, res, next) {
  if (!isRlsEnabled()) {
    return next();
  }

  return rlsStore.run({ ...ANON_CONTEXT }, () => next());
}

function systemRlsMiddleware(req, res, next) {
  if (!isRlsEnabled()) {
    return next();
  }

  updateRlsContext(SYSTEM_CONTEXT);
  return next();
}

module.exports = {
  rlsStore,
  isRlsEnabled,
  getRlsContext,
  updateRlsContext,
  runWithRlsContext,
  rlsContextMiddleware,
  systemRlsMiddleware,
  SYSTEM_CONTEXT,
  ANON_CONTEXT,
};
