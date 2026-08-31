import React from "react";
import { Link2, Share2, Send, Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import {
  buildCompareShareUrl,
  buildTelegramShareUrl,
  shareCompareLink,
} from "../lib/compareShare";
import { useI18n } from "../i18n";

export default function CompareShareBar({
  cat,
  entries,
  syncState = "idle",
  onSync,
  canSync = false,
}) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  if (!entries?.length) return null;

  const shareUrl = buildCompareShareUrl(cat, entries);
  const telegramUrl = buildTelegramShareUrl(
    shareUrl,
    t("compare.shareTelegramText")
  );

  const copyLink = async () => {
    setBusy(true);
    const result = await shareCompareLink({
      url: shareUrl,
      title: t("compare.titleFull"),
      t,
    });
    setBusy(false);
    if (result.method === "clipboard" || result.method === "native") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-3 sm:p-4 flex flex-wrap items-center gap-2 ">
      <div className="text-sm font-semibold text-ink mr-auto">
        {t("compare.shareTitle")}
      </div>

      <button
        type="button"
        onClick={copyLink}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-mist/70 disabled:opacity-50"
      >
        {copied ? <Check size={15} className="text-lagoon" /> : <Link2 size={15} />}
        {copied ? t("compare.linkCopied") : t("compare.copyLink")}
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-mist/70"
      >
        <Share2 size={15} />
        {t("compare.share")}
      </button>

      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2AABEE] px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
      >
        <Send size={15} />
        Telegram
      </a>

      {canSync && (
        <button
          type="button"
          onClick={onSync}
          disabled={syncState === "saving" || syncState === "loading"}
          className="inline-flex items-center gap-1.5 rounded-xl border border-sun/30 bg-sun/5 px-3 py-2 text-sm font-semibold text-sun hover:bg-sun/10 disabled:opacity-50"
        >
          {syncState === "saving" || syncState === "loading" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : syncState === "saved" ? (
            <Cloud size={15} />
          ) : syncState === "error" ? (
            <CloudOff size={15} />
          ) : (
            <Cloud size={15} />
          )}
          {syncState === "saved"
            ? t("compare.synced")
            : syncState === "error"
              ? t("compare.syncFailed")
              : t("compare.syncAccount")}
        </button>
      )}
    </div>
  );
}
