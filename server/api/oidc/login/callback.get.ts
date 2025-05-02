import { appendHeader, createError, defineEventHandler, getCookie, getRequestURL, sendRedirect } from "h3";

import { logger } from "~~/server/utils/logger";
import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const { lucia, oidc } = event.context;

  const codeVerifier = getCookie(event, oidc.codeVerifierCookieName);
  const state = getCookie(event, oidc.stateCookieName);
  const nonce = getCookie(event, oidc.nonceCookieName);
  if (!codeVerifier || !state || !nonce) {
    logger.error("Missing cookies in authorization callback request");
    throw createError({
      status: 400,
    });
  }

  let tokens;
  try {
    const callbackUrl = getRequestURL(event);
    tokens = await oidc.validateAuthorizationCallback(callbackUrl, codeVerifier, state, nonce);
  } catch (error) {
    logger.error(error, "Authorization code validation error");
    throw createError({
      status: 400,
    });
  }

  // We currently support only one OIDC provider at a time, but this may be expanded in the future.
  if (tokens.idTokenClaims.iss !== oidc.as.issuer) {
    logger.error(`Unexpected issuer ${tokens.idTokenClaims.iss} in claims`);
    throw createError({
      status: 403,
    });
  }

  let profile;
  try {
    profile = await oidc.getUserProfile(tokens.idTokenClaims, tokens.accessToken);
  } catch (error) {
    logger.error(error, "User profile retrieval error");
    throw createError({
      status: 500,
    });
  }

  if (!profile) {
    logger.error("User profile is empty");
    throw createError({
      status: 403,
    });
  }

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      let user;
      const data = {
        username: profile.preferred_username,
        fullname: profile.name,
        email: profile.email,
      };

      const existingAccount = await tx.account.findFirst({
        where: { iss: tokens.idTokenClaims.iss, sub: tokens.idTokenClaims.sub },
        select: { userId: true },
      });
      if (existingAccount) {
        logger.debug(profile, `Updating existing user`);
        user = await tx.user.update({
          where: { id: existingAccount.userId },
          data,
        });
      } else {
        const existingUser = await tx.user.findFirst({
          where: { email: profile.email },
          select: { id: true },
        });
        if (existingUser) {
          logger.debug(profile, `Updating existing user with new account`);
          user = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              ...data,
              accounts: {
                create: { iss: tokens.idTokenClaims.iss, sub: tokens.idTokenClaims.sub },
              },
            },
          });
        } else {
          logger.debug(profile, `Creating new user`);
          user = await tx.user.create({
            data: {
              ...data,
              accounts: {
                create: { iss: tokens.idTokenClaims.iss, sub: tokens.idTokenClaims.sub },
              },
            },
          });
        }
      }

      const existingRoles = (
        await tx.rolesOnUsers.findMany({
          where: { userId: user.id },
          select: { role: { select: { name: true } } },
        })
      ).map(({ role }) => role.name);

      const rolesToDelete = existingRoles.filter((name) => !profile.roles.includes(name));
      if (rolesToDelete.length > 0) {
        logger.debug(`Deleting roles from user ${user.username}: ${rolesToDelete.join(", ")}`);
        await tx.rolesOnUsers.deleteMany({
          where: {
            role: { name: { in: rolesToDelete } },
            userId: user.id,
          },
        });
      }

      const rolesToCreate = profile.roles.filter((name) => !existingRoles.includes(name));
      if (rolesToCreate.length > 0) {
        logger.debug(`Adding roles to user ${user.username}: ${rolesToCreate.join(", ")}`);
        await tx.user.update({
          where: { id: user.id },
          data: {
            roles: {
              create: rolesToCreate.map((name) => ({
                role: { connect: { name } },
              })),
            },
          },
        });
      }

      return user;
    });
  } catch (error) {
    logger.error(error, "Error creating or updating user in database");
    throw createError({
      status: 500,
    });
  }

  const session = await lucia.createSession(user.id, tokens.idTokenClaims.sid, tokens.idToken);
  appendHeader(event, "Set-Cookie", lucia.createSessionCookie(session.token, session.expiresAt));

  const parsedState = oidc.parseState(state);
  const redirectUrl = new URL((parsedState?.redirect as string) ?? "/", oidc.rootUrl);

  return sendRedirect(event, redirectUrl.toString());
});
