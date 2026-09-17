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
} from "../../lib/messagesUtils";
import { isBusinessSupportThread } from "../../lib/openBusinessSupportChat";
import { formatPrice } from "../../lib/format";
import { resolveMediaUrl } from "../../lib/media";

function MessageBubble({ msg, mine, stacked, t }) {
  const attachment = msg.attachmentUrl
    ? resolveMediaUrl(msg.attachmentUrl, { placeholder: "" })
    : "";

  return (
    <div
      className={`messages-bubble ${mine ? "is-mine" : "is-peer"} ${
        stacked ? "is-stacked" : ""
      }`}
    >
      {attachment ? (
        <a
          href={attachment}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1.5 block overflow-hidden rounded-xl"
        >
          <img
            src={attachment}
            alt=""
            className="max-h-64 max-w-full object-cover"
          />
        </a>
      ) : null}

      {msg.text ? (
        <div className="whitespace-pre-wrap text-[15px] leading-[1.45]">
          {msg.text}
        </div>
      ) : null}

      <div className={`messages-bubble-meta ${mine ? "is-mine" : ""}`}>
        <span className="tabular-nums">{formatMessageTime(msg.createdAt)}</span>
        {mine ? (
          <span
            className="inline-flex"
            title={msg.isRead ? t("chat.read") : t("chat.delivered")}
          >
            {msg.isRead === true ? (
              <CheckCheck size={14} />
            ) : (
              <Check size={14} />
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ListingContextBar({ listing, selected, t }) {
  if (!selected || isBusinessSupportThread(selected)) return null;
  if (!listing && !selected.listingTitle) return null;

  const thumb = listingImageUrl(
    listing.images?.[0]?.url || listing.images?.[0] || selected.listingImage
  );
  const price = formatPrice(listing.price ?? selected.listingPrice, {
    emptyLabel: t("price.negotiable"),
    currency: t("price.currency"),
  });

  return (
    <Link to={`/ad/${selected.listingId}`} className="messages-listing-bar">
      {thumb ? (
        <img src={thumb} alt="" className="h-10 w-10 rounded-lg object-cover bg-mist" />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-mist">
          <MessageCircle size={16} className="text-ink-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-ink">
          {listing.title || selected.listingTitle}
        </div>
        <div className="truncate text-xs font-bold text-sun">{price}</div>
      </div>
      <span className="hidden items-center gap-0.5 text-xs font-semibold text-ink-400 sm:inline-flex">
        {t("chat.toListing")}
        <ChevronRight size={14} />
      </span>
    </Link>
  );
}

function ThreadMenu({ t, onAction, threadSettings, open, onClose }) {
  const archived = Boolean(threadSettings?.isArchived);
  const muted = Boolean(threadSettings?.isMuted);
  const menuRef = React.useRef(null);

  const actions = [
    {
      key: archived ? "unarchive" : "archive",
      label: archived ? t("chat.actionUnarchive") : t("chat.actionArchive"),
      icon: Archive,
    },
    { key: "unread", label: t("chat.actionUnread"), icon: MessageCircle },
    {
      key: muted ? "unmute" : "mute",
      label: muted ? t("chat.actionUnmute") : t("chat.actionMute"),
      icon: BellOff,
    },
    { key: "report", label: t("chat.actionReport"), icon: Flag },
    { key: "block", label: t("chat.actionBlock"), icon: Ban, danger: true },
  ];

  React.useEffect(() => {
    if (!open) return undefined;

    const onPointer = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="messages-thread-menu"
      role="menu"
    >
      {actions.map(({ key, label, icon: Icon, danger }) => (
        <button
          key={key}
          type="button"
          role="menuitem"
          onClick={() => {
            onAction(key);
            onClose();
          }}
          className={`messages-thread-menu-item ${danger ? "is-danger" : ""}`}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

function autoSizeComposer(element) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const composerRef = React.useRef(null);
  const myId = me?.id || me?._id;
  const showQuickReplies = thread.length < 3 && !isAdmin;

  React.useEffect(() => {
    setMenuOpen(false);
  }, [selected?.listingId, selected?.senderId, selected?.receiverId]);

  React.useEffect(() => {
    autoSizeComposer(composerRef.current);
  }, [text]);

  const presenceLabel = supportThread
    ? t("chat.supportHours")
    : peerOnline
    ? t("chat.onlineStatus")
    : formatLastSeen(selectedPeerLastSeen, t);

  return (
    <main className="messages-thread flex h-full min-h-0 flex-col">
      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-sun text-white">
            <MessageCircle size={28} strokeWidth={2} />
          </div>
          <div className="font-display text-xl font-bold tracking-tight text-ink">
            {t("chat.selectDialog")}
          </div>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-400">
            {t("chat.selectDialogHint")}
          </p>
        </div>
      ) : (
        <>
          <div className="messages-thread-header">
            <button
              type="button"
              onClick={onBack}
              className="messages-icon-btn md:hidden"
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
                <div className="truncate font-display text-[15px] font-bold text-ink">
                  {peerName}
                </div>
                {supportThread ? (
                  <span className="shrink-0 rounded-md bg-lagoon/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lagoon-700">
                    {t("chat.official")}
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-xs text-ink-400">
                {typingPeer ? (
                  <span className="font-medium text-sun">{t("chat.typing")}</span>
                ) : peerOnline && !supportThread ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-lagoon-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-lagoon" />
                    {presenceLabel}
                  </span>
                ) : (
                  presenceLabel
                )}
              </div>
            </div>

            {!supportThread && !isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={onRevealPhone}
                  aria-label={
                    phoneVisible && phoneNumber
                      ? phoneNumber
                      : t("chat.showPhone")
                  }
                  className="messages-icon-btn sm:hidden"
                >
                  <Phone size={17} />
                </button>
                <button
                  type="button"
                  onClick={onRevealPhone}
                  className="hidden h-9 items-center gap-1.5 rounded-full bg-mist px-3 text-sm font-semibold text-ink-600 transition hover:bg-lagoon/10 hover:text-lagoon-700 sm:inline-flex"
                >
                  <Phone size={15} />
                  {phoneVisible && phoneNumber
                    ? phoneNumber
                    : t("chat.showPhone")}
                </button>
              </>
            ) : supportThread ? (
              <Link
                to="/profile"
                className="hidden h-9 items-center rounded-full bg-lagoon/10 px-3 text-sm font-semibold text-lagoon-700 transition hover:bg-lagoon/15 sm:inline-flex"
              >
                {t("chat.helpCenter")}
              </Link>
            ) : null}

            {!isAdmin && !supportThread ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="messages-icon-btn"
                  aria-label={t("chat.moreActions")}
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal size={18} />
                </button>
                <ThreadMenu
                  t={t}
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  onAction={onAction}
                  threadSettings={threadSettings}
                />
              </div>
            ) : null}
          </div>

          {supportThread ? (
            <div className="messages-support-banner">
              <Shield size={15} className="mt-0.5 shrink-0 text-lagoon" />
              <span>{t("chat.supportSafety")}</span>
            </div>
          ) : (
            <ListingContextBar listing={listing} selected={selected} t={t} />
          )}

          <div className="messages-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-5">
            {threadLoading ? (
              <div className="space-y-3 px-2 pt-4">
                <div className="h-11 w-2/3 animate-pulse rounded-2xl bg-white" />
                <div className="ml-auto h-11 w-1/2 animate-pulse rounded-2xl bg-sun/20" />
                <div className="h-9 w-1/3 animate-pulse rounded-2xl bg-white" />
              </div>
            ) : thread.length === 0 ? (
              <div className="grid h-full place-items-center px-2 py-8">
                {supportThread ? (
                  <div className="max-w-sm rounded-2xl border border-lagoon/15 bg-white px-6 py-6 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-lagoon/10 text-lagoon">
                      <Shield size={22} />
                    </div>
                    <div className="font-display font-bold text-ink">
                      {t("chat.premiumConsultTitle")}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-400">
                      {t("chat.premiumConsultDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-ink-500">
                      {t("chat.empty")}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {t("chat.emptyHint")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              groupedThread.map((entry, index) => {
                if (entry.type === "day") {
                  return (
                    <div key={entry.id} className="flex justify-center py-3">
                      <span className="messages-day-chip">{entry.label}</span>
                    </div>
                  );
                }

                if (entry.type === "new") {
                  return (
                    <div key={entry.id} className="flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-sun/20" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-sun-600">
                        {t("chat.newMessages")}
                      </span>
                      <div className="h-px flex-1 bg-sun/20" />
                    </div>
                  );
                }

                const msg = entry.data;
                const mine = String(msg.senderId) === String(myId);
                const prev = groupedThread[index - 1];
                const stacked =
                  prev?.type === "message" &&
                  String(prev.data?.senderId) === String(msg.senderId);

                return (
                  <div
                    key={entry.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"} ${
                      stacked ? "mt-0.5" : "mt-2"
                    }`}
                  >
                    <MessageBubble
                      msg={msg}
                      mine={mine}
                      stacked={stacked}
                      t={t}
                    />
                  </div>
                );
              })
            )}

            {typingPeer ? (
              <div className="flex justify-start pt-1">
                <div className="messages-bubble is-peer messages-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {!isAdmin ? (
            <div className="messages-composer">
              {showQuickReplies ? (
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => onSend(reply)}
                      disabled={sending || uploadingAttachment}
                      className="messages-quick-reply"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              ) : null}

              {pendingAttachment ? (
                <div className="mb-2 flex items-center gap-3 rounded-2xl bg-mist/70 p-1.5 pr-2">
                  <img
                    src={pendingAttachment.preview}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1 text-sm text-ink-500">
                    {uploadingAttachment
                      ? t("chat.uploading")
                      : t("chat.attachImage")}
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveAttachment}
                    className="messages-icon-btn"
                    aria-label={t("common.close")}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : null}

              <div className="flex items-end gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickImage}
                />

                <button
                  type="button"
                  className="messages-icon-btn mb-0.5"
                  title={t("chat.attachImage")}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingAttachment}
                >
                  <ImageIcon size={20} />
                </button>

                <textarea
                  ref={composerRef}
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
                  className="messages-composer-input"
                />

                <button
                  type="button"
                  onClick={() => onSend()}
                  disabled={
                    sending ||
                    uploadingAttachment ||
                    (!text.trim() && !pendingAttachment?.url)
                  }
                  className="messages-send-btn"
                  aria-label={t("chat.send")}
                >
                  <Send size={17} />
                </button>
              </div>

              <p
                className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-300"
                title={t("chat.securityHint")}
              >
                <Shield size={12} className="shrink-0 text-lagoon" />
                <span className="truncate">{t("chat.securityHint")}</span>
              </p>
            </div>
          ) : (
            <div className="border-t border-ink/5 bg-white px-4 py-3 text-sm text-ink-400">
              {t("chat.adminReadOnly")}
            </div>
          )}
        </>
      )}
    </main>
  );
}
