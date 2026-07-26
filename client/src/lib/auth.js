export const TOKEN_KEY = "auth_token";
export const USER_KEY = "auth_user";

export function goToAuth(nav, returnTo) {
  const path =
    returnTo ||
    `${window.location.pathname}${window.location.search}`;

  if (path && path !== "/auth") {
    nav(`/auth?returnTo=${encodeURIComponent(path)}`);
    return;
  }

  nav("/auth");
}
