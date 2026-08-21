import React from "react";
import { Building2, Shield } from "lucide-react";
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
      ? "w-10 h-10 text-xs"
      : "w-12 h-12 text-sm";

  const content = support ? (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white grid place-items-center shrink-0 shadow-sm`}
    >
      {support ? <Shield size={size === "lg" ? 18 : 16} /> : <Building2 size={16} />}
    </div>
  ) : imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className={`${sizeClass} rounded-full object-cover bg-mist shrink-0`}
    />
  ) : (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${avatarColorFromName(
        name
      )} text-white font-bold grid place-items-center shrink-0 shadow-sm`}
    >
      {getPeerInitials(name)}
    </div>
  );

  return (
    <div className="relative shrink-0">
      {content}
      {online ? (
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      ) : null}
    </div>
  );
}
