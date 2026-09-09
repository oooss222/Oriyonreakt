/** Join class names, dropping falsy values. */
export function cn(...values) {
  let out = "";

  for (const value of values) {
    if (!value) continue;
    out = out ? `${out} ${value}` : value;
  }

  return out;
}

export default cn;
