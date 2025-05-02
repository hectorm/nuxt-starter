import { Buffer } from "node:buffer";

import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

export interface LuciaOptions {
  cookieName: string;
  maxAge: number;
}

export type LuciaSession = Prisma.Result<
  Lucia["prisma"]["session"],
  { select: Lucia["sessionSelect"] },
  "findUniqueOrThrow"
>;

export type LuciaSessionValidationResult = {
  session: LuciaSession | null;
  fresh: boolean;
};

export class Lucia {
  /*
   * Based on Lucia (https://lucia-auth.com)
   */

  public prisma: PrismaClient;

  public cookieName: string;
  public maxAge: number;

  public permissionSelect = Prisma.validator<Prisma.RoleSelect>()({
    id: true,
    name: true,
  });

  public roleSelect = Prisma.validator<Prisma.RoleSelect>()({
    id: true,
    name: true,
    permissions: {
      select: { permission: { select: this.permissionSelect } },
    },
  });

  public userSelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    username: true,
    fullname: true,
    email: true,
    roles: {
      select: { role: { select: this.roleSelect } },
    },
  });

  public sessionSelect = Prisma.validator<Prisma.SessionSelect>()({
    id: true,
    token: true,
    sid: true,
    idToken: true,
    expiresAt: true,
    user: {
      select: this.userSelect,
    },
  });

  constructor(prisma: PrismaClient, options: LuciaOptions) {
    this.prisma = prisma;
    this.cookieName = options.cookieName;
    this.maxAge = options.maxAge;
  }

  public generateSessionToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString("base64url");
  }

  public async createSession(userId: string, sid?: string | null, idToken?: string | null): Promise<LuciaSession> {
    return this.prisma.session.create({
      data: {
        token: this.generateSessionToken(),
        userId,
        sid,
        idToken,
        expiresAt: new Date(Date.now() + this.maxAge * 1000),
      },
      select: this.sessionSelect,
    });
  }

  public async validateSession(token: string): Promise<LuciaSessionValidationResult> {
    const session = await this.prisma.session.findUnique({
      where: { token },
      select: this.sessionSelect,
    });
    if (!session) {
      return { session: null, fresh: false };
    }
    if (Date.now() >= session.expiresAt.getTime()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return { session: null, fresh: false };
    }
    let fresh = false;
    if (Date.now() >= session.expiresAt.getTime() - (this.maxAge / 2) * 1000) {
      session.expiresAt = new Date(Date.now() + this.maxAge * 1000);
      await this.prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: session.expiresAt },
      });
      fresh = true;
    }
    return { session, fresh };
  }

  public async invalidateSession(token: string): Promise<void> {
    await this.prisma.session.delete({ where: { token } });
  }

  public async invalidateAllSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId: userId } });
  }

  public createSessionCookie(token: string, expiresAt: Date): string {
    let cookie = `${this.cookieName}=${token}; Path=/; Expires=${expiresAt.toUTCString()}; HttpOnly; SameSite=Lax`;
    if (!import.meta.dev) cookie += "; Secure; Partitioned";
    return cookie;
  }

  public createSessionDeleteCookie(): string {
    let cookie = `${this.cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
    if (!import.meta.dev) cookie += "; Secure; Partitioned";
    return cookie;
  }
}
