import React from "react";

const BOX_COUNT = 6;

export default function OtpInput({ value, onChange, disabled = false, inputRef }) {
  const boxesRef = React.useRef([]);
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, BOX_COUNT)
    .split("");

  const focusBox = (index) => {
    boxesRef.current[index]?.focus();
  };

  const emit = (nextDigits) => {
    onChange(nextDigits.slice(0, BOX_COUNT));
  };

  const handleChange = (index, raw) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];

    while (next.length < BOX_COUNT) next.push("");
    next[index] = char;

    const joined = next.join("").replace(/\s/g, "");
    emit(joined);

    if (char && index < BOX_COUNT - 1) {
      focusBox(index + 1);
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        while (next.length < BOX_COUNT) next.push("");
        next[index] = "";
        emit(next.join(""));
        return;
      }

      if (index > 0) {
        event.preventDefault();
        focusBox(index - 1);
        const next = [...digits];
        while (next.length < BOX_COUNT) next.push("");
        next[index - 1] = "";
        emit(next.join(""));
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    }

    if (event.key === "ArrowRight" && index < BOX_COUNT - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, BOX_COUNT);
    emit(pasted);

    const focusIndex = Math.min(pasted.length, BOX_COUNT - 1);
    focusBox(focusIndex);
  };

  React.useEffect(() => {
    if (inputRef) {
      inputRef.current = {
        focus: () => focusBox(Math.min(digits.length, BOX_COUNT - 1)),
      };
    }
  });

  return (
    <div className="auth-otp" onPaste={handlePaste}>
      {Array.from({ length: BOX_COUNT }).map((_, index) => (
        <input
          key={index}
          ref={(node) => {
            boxesRef.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[index] || ""}
          disabled={disabled}
          className={`auth-otp__box ${
            digits[index] ? "auth-otp__box--filled" : ""
          }`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Цифра ${index + 1} из ${BOX_COUNT}`}
        />
      ))}
    </div>
  );
}
