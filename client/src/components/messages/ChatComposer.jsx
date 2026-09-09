import React from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { Button, Chip, IconButton } from "../../ui";

export default function ChatComposer({
  t,
  text,
  onTextChange,
  onSend,
  sending,
  quickReplies,
  pendingAttachment,
  onPickImage,
  onRemoveAttachment,
  uploadingAttachment,
  imageInputRef,
  onGrow,
}) {
  const textareaRef = React.useRef(null);
  const inputId = React.useId();

  React.useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;

    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;

    // The list shrinks as the composer grows, so it has to be re-pinned.
    onGrow?.();
  }, [text, onGrow]);

  const busy = sending || uploadingAttachment;
  const canSend = Boolean(text.trim() || pendingAttachment?.url) && !busy;
  const showQuickReplies = !text.trim() && !pendingAttachment;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;
    onSend();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <form className="chat-composer" onSubmit={handleSubmit}>
      {showQuickReplies && quickReplies.length > 0 ? (
        <div
          role="group"
          aria-label={t("chat.quickReplies")}
          className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 scrollbar-none sm:-mx-4 sm:px-4"
        >
          {quickReplies.map((reply) => (
            <Chip key={reply} onClick={() => onSend(reply)} disabled={busy} className="text-xs">
              {reply}
            </Chip>
          ))}
        </div>
      ) : null}

      {pendingAttachment ? (
        <div className="surface-muted flex items-center gap-3 p-2">
          <img
            src={pendingAttachment.preview}
            alt=""
            className="h-14 w-14 rounded-xl bg-mist-200 object-cover"
          />
          <p className="min-w-0 flex-1 text-sm text-ink-500">
            {uploadingAttachment ? t("chat.uploading") : t("chat.attachImage")}
          </p>
          <IconButton
            icon={X}
            label={t("chat.removeAttachment")}
            size="sm"
            onClick={onRemoveAttachment}
          />
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

        <IconButton
          icon={ImageIcon}
          label={t("chat.attachImage")}
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingAttachment}
          className="h-11 w-11"
        />

        <label htmlFor={inputId} className="sr-only">
          {t("chat.messageInputLabel")}
        </label>
        <textarea
          id={inputId}
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={t("chat.placeholder")}
          className="input chat-composer__input flex-1"
        />

        <Button
          type="submit"
          variant="primary"
          icon={Send}
          loading={sending}
          disabled={!canSend}
          aria-label={t("chat.send")}
          title={t("chat.send")}
          className="h-11 w-11"
        />
      </div>

      <p className="hidden text-2xs text-ink-400 lg:block">{t("chat.sendHint")}</p>
    </form>
  );
}
