import { appendHeader, createError, defineEventHandler, getRequestHeader, getRequestURL, sendRedirect } from "h3";

import { logger } from "~~/server/utils/logger";

// OpenID Connect RP-Initiated Logout 1.0 endpoint
// See: https://openid.net/specs/openid-connect-rpinitiated-1_0.html
export default defineEventHandler(async (event) => {
  const { lucia, oidc, session } = event.context;

  const reqUrl = getRequestURL(event, { xForwardedProto: true, xForwardedHost: true });
  const reqOrigin = getRequestHeader(event, "origin") ?? getRequestHeader(event, "referer");
  if (!reqOrigin || new URL(reqOrigin).origin !== reqUrl.origin) {
    logger.error(reqOrigin, "Invalid origin in logout request");
    throw createError({
      statusCode: 400,
    });
  }

  if (!session) {
    throw createError({
      statusCode: 401,
    });
  }

  await lucia.invalidateSession(session.token);
  appendHeader(event, "Set-Cookie", lucia.createSessionDeleteCookie());

  const endSessionUrl = await oidc.createEndSessionUrl(session.idToken);
  const redirectUrl = endSessionUrl ?? oidc.rootUrl;

  return sendRedirect(event, redirectUrl.toString());
});
