import { appendHeader, createError, defineEventHandler, getCookie, getRequestURL, sendRedirect } from "h3";

import type { Prisma } from "~~/prisma/generated/prisma/client";
import type { OIDCUserProfile } from "~~/server/utils/oidc";
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

  let profile: OIDCUserProfile | null;
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
      /*
       * Create or update user
       */

      let user: Prisma.UserGetPayload<{ select: { id: true } }>;

      const data: Prisma.UserCreateInput = {
        username: profile.preferred_username,
        fullname: profile.name,
        email: profile.email,
      };

      const existingAccount = await tx.account.findUnique({
        where: { iss_sub: { iss: tokens.idTokenClaims.iss, sub: tokens.idTokenClaims.sub } },
        select: { userId: true },
      });
      if (existingAccount) {
        logger.debug(profile, `Updating existing user`);
        user = await tx.user.update({
          where: { id: existingAccount.userId },
          select: { id: true },
          data,
        });
      } else {
        data.accounts = {
          create: { iss: tokens.idTokenClaims.iss, sub: tokens.idTokenClaims.sub },
        };

        const existingUser = await tx.user.findFirst({
          where: { email: profile.email },
          select: { id: true },
        });
        if (existingUser) {
          logger.debug(profile, `Updating existing user with new account`);
          user = await tx.user.update({
            where: { id: existingUser.id },
            select: { id: true },
            data,
          });
        } else {
          logger.debug(profile, `Creating new user`);
          user = await tx.user.create({
            select: { id: true },
            data,
          });
        }
      }

      /*
       * Update user roles
       */

      if (profile.roles != null) {
        const [oldRoles, newRoles] = await Promise.all([
          tx.role.findMany({
            where: { users: { some: { userId: user.id } } },
            select: { id: true, name: true },
          }),
          tx.role.findMany({
            where: { name: { in: profile.roles } },
            select: { id: true, name: true },
          }),
        ]);

        const oldRoleIds = new Set(oldRoles.map((role) => role.id));
        const newRoleIds = new Set(newRoles.map((role) => role.id));

        const rolesToRemove = oldRoles.filter((role) => !newRoleIds.has(role.id));
        const rolesToAdd = newRoles.filter((role) => !oldRoleIds.has(role.id));

        if (logger.isLevelEnabled("debug")) {
          if (rolesToRemove.length > 0) {
            const rolesToRemoveNames = rolesToRemove.map(({ name }) => name);
            logger.debug(`Removing user ${data.username} from roles: ${rolesToRemoveNames.join(", ")}`);
          }
          if (rolesToAdd.length > 0) {
            const rolesToAddNames = rolesToAdd.map(({ name }) => name);
            logger.debug(`Adding user ${data.username} to roles: ${rolesToAddNames.join(", ")}`);
          }
        }

        if (rolesToRemove.length > 0 || rolesToAdd.length > 0) {
          await tx.user.update({
            where: { id: user.id },
            select: { id: true },
            data: {
              roles: {
                deleteMany: { OR: rolesToRemove.map(({ id }) => ({ roleId: id })) },
                createMany: { data: rolesToAdd.map(({ id }) => ({ roleId: id })) },
              },
            },
          });
        }
      }

      /*
       * Update user groups
       */

      if (profile.groups != null) {
        const [oldGroups, newGroups] = await Promise.all([
          tx.group.findMany({
            where: { users: { some: { userId: user.id } } },
            select: { id: true, name: true },
          }),
          tx.group.findMany({
            where: { name: { in: profile.groups } },
            select: { id: true, name: true },
          }),
        ]);

        if (profile.groups.length !== newGroups.length) {
          const groupsToCreateNames = profile.groups.filter((name) => !newGroups.some((g) => g.name === name));
          if (logger.isLevelEnabled("debug")) {
            logger.debug(`Creating missing groups: ${groupsToCreateNames.join(", ")}`);
          }
          newGroups.push(
            ...(await tx.group.createManyAndReturn({
              select: { id: true, name: true },
              data: groupsToCreateNames.map((name) => ({ name })),
            })),
          );
        }

        const oldGroupIds = new Set(oldGroups.map((role) => role.id));
        const newGroupIds = new Set(newGroups.map((role) => role.id));

        const groupsToRemove = oldGroups.filter((group) => !newGroupIds.has(group.id));
        const groupsToAdd = newGroups.filter((group) => !oldGroupIds.has(group.id));

        if (logger.isLevelEnabled("debug")) {
          if (groupsToRemove.length > 0) {
            const groupsToRemoveNames = groupsToRemove.map(({ name }) => name);
            logger.debug(`Removing user ${data.username} from groups: ${groupsToRemoveNames.join(", ")}`);
          }
          if (groupsToAdd.length > 0) {
            const groupsToAddNames = groupsToAdd.map(({ name }) => name);
            logger.debug(`Adding user ${data.username} to groups: ${groupsToAddNames.join(", ")}`);
          }
        }

        if (groupsToRemove.length > 0 || groupsToAdd.length > 0) {
          await tx.user.update({
            where: { id: user.id },
            select: { id: true },
            data: {
              groups: {
                deleteMany: { OR: groupsToRemove.map(({ id }) => ({ groupId: id })) },
                createMany: { data: groupsToAdd.map(({ id }) => ({ groupId: id })) },
              },
            },
          });
        }
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
