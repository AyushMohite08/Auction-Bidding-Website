import { env } from "../config/env.js";

function cookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    path: "/",
    maxAge,
  };

  if (env.auth.cookieDomain) {
    options.domain = env.auth.cookieDomain;
  }

  return options;
}

export function readCookie(req, name) {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) return null;
  
  // the cookie header would look something like:
  // auction_access=abc123; auction_refresh=xyz789;
  // from it we split with ";", then on the array we use trim() to remove spaces from start and end for each item, then finally using the cookie name passed as argument we find that cookie.
  
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  // we return the value of cookie and not the header, so we split with "="
  // as the cookie value can also contain "=", we use slice to join back all the parts after the first "="
  // thus getting only the value of the cookie
  // example: if cookie header is "auction_access=abc=123", it would return "abc=123" and remove the cookie name from it

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  // Cross-domain browser auth requires cookies that are both HttpOnly and credentialed by CORS.
  res.cookie(env.auth.accessCookieName, accessToken, cookieOptions(env.auth.accessCookieMaxAgeMs));
  res.cookie(env.auth.refreshCookieName, refreshToken, cookieOptions(env.auth.refreshCookieMaxAgeMs));
}

export function clearAuthCookies(res) {
  res.clearCookie(env.auth.accessCookieName, cookieOptions(0));
  res.clearCookie(env.auth.refreshCookieName, cookieOptions(0));
}
