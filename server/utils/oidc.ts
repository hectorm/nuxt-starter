import type { JWTPayload } from "jose";
import type { AuthorizationServer, Client, ClientAuth, HttpRequestOptions, IDToken } from "oauth4webapi";
import jmespath from "jmespath";
import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  allowInsecureRequests,
  authorizationCodeGrantRequest,
  calculatePKCECodeChallenge,
  ClientSecretPost,
  generateRandomCodeVerifier,
  generateRandomNonce,
  getValidatedIdTokenClaims,
  processAuthorizationCodeResponse,
  processRefreshTokenResponse,
  processUserInfoResponse,
  refreshTokenGrantRequest,
  userInfoRequest,
  validateAuthResponse,
} from "oauth4webapi";

import { logger } from "~~/server/utils/logger";

export interface OIDCOptions {
  rootUrl: string;
  clientId: string;
  clientSecret: string;
  codeVerifierCookieName: string;
  stateCookieName: string;
  nonceCookieName: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  jwksUri: string;
  enforceHttps?: boolean;
  scopes: string;
  prompt: string;
  usernameAttributePath: string;
  fullnameAttributePath: string;
  emailAttributePath: string;
  rolesAttributePath: string;
  allowedPath: string;
}

export interface OIDCTokens {
  idToken: string;
  idTokenClaims: IDToken & { sid?: string };
  accessToken: string;
  accessTokenExpiresAt?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
}

export interface OIDCUserProfile {
  preferred_username: string;
  name: string;
  email: string;
  roles: string[];
}

export class OIDC {
  public rootUrl: URL;

  public codeVerifierCookieName: string;
  public stateCookieName: string;
  public nonceCookieName: string;

  public client: Client;
  public clientAuth: ClientAuth;
  public as: AuthorizationServer;

  public scopes: string;
  public prompt: string;

  public usernameAttributePath: string;
  public fullnameAttributePath: string;
  public emailAttributePath: string;
  public rolesAttributePath: string;
  public allowedPath: string;

  public httpRequestOptions: HttpRequestOptions<unknown, unknown>;

  constructor(options: OIDCOptions) {
    this.rootUrl = new URL(options.rootUrl);

    this.codeVerifierCookieName = options.codeVerifierCookieName;
    this.stateCookieName = options.stateCookieName;
    this.nonceCookieName = options.nonceCookieName;

    this.client = {
      client_id: options.clientId,
      token_endpoint_auth_method: "client_secret_basic",
    };
    this.clientAuth = ClientSecretPost(options.clientSecret);
    this.as = {
      issuer: options.issuer,
      authorization_endpoint: options.authorizationEndpoint,
      token_endpoint: options.tokenEndpoint,
      userinfo_endpoint: options.userInfoEndpoint,
      end_session_endpoint: options.endSessionEndpoint,
      jwks_uri: options.jwksUri,
    };

    this.scopes = options.scopes;
    this.prompt = options.prompt;

    this.usernameAttributePath = options.usernameAttributePath;
    this.fullnameAttributePath = options.fullnameAttributePath;
    this.emailAttributePath = options.emailAttributePath;
    this.rolesAttributePath = options.rolesAttributePath;
    this.allowedPath = options.allowedPath;

    this.httpRequestOptions = {
      [allowInsecureRequests]: options.enforceHttps === false,
    };
  }

  get redirectUri(): string {
    return new URL("/api/oidc/login/callback", this.rootUrl).toString();
  }

  public async createAuthorizationUrl(codeVerifier: string, state: string, nonce: string): Promise<URL> {
    const url = new URL(this.as.authorization_endpoint!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.client.client_id);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("scope", this.scopes);
    url.searchParams.set("prompt", this.prompt);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", await calculatePKCECodeChallenge(codeVerifier));
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", nonce);
    return url;
  }

  public async validateAuthorizationCallback(
    callbackUrl: URL,
    codeVerifier: string,
    state: string,
    nonce: string,
  ): Promise<OIDCTokens> {
    const params = validateAuthResponse(this.as, this.client, callbackUrl, state);

    const response = await authorizationCodeGrantRequest(
      this.as,
      this.client,
      this.clientAuth,
      params,
      this.redirectUri,
      codeVerifier,
      this.httpRequestOptions,
    );

    const result = await processAuthorizationCodeResponse(this.as, this.client, response, {
      expectedNonce: nonce,
      requireIdToken: true,
    });

    const tokens: OIDCTokens = {
      idToken: result.id_token!,
      idTokenClaims: getValidatedIdTokenClaims(result)!,
      accessToken: result.access_token,
      accessTokenExpiresAt: this.expiresAt(result.expires_in),
      refreshToken: result.refresh_token ?? null,
      refreshTokenExpiresAt: this.expiresAt(result.refresh_expires_in),
    };

    return tokens;
  }

  public async refreshAccessToken(refreshToken: string): Promise<Omit<OIDCTokens, "idToken" | "idTokenClaims">> {
    const response = await refreshTokenGrantRequest(
      this.as,
      this.client,
      this.clientAuth,
      refreshToken,
      this.httpRequestOptions,
    );

    const result = await processRefreshTokenResponse(this.as, this.client, response);

    const tokens = {
      accessToken: result.access_token,
      accessTokenExpiresAt: this.expiresAt(result.expires_in),
      refreshToken: result.refresh_token ?? null,
      refreshTokenExpiresAt: this.expiresAt(result.refresh_expires_in),
    };

    return tokens;
  }

  public async getUserProfile(idTokenClaims: IDToken, accessToken: string): Promise<OIDCUserProfile | null> {
    const profile: Partial<OIDCUserProfile> = {};

    if (jmespath.search(idTokenClaims, this.allowedPath) === true) {
      profile.preferred_username = jmespath.search(idTokenClaims, this.usernameAttributePath) || null;
      profile.name = jmespath.search(idTokenClaims, this.fullnameAttributePath) || null;
      profile.email = jmespath.search(idTokenClaims, this.emailAttributePath) || null;
      profile.roles = jmespath.search(idTokenClaims, this.rolesAttributePath) || null;
    } else {
      logger.debug(idTokenClaims, "ID token do not match the allowed path");
    }

    if (Object.keys(profile).length === 0 || Object.values(profile).some((x) => x == null)) {
      if (this.as.userinfo_endpoint) {
        const userInfoResponse = await userInfoRequest(this.as, this.client, accessToken, this.httpRequestOptions);
        const userInfo = await processUserInfoResponse(this.as, this.client, idTokenClaims.sub, userInfoResponse);

        if (jmespath.search(userInfo, this.allowedPath) === true) {
          profile.preferred_username ??= jmespath.search(userInfo, this.usernameAttributePath) || null;
          profile.name ??= jmespath.search(userInfo, this.fullnameAttributePath) || null;
          profile.email ??= jmespath.search(userInfo, this.emailAttributePath) || null;
          profile.roles ??= jmespath.search(userInfo, this.rolesAttributePath) || null;
        } else {
          logger.debug(userInfo, "UserInfo response do not match the allowed path");
        }

        if (Object.keys(profile).length === 0 || Object.values(profile).some((x) => x == null)) {
          logger.debug(profile, "User profile is incomplete");
          return null;
        }
      } else {
        logger.debug(profile, "User profile is incomplete and no UserInfo endpoint is configured");
        return null;
      }
    }

    if (typeof profile.roles === "string") {
      profile.roles = [profile.roles];
    }

    return profile as OIDCUserProfile;
  }

  public async createEndSessionUrl(idToken?: string | null): Promise<URL | null> {
    if (!this.as.end_session_endpoint) {
      return null;
    }

    const url = new URL(this.as.end_session_endpoint);
    url.searchParams.set("client_id", this.client.client_id);
    url.searchParams.set("post_logout_redirect_uri", this.rootUrl.toString());
    if (idToken) url.searchParams.set("id_token_hint", idToken);
    return url;
  }

  public async validateBackchannelLogoutToken(logoutToken: string): Promise<JWTPayload> {
    const JWKS = createRemoteJWKSet(new URL(this.as.jwks_uri!));
    const { payload } = await jwtVerify(logoutToken, JWKS, {
      issuer: this.as.issuer,
      audience: this.client.client_id,
      maxTokenAge: "2 minutes",
      // TODO: Keycloak uses a too generic type, revisit this later
      // See: https://github.com/keycloak/keycloak/issues/19220
      // typ: "logout+jwt",
    });

    if (!payload.sid && !payload.sub) {
      throw new Error("Logout token must contain either sub claim or sid claim, or both");
    }

    if (!(payload.events as Record<string, unknown>)?.["http://schemas.openid.net/event/backchannel-logout"]) {
      throw new Error("Logout token must contain events claim with correct schema");
    }

    if (payload.nonce) {
      throw new Error("Logout token must not contain nonce claim");
    }

    return payload;
  }

  public generateCodeVerifier(): string {
    return generateRandomCodeVerifier();
  }

  public generateState(data?: Record<string, unknown>): string {
    const bytes = crypto.getRandomValues(new Uint32Array(4));
    crypto.getRandomValues(bytes);
    const state = [data, ...bytes];
    return btoa(JSON.stringify(state)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  public parseState(state: string): Record<string, unknown> | null {
    const decoded = JSON.parse(atob(state.replace(/-/g, "+").replace(/_/g, "/")));
    return Array.isArray(decoded) && decoded.length > 0 ? decoded[0] : null;
  }

  public generateNonce(): string {
    return generateRandomNonce();
  }

  private expiresAt(expiresIn: unknown): Date | null {
    return typeof expiresIn === "number" ? new Date(Date.now() + expiresIn * 1000) : null;
  }
}
