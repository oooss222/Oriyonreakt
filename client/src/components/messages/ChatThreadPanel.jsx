import React from "react";
import {
  ArrowLeft,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Phone,
  Shield,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import ChatActionsSheet from "./ChatActionsSheet";
import ChatComposer from "./ChatComposer";
import ChatListingHeader from "./ChatListingHeader";
import ChatMessageBubble from "./ChatMessageBubble";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  IconButton,
  Skeleton,
  cn,
} from "../../ui";
import { formatLastSeen } from "../../lib/messagesUtils";

const SKELETON_BUBBLES = [
  { mine: false, width: "w-44" },
  { mine: true, width: "w-32" },
  { mine: false, width: "w-56" },
  { mine: true, width: "w-40" },
  { mine: false, width: "w-36" },
];

function ThreadSkeleton() {
  return (
    <div className="space-y-2">
      {SKELETON_BUBBLES.map(({ mine, width }, index) => (
        <div key={index} className={cn("flex", mine ? "justify-end" : "justify-start")}>
          <Skeleton className={cn("h-12 max-w-[70%]", width)} rounded="rounded-2xl" />
        </div>
      ))}
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
  logRef,
  onComposerGrow,
  threadSettings,
  pendingAttachment,
  onPickImage,
  onRemoveAttachment,
  uploadingAttachment,
  imageInputRef,
  className = "",
}) {
  const [actionsOpen, setActionsOpen] = React.useState(false);

  React.useEffect(() => {
    setActionsOpen(false);
  }, [selected]);

  if (!selected) {
    return (
      <section className={cn("chat-thread items-center justify-center p-6", className)}>
        <EmptyState
          bare
          icon={MessageCircle}
          title={t("chat.selectDialog")}
          description={t("chat.selectDialogHint")}
        />
      </section>
    );
  }

  const presenceLabel = supportThread
    ? t("chat.supportHours")
    : peerOnline
    ? t("chat.onlineStatus")
    : formatLastSeen(selectedPeerLastSeen, t);

  const canManageThread = !isAdmin && !supportThread;
  const myId = me?.id || me?._id;

  return (
    <section
      className={cn("chat-thread", className)}
      aria-label={t("chat.threadLabel", { name: peerName })}
    >
      <div className="chat-thread__bar">
        <IconButton
          icon={ArrowLeft}
          label={t("chat.backToDialogs")}
          variant="ghost"
          onClick={onBack}
          className="lg:hidden"
        />

        <ChatAvatar
          name={peerName}
          support={supportThread}
          online={peerOnline}
          onlineLabel={t("chat.onlineStatus")}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display font-bold text-ink-900">{peerName}</p>
            {supportThread ? <Badge tone="info">{t("chat.official")}</Badge> : null}
          </div>

          <p className="truncate text-xs text-ink-400">
            {typingPeer ? (
              <span className="font-medium text-sun-700">{t("chat.typing")}</span>
            ) : peerOnline && !supportThread ? (
              <span className="font-medium text-lagoon-700">{presenceLabel}</span>
            ) : (
              presenceLabel
            )}
          </p>
        </div>

        {supportThread ? (
          <Button to="/profile" size="sm" className="hidden shrink-0 sm:inline-flex">
            {t("chat.helpCenter")}
          </Button>
        ) : !isAdmin ? (
          <Button
            size="sm"
            icon={Phone}
            onClick={onRevealPhone}
            className="hidden shrink-0 sm:inline-flex"
          >
            {phoneVisible && phoneNumber ? phoneNumber : t("chat.showPhone")}
          </Button>
        ) : null}

        {canManageThread ? (
          <IconButton
            icon={MoreHorizontal}
            label={t("chat.moreActions")}
            variant="ghost"
            onClick={() => setActionsOpen(true)}
          />
        ) : null}
      </div>

      {supportThread ? null : (
        <ChatListingHeader listing={listing} selected={selected} t={t} />
      )}

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={t("chat.messageLog")}
        aria-busy={threadLoading || undefined}
        className="chat-log"
      >
        {threadLoading ? (
          <ThreadSkeleton />
        ) : thread.length === 0 ? (
          <div className="py-4">
            {supportThread ? (
              <EmptyState
                bare
                icon={Shield}
                title={t("chat.premiumConsultTitle")}
                description={t("chat.premiumConsultDesc")}
              />
            ) : (
              <EmptyState
                bare
                icon={MessageSquarePlus}
                title={t("chat.noMessagesTitle")}
                description={t("chat.noMessagesHint")}
              />
            )}

            <Alert tone="info" live={false} icon={Shield} className="mx-auto max-w-md">
              {supportThread ? t("chat.supportSafety") : t("chat.securityHint")}
            </Alert>
          </div>
        ) : (
          groupedThread.map((entry) => {
            if (entry.type === "day") {
              return (
                <div key={entry.id} className="flex justify-center py-1.5">
                  <span className="chat-day">{entry.label}</span>
                </div>
              );
            }

            if (entry.type === "new") {
              return (
                <div key={entry.id} className="flex items-center gap-3 py-1.5">
                  <span className="h-px flex-1 bg-sun-200" />
                  <span className="text-2xs font-bold uppercase tracking-[0.12em] text-sun-700">
                    {t("chat.newMessages")}
                  </span>
                  <span className="h-px flex-1 bg-sun-200" />
                </div>
              );
            }

            const msg = entry.data;

            return (
              <ChatMessageBubble
                key={entry.id}
                msg={msg}
                mine={String(msg.senderId) === String(myId)}
                t={t}
              />
            );
          })
        )}

        {typingPeer && !threadLoading && thread.length > 0 ? (
          <div className="flex justify-start">
            <div className="chat-bubble chat-bubble--peer flex gap-1.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
              <span className="sr-only">{t("chat.typing")}</span>
            </div>
          </div>
        ) : null}
      </div>

      {isAdmin ? (
        <p className="shrink-0 border-t border-ink-200 bg-white px-4 py-3 text-sm text-ink-400">
          {t("chat.adminReadOnly")}
        </p>
      ) : (
        <ChatComposer
          t={t}
          text={text}
          onTextChange={onTextChange}
          onSend={onSend}
          sending={sending}
          quickReplies={quickReplies}
          pendingAttachment={pendingAttachment}
          onPickImage={onPickImage}
          onRemoveAttachment={onRemoveAttachment}
          uploadingAttachment={uploadingAttachment}
          imageInputRef={imageInputRef}
          onGrow={onComposerGrow}
        />
      )}

      {canManageThread ? (
        <ChatActionsSheet
          open={actionsOpen}
          onClose={() => setActionsOpen(false)}
          onAction={onAction}
          threadSettings={threadSettings}
          t={t}
        />
      ) : null}
    </section>
  );
}
