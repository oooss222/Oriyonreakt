import React from "react";
import { Shield } from "lucide-react";
import { avatarColorFromName, getPeerInitials } from "../../lib/messagesUtils";

export default function ChatAvatar({
  name,
  imageUrl,
  support = false,
  size = "md",
  online = false,
}) {
  const sizeClass =
    size === "lg"
      ? "w-11 h-11 text-sm"
      : size === "sm"
      ? "w-9 h-9 text-xs"
      : "w-11 h-11 text-sm";

  const content = support ? (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br from-lagoon to-lagoon-700 text-white grid place-items-center shrink-0 shadow-soft ring-2 ring-white`}
    >
      <Shield size={size === "lg" ? 18 : 15} strokeWidth={2.25} />
    </div>
  ) : imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className={`${sizeClass} rounded-2xl object-cover bg-mist shrink-0 ring-2 ring-white shadow-soft`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br ${avatarColorFromName(
        name
      )} text-white font-bold grid place-items-center shrink-0 shadow-soft ring-2 ring-white`}
    >
      {getPeerInitials(name)}
    </div>
  );

  return (
    <div className="relative shrink-0">
      {content}
      {online ? (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-lagoon border-2 border-white shadow-sm" />
      ) : null}
    </div>
  );
}
