import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BellOff,
  ChevronRight,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Send,
  Shield,
  Check,
  CheckCheck,
  Archive,
  Flag,
  Ban,
  X,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import {
  formatLastSeen,
  formatMessageTime,
  listingImageUrl,
  listingStatusClass,
  listingStatusLabel,
} from "../../lib/messagesUtils";
import { isBusinessSupportThread } from "../../lib/openBusinessSupportChat";
import { formatPrice } from "../../lib/format";
import { formatListingTimeAgo } from "../../i18n/helpers";
import { resolveMediaUrl } from "../../lib/media";

function MessageBubble({ msg, mine, t }) {
  const attachment = msg.attachmentUrl
    ? resolveMediaUrl(msg.attachmentUrl, { placeholder: "" })
    : "";

  return (
    <div
      className={`max-w-[88%] md:max-w-[68%] rounded-[1.15rem] px-3.5 py-2.5 ${
        mine
          ? "messages-bubble-mine text-white rounded-br-md"
          : "messages-bubble-peer text-ink border border-ink/6 rounded-bl-md"
      }`}
    >
      {attachment ? (
        <a
          href={attachment}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-2 -mx-0.5"
        >
          <img
            src={attachment}
            alt=""
            className="max-w-full rounded-xl max-h-64 object-cover ring-1 ring-black/5"
          />
        </a>
      ) : null}

      {msg.text ? (
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {msg.text}
        </div>
      ) : null}

      <div
        className={`flex items-center justify-end gap-1 text-[11px] mt-1.5 ${
          mine ? "text-white/75" : "text-ink-300"
        }`}
      >
        <span className="tabular-nums">{formatMessageTime(msg.createdAt)}</span>
        {mine ? (
          <span
            className="inline-flex"
            title={msg.isRead ? t("chat.read") : t("chat.delivered")}
          >
            {msg.isRead === true ? (
              <CheckCheck size={14} className="text-white" />
            ) : (
              <Check size={14} />
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ListingContextCard({ listing, selected, t }) {
  if (!listing || isBusinessSupportThread(selected)) return null;

  const thumb = listingImageUrl(
    listing.images?.[0]?.url || listing.images?.[0] || selected.listingImage
  );

  const price = formatPrice(listing.price ?? selected.listingPrice, {
    emptyLabel: t("price.negotiable"),
    currency: t("price.currency"),
  });

  const status = listing.status || selected.listingStatus || "approved";
  const publishedAt = formatListingTimeAgo(
    listing.createdAt ? listing : { createdAt: selected.listingCreatedAt },
    t,
    { emptyLabel: "" }
  );

  return (
    <div className="mx-4 mt-3 rounded-2xl border border-ink/8 bg-white/95 px-3 py-3 shadow-soft backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="w-14 h-14 rounded-xl object-cover bg-mist shrink-0 ring-1 ring-ink/5"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-mist grid place-items-center shrink-0">
            <MessageCircle size={18} className="text-ink-300" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink line-clamp-1">
            {listing.title || selected.listingTitle}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-sun">{price}</span>
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${listingStatusClass(
                status
              )}`}
            >
              {listingStatusLabel(status, t)}
            </span>
            {publishedAt ? (
              <span className="text-xs text-ink-400">
                {t("chat.publishedAgo", { time: publishedAt })}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          to={`/ad/${selected.listingId}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-ink/8 bg-mist/50 px-3 py-2 text-sm font-semibold text-ink transition hover:border-sun/30 hover:bg-sun-50 hover:text-sun-700"
        >
          {t("chat.toListing")}
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function ThreadActions({ t, onAction, threadSettings }) {
  const archived = Boolean(threadSettings?.isArchived);
  const muted = Boolean(threadSettings?.isMuted);

  const actions = [
    {
      key: archived ? "unarchive" : "archive",
      label: archived ? t("chat.actionUnarchive") : t("chat.actionArchive"),
      icon: Archive,
      active: archived,
    },
    { key: "unread", label: t("chat.actionUnread"), icon: MessageCircle },
    {
      key: muted ? "unmute" : "mute",
      label: muted ? t("chat.actionUnmute") : t("chat.actionMute"),
      icon: BellOff,
      active: muted,
    },
    { key: "report", label: t("chat.actionReport"), icon: Flag },
    { key: "block", label: t("chat.actionBlock"), icon: Ban, danger: true },
  ];

  return (
    <div className="px-4 py-2 border-b border-ink/6 bg-white/80 backdrop-blur-sm overflow-x-auto scrollbar-none">
      <div className="flex gap-2 min-w-max">
        {actions.map(({ key, label, icon: Icon, active, danger }) => (
          <button
            key={key}
            type="button"
            onClick={() => onAction(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-sun/25 bg-sun-50 text-sun-700"
                : danger
                ? "border-ink/8 bg-white text-ink-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                : "border-ink/8 bg-white text-ink-500 hover:border-ink/15 hover:bg-mist"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatThreadPanel({
  t,
  selected,
  me,
  thread,
  groupedThread,
  threadLoading,
  typingPeer,
  peerOnline,
  selectedPeerLastSeen,
  peerName,
  supportThread,
  listing,
  phoneVisible,
  onRevealPhone,
  phoneNumber,
  text,
  onTextChange,
  onSend,
  sending,
  quickReplies,
  isAdmin,
  onBack,
  onAction,
  chatEndRef,
  threadSettings,
  pendingAttachment,
  onPickImage,
  onRemoveAttachment,
  uploadingAttachment,
  imageInputRef,
}) {
  const presenceLabel = supportThread
    ? t("chat.supportHours")
    : peerOnline
    ? t("chat.onlineStatus")
    : formatLastSeen(selectedPeerLastSeen, t);

  return (
    <main className="messages-thread flex h-full min-h-0 flex-col">
      {!selected ? (
        <div className="flex-1 grid place-items-center p-8 text-center">
          <div className="max-w-sm">
            <div className="mx-auto mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.35rem] bg-gradient-to-br from-sun to-sun-600 text-white shadow-lift">
              <MessageCircle size={32} strokeWidth={2} />
            </div>
            <div className="font-display font-bold text-xl text-ink tracking-tight">
              {t("chat.selectDialog")}
            </div>
            <div className="text-sm text-ink-400 mt-2 leading-relaxed">
              {t("chat.selectDialogHint")}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-ink/6 bg-white/95 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-600 xl:hidden shrink-0 hover:bg-mist"
                aria-label={t("chat.backToDialogs")}
              >
                <ArrowLeft size={18} />
              </button>

              <ChatAvatar
                name={peerName}
                support={supportThread}
                online={peerOnline}
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-display font-bold text-ink truncate">
                    {peerName}
                  </div>
                  {supportThread ? (
                    <span className="inline-flex items-center rounded-md bg-lagoon/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lagoon-700">
                      {t("chat.official")}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-ink-400 mt-0.5 truncate">
                  {peerOnline && !supportThread ? (
                    <span className="inline-flex items-center gap-1.5 text-lagoon-700 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-lagoon" />
                      {presenceLabel}
                    </span>
                  ) : (
                    presenceLabel
                  )}
                  {typingPeer ? (
                    <span className="text-sun font-medium">
                      {" "}
                      · {t("chat.typing")}
                    </span>
                  ) : null}
                </div>
              </div>

              {!supportThread && !isAdmin ? (
                <button
                  type="button"
                  onClick={onRevealPhone}
                  className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-ink/8 bg-white px-3 py-2 text-sm font-semibold text-ink-600 transition hover:border-lagoon/30 hover:bg-lagoon/5 hover:text-lagoon-700"
                >
                  <Phone size={16} />
                  {phoneVisible && phoneNumber
                    ? phoneNumber
                    : t("chat.showPhone")}
                </button>
              ) : supportThread ? (
                <Link
                  to="/profile"
                  className="hidden sm:inline-flex shrink-0 items-center rounded-xl border border-lagoon/20 bg-lagoon/5 px-3 py-2 text-sm font-semibold text-lagoon-700 transition hover:bg-lagoon/10"
                >
                  {t("chat.helpCenter")}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => onAction("menu")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-500 shrink-0 hover:bg-mist"
                aria-label={t("chat.moreActions")}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {!isAdmin && !supportThread ? (
            <ThreadActions t={t} onAction={onAction} threadSettings={threadSettings} />
          ) : null}

          {supportThread ? (
            <div className="mx-4 mt-3 rounded-2xl border border-lagoon/15 bg-lagoon/5 px-4 py-3 text-sm text-lagoon-800 flex items-start gap-2.5">
              <Shield size={16} className="shrink-0 mt-0.5 text-lagoon" />
              <span>{t("chat.supportSafety")}</span>
            </div>
          ) : (
            <ListingContextCard listing={listing} selected={selected} t={t} />
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
            {threadLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-white/80 rounded-2xl w-2/3 shadow-soft" />
                <div className="h-12 bg-sun/20 rounded-2xl w-1/2 ml-auto" />
                <div className="h-10 bg-white/80 rounded-2xl w-1/3 shadow-soft" />
              </div>
            ) : thread.length === 0 ? (
              <div className="py-8 px-2">
                {supportThread ? (
                  <div className="max-w-md mx-auto rounded-2xl border border-lagoon/15 bg-white/95 p-6 text-center shadow-soft">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-lagoon/10 text-lagoon">
                      <Shield size={22} />
                    </div>
                    <div className="font-display font-bold text-ink">
                      {t("chat.premiumConsultTitle")}
                    </div>
                    <p className="text-sm text-ink-400 mt-2 leading-relaxed">
                      {t("chat.premiumConsultDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-ink-400 py-6">
                    {t("chat.empty")}
                  </div>
                )}
              </div>
            ) : (
              groupedThread.map((entry) => {
                if (entry.type === "day") {
                  return (
                    <div key={entry.id} className="flex justify-center py-2">
                      <span className="messages-day-chip">{entry.label}</span>
                    </div>
                  );
                }

                if (entry.type === "new") {
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-sun/25" />
                      <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-sun-600">
                        {t("chat.newMessages")}
                      </span>
                      <div className="h-px flex-1 bg-sun/25" />
                    </div>
                  );
                }

                const msg = entry.data;
                const mine = String(msg.senderId) === String(me?.id || me?._id);

                return (
                  <div
                    key={entry.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <MessageBubble msg={msg} mine={mine} t={t} />
                  </div>
                );
              })
            )}

            {typingPeer ? (
              <div className="flex justify-start">
                <div className="messages-bubble-peer rounded-[1.15rem] rounded-bl-md border border-ink/6 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-bounce" />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {!isAdmin ? (
            <div className="messages-composer border-t border-ink/6 p-4 space-y-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => onSend(reply)}
                    disabled={sending || uploadingAttachment}
                    className="shrink-0 rounded-full border border-ink/8 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-sun/30 hover:bg-sun-50 hover:text-sun-700 disabled:opacity-60"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {pendingAttachment ? (
                <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-mist/40 p-2">
                  <img
                    src={pendingAttachment.preview}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-ink/5"
                  />
                  <div className="min-w-0 flex-1 text-sm text-ink-500">
                    {uploadingAttachment
                      ? t("chat.uploading")
                      : t("chat.attachImage")}
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveAttachment}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink/8 bg-white text-ink-500 hover:bg-mist"
                    aria-label={t("common.close")}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}

              <div className="flex items-end gap-2.5">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickImage}
                />

                <button
                  type="button"
                  className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-ink/8 bg-white text-ink-500 transition hover:border-sun/30 hover:bg-sun-50 hover:text-sun-700 disabled:opacity-50 shrink-0"
                  title={t("chat.attachImage")}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingAttachment}
                >
                  <ImageIcon size={20} />
                </button>

                <textarea
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  rows={1}
                  placeholder={t("chat.placeholder")}
                  className="input flex-1 min-h-[52px] max-h-[160px] resize-none py-3.5 rounded-2xl border-ink/8 bg-white shadow-soft focus:border-sun/40"
                />

                <button
                  type="button"
                  onClick={() => onSend()}
                  disabled={
                    sending ||
                    uploadingAttachment ||
                    (!text.trim() && !pendingAttachment?.url)
                  }
                  className="btn btn-primary h-[52px] w-[52px] p-0 rounded-2xl disabled:opacity-50 shrink-0 shadow-soft"
                  aria-label={t("chat.send")}
                >
                  <Send size={18} />
                </button>
              </div>

              <div className="flex items-start gap-2 text-xs text-ink-400">
                <Shield size={14} className="shrink-0 mt-0.5 text-lagoon" />
                <span>{t("chat.securityHint")}</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-ink/6 bg-white/95 p-4 text-sm text-ink-400">
              {t("chat.adminReadOnly")}
            </div>
          )}
        </>
      )}
    </main>
  );
}
