import React from "react";
import {
  Archive,
  ArchiveRestore,
  Ban,
  Bell,
  BellOff,
  Flag,
  MailOpen,
} from "lucide-react";
import { Modal, cn } from "../../ui";

export default function ChatActionsSheet({ open, onClose, onAction, threadSettings, t }) {
  const archived = Boolean(threadSettings?.isArchived);
  const muted = Boolean(threadSettings?.isMuted);

  const actions = [
    {
      key: archived ? "unarchive" : "archive",
      label: archived ? t("chat.actionUnarchive") : t("chat.actionArchive"),
      icon: archived ? ArchiveRestore : Archive,
    },
    { key: "unread", label: t("chat.actionUnread"), icon: MailOpen },
    {
      key: muted ? "unmute" : "mute",
      label: muted ? t("chat.actionUnmute") : t("chat.actionMute"),
      icon: muted ? Bell : BellOff,
    },
    { key: "report", label: t("chat.actionReport"), icon: Flag },
    { key: "block", label: t("chat.actionBlock"), icon: Ban, danger: true },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("chat.actionsTitle")}
      size="sm"
    >
      <ul className="space-y-0.5">
        {actions.map(({ key, label, icon: Icon, danger }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAction(key);
              }}
              className={cn(
                "flex min-h-[2.75rem] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors",
                danger
                  ? "text-danger-700 hover:bg-danger-50"
                  : "text-ink-800 hover:bg-mist-100"
              )}
            >
              <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
