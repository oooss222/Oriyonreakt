import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { Input, Textarea } from "./Input";
import { useI18n } from "../i18n";

const ConfirmContext = React.createContext(null);

/**
 * Promise-based replacement for `window.confirm` / `window.prompt`.
 *
 * `confirm(options)` resolves to `false` on cancel; for `prompt: true` it
 * resolves to the entered string, or `null` on cancel.
 */
export function ConfirmProvider({ children }) {
  const { t } = useI18n();
  const [request, setRequest] = React.useState(null);
  const [value, setValue] = React.useState("");
  const resolver = React.useRef(null);

  const confirm = React.useCallback((options = {}) => {
    setValue(options.defaultValue || "");
    setRequest(typeof options === "string" ? { message: options } : options);

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = React.useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setRequest(null);
    setValue("");
  }, []);

  const onCancel = React.useCallback(
    () => settle(request?.prompt ? null : false),
    [settle, request]
  );

  const onConfirm = React.useCallback(() => {
    if (request?.prompt) {
      const trimmed = value.trim();
      if (request.requireValue && !trimmed) return;
      settle(trimmed);
      return;
    }

    settle(true);
  }, [settle, request, value]);

  const contextValue = React.useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}

      <Modal
        open={Boolean(request)}
        onClose={onCancel}
        title={request?.title || t("common.confirmTitle")}
        size="sm"
        sheet={false}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={onCancel}>{request?.cancelLabel || t("common.cancel")}</Button>
            <Button
              variant={request?.tone === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
              disabled={Boolean(request?.prompt && request?.requireValue && !value.trim())}
            >
              {request?.confirmLabel || t("common.confirm")}
            </Button>
          </div>
        }
      >
        {request?.message && (
          <p className="text-sm leading-relaxed text-ink-600">{request.message}</p>
        )}

        {request?.prompt && (
          <div className="mt-3">
            {request.multiline ? (
              <Textarea
                data-autofocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={request.placeholder || ""}
                rows={4}
                aria-label={request.placeholder || request.title || t("common.comment")}
              />
            ) : (
              <Input
                data-autofocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={request.placeholder || ""}
                aria-label={request.placeholder || request.title || t("common.value")}
              />
            )}
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = React.useContext(ConfirmContext);

  // Fall back to the native dialogs when rendered outside the provider.
  return (
    context?.confirm ||
    ((options = {}) => {
      const opts = typeof options === "string" ? { message: options } : options;
      return Promise.resolve(
        opts.prompt
          ? window.prompt(opts.message || "", opts.defaultValue || "")
          : window.confirm(opts.message || "")
      );
    })
  );
}

export default ConfirmProvider;
