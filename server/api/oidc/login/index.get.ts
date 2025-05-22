import { createError, defineEventHandler, getValidatedQuery, sendRedirect, setCookie } from "h3";
import { z } from "zod/v4";

import { logger } from "~~/server/utils/logger";

const querySchema = z.object({
  redirect: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const { oidc } = event.context;

  let redirectUrl;
  try {
    const query = await getValidatedQuery(event, (query) => querySchema.parse(query));
    redirectUrl = new URL(query.redirect ?? "/", oidc.rootUrl);
    if (redirectUrl.origin !== oidc.rootUrl.origin) {
      throw new Error("Redirect URL must be within the same origin");
    }
  } catch (error) {
    logger.error(error, "Login request validation error");
    throw createError({
      status: 400,
    });
  }

  const codeVerifier = oidc.generateCodeVerifier();
  const state = oidc.generateState({ redirect: redirectUrl });
  const nonce = oidc.generateNonce();
  const authorizationUrl = await oidc.createAuthorizationUrl(codeVerifier, state, nonce);

  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !import.meta.dev,
    partitioned: !import.meta.dev,
  };

  setCookie(event, oidc.codeVerifierCookieName, codeVerifier, cookieOptions);
  setCookie(event, oidc.stateCookieName, state, cookieOptions);
  setCookie(event, oidc.nonceCookieName, nonce, cookieOptions);

  return sendRedirect(event, authorizationUrl.toString());
});
