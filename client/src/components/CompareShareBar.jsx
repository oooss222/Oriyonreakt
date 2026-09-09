import React from "react";
import { Link2, Share2, Send, Check, Cloud, CloudOff } from "lucide-react";
import {
  buildCompareShareUrl,
  buildTelegramShareUrl,
  shareCompareLink,
} from "../lib/compareShare";
import { useI18n } from "../i18n";
import { Button } from "../ui";

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

  const syncing = syncState === "saving" || syncState === "loading";

  return (
    <div className="surface-panel flex flex-wrap items-center gap-2 p-3 sm:p-4">
      <h2 className="mr-auto text-sm font-semibold text-ink-900">
        {t("compare.shareTitle")}
      </h2>

      <Button
        icon={copied ? Check : Link2}
        disabled={busy}
        onClick={copyLink}
        className={copied ? "text-lagoon-700" : undefined}
      >
        {copied ? t("compare.linkCopied") : t("compare.copyLink")}
      </Button>

      <Button icon={Share2} onClick={copyLink}>
        {t("compare.share")}
      </Button>

      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn border-transparent bg-[#2AABEE] text-white hover:bg-[#2AABEE] hover:brightness-95"
      >
        <Send size={15} aria-hidden="true" />
        Telegram
      </a>

      {canSync && (
        <Button
          icon={syncState === "error" ? CloudOff : Cloud}
          loading={syncing}
          onClick={onSync}
          className="border-sun-200 bg-sun-50 text-sun-800 hover:bg-sun-100"
        >
          {syncState === "saved"
            ? t("compare.synced")
            : syncState === "error"
              ? t("compare.syncFailed")
              : t("compare.syncAccount")}
        </Button>
      )}
    </div>
  );
}
