import { appendResponseHeader, defineEventHandler, getCookie, getRequestHeader, getRequestURL } from "h3";
import { useRuntimeConfig } from "nitropack/runtime/config";

import type { LuciaSession } from "~~/server/utils/lucia";
import { Lucia } from "~~/server/utils/lucia";
import { OIDC } from "~~/server/utils/oidc";
import { prisma } from "~~/server/utils/prisma";

const config = useRuntimeConfig();

const authenticatedPaths: string[] = ["/api/oidc/", "/api/trpc/"];

let lucia: Lucia;
let oidc: OIDC;

declare module "h3" {
  interface H3EventContext {
    lucia: Lucia;
    oidc: OIDC;
    session: LuciaSession | null;
  }
}

export default defineEventHandler(async (event) => {
  lucia ??= new Lucia(prisma, config.auth.lucia);
  event.context.lucia = lucia;

  oidc ??= new OIDC(config.auth.oidc);
  event.context.oidc = oidc;

  if (!authenticatedPaths.some((path) => event.path.startsWith(path))) {
    return;
  }

  if (event.method !== "GET" && event.method !== "HEAD") {
    const reqUrl = getRequestURL(event, { xForwardedProto: true, xForwardedHost: true });
    const reqOrigin = getRequestHeader(event, "origin") ?? getRequestHeader(event, "referer");
    if (!reqOrigin || new URL(reqOrigin).origin !== reqUrl.origin) {
      return;
    }
  }

  const token = getCookie(event, lucia.cookieName);
  if (!token) {
    event.context.session = null;
  } else {
    const { session, fresh } = await lucia.validateSession(token);
    if (!session) {
      appendResponseHeader(event, "Set-Cookie", lucia.createSessionDeleteCookie());
    } else if (fresh) {
      appendResponseHeader(event, "Set-Cookie", lucia.createSessionCookie(session.token, session.expiresAt));
    }
    event.context.session = session;
  }
});
