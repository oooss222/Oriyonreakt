import React from "react";
import { Shield } from "lucide-react";
import { Avatar, cn } from "../../ui";

export default function ChatAvatar({
  name,
  imageUrl,
  support = false,
  size = "md",
  online = false,
  onlineLabel,
}) {
  const small = size === "sm";

  return (
    <span className="relative inline-flex shrink-0">
      {support ? (
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl bg-lagoon-500 text-white",
            small ? "h-9 w-9" : "h-11 w-11"
          )}
        >
          <Shield size={small ? 15 : 18} strokeWidth={2.2} aria-hidden="true" />
        </span>
      ) : (
        <Avatar name={name} src={imageUrl} size={small ? "sm" : "md"} />
      )}

      {online ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-lagoon-500"
          title={onlineLabel}
        />
      ) : null}
    </span>
  );
}
