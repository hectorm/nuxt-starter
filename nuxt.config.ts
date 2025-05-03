import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

import { defineNuxtConfig } from "nuxt/config";

import pkg from "./package.json";

export default defineNuxtConfig({
  modules: [
    "@nuxt/devtools",
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxt/icon",
    "@nuxt/fonts",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  compatibilityDate: "2025-04-29",
  future: {
    compatibilityVersion: 4,
  },
  experimental: {
    enforceModuleCompatibility: true,
  },
  runtimeConfig: {
    public: {
      appName: pkg.name,
      appVersion: pkg.version,
    },
    auth: {
      lucia: {
        cookieName: "session",
        maxAge: 2592000, // 30 days
      },
      oidc: {
        rootUrl: "http://localhost:3000",
        clientId: undefined,
        clientSecret: undefined,
        codeVerifierCookieName: "oidc_code_verifier",
        stateCookieName: "oidc_state",
        nonceCookieName: "oidc_nonce",
        issuer: undefined,
        authorizationEndpoint: undefined,
        tokenEndpoint: undefined,
        userInfoEndpoint: undefined,
        endSessionEndpoint: undefined,
        jwksUri: undefined,
        enforceHttps: true,
        scopes: "openid profile email",
        prompt: "select_account",
        usernameAttributePath: "preferred_username || email",
        fullnameAttributePath: "name || preferred_username",
        emailAttributePath: "email",
        rolesAttributePath: "type(roles) == 'array' && (contains(roles, 'admin') && 'admin' || 'user')",
        groupsAttributePath: "type(groups) == 'array' && (groups || `[]`)",
        allowedPath: "email_verified == `true`",
      },
    },
    logLevel: "info",
  },
  routeRules: {
    "/**": {
      headers: {
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
        ].join("; "),
      },
    },
  },
  nitro: {
    experimental: {
      tasks: true,
      wasm: true,
    },
    tasks: {
      "db:migrate": { description: "Run database migrations" },
      "db:seed": { description: "Run database seeding" },
      "auth:session-reaper": { description: "Reap expired sessions" },
    },
    scheduledTasks: {
      "? */10 * * *": ["auth:session-reaper"],
    },
    compressPublicAssets: true,
  },
  imports: {
    autoImport: false,
    dirs: [],
  },
  components: {
    dirs: [],
  },
  css: ["~/assets/css/main.css"],
  build: {
    transpile: ["trpc-nuxt"],
  },
  hooks: {
    "nitro:build:public-assets": async (nitro) => {
      // Copy bin directory to the output directory
      const binInDir = path.join(__dirname, "bin");
      const binOutDir = path.join(nitro.options.output.dir, "bin");
      await fs.cp(binInDir, binOutDir, { recursive: true });

      // Copy Prisma schema and migrations to the output directory
      const prismaInDir = path.join(__dirname, "prisma");
      const prismaOutDir = path.join(nitro.options.output.dir, "prisma");
      await fs.cp(prismaInDir, prismaOutDir, { recursive: true });

      // Copy Prisma client to the output directory
      const prismaClientPkgUrl = import.meta.resolve("@prisma/client/package.json");
      const prismaClientInDir = path.join(url.fileURLToPath(prismaClientPkgUrl), "..", "..", "..", ".prisma", "client");
      const prismaClientOutDir = path.join(nitro.options.output.serverDir, "node_modules", ".prisma", "client");
      await fs.cp(prismaClientInDir, prismaClientOutDir, { recursive: true });

      // Copy Prisma engines to the output directory
      const prismaEnginesPkgUrl = import.meta.resolve("@prisma/engines/package.json");
      const prismaEnginesInDir = path.join(url.fileURLToPath(prismaEnginesPkgUrl), "..");
      const prismaEnginesOutDir = path.join(nitro.options.output.serverDir, "node_modules", "@prisma", "engines");
      await fs.cp(prismaEnginesInDir, prismaEnginesOutDir, { recursive: true });
    },
  },
  i18n: {
    lazy: true,
    langDir: "locales",
    defaultLocale: "en",
    locales: [
      {
        name: "English",
        code: "en",
        language: "en-US",
        file: "en-US.ts",
        dir: "ltr",
      },
      {
        name: "Español",
        code: "es",
        language: "es-ES",
        file: "es-ES.ts",
        dir: "ltr",
      },
    ],
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_locale",
      alwaysRedirect: true,
      fallbackLocale: "en",
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },
  colorMode: {
    storage: "localStorage",
    storageKey: "color_mode",
    preference: "system",
    fallback: "dark",
  },
  icon: {
    serverBundle: {
      collections: ["lucide", "simple-icons"],
    },
  },
  fonts: {
    provider: "local",
  },
  vueuse: {
    autoImports: false,
  },
  devtools: {
    enabled: true,
  },
  telemetry: false,
});
