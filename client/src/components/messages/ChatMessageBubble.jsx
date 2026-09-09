import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "../../ui";
import { formatMessageTime } from "../../lib/messagesUtils";
import { resolveMediaUrl } from "../../lib/media";

export default function ChatMessageBubble({ msg, mine, t }) {
  const attachment = msg.attachmentUrl
    ? resolveMediaUrl(msg.attachmentUrl, { placeholder: "" })
    : "";

  const deliveryLabel = msg.isRead ? t("chat.read") : t("chat.delivered");

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn("chat-bubble", mine ? "chat-bubble--mine" : "chat-bubble--peer")}>
        {attachment ? (
          <a
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1.5 block overflow-hidden rounded-xl"
          >
            <img
              src={attachment}
              alt={t("chat.imageMessage")}
              loading="lazy"
              decoding="async"
              className="max-h-64 w-full bg-mist-200 object-cover"
            />
          </a>
        ) : null}

        {msg.text ? <p className="whitespace-pre-wrap">{msg.text}</p> : null}

        <p className="chat-bubble__meta">
          <time dateTime={msg.createdAt || undefined}>
            {formatMessageTime(msg.createdAt)}
          </time>

          {mine ? (
            <span className="inline-flex" title={deliveryLabel}>
              {msg.isRead === true ? (
                <CheckCheck size={13} aria-hidden="true" />
              ) : (
                <Check size={13} aria-hidden="true" />
              )}
              <span className="sr-only">{deliveryLabel}</span>
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
