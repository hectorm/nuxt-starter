##################################################
## "build" stage
##################################################

FROM docker.io/node:22.16.0-bookworm@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716 AS build

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV NITRO_PRESET=node_cluster
ENV PRISMA_DATABASE_URL=postgresql://localhost:5432/app
ENV PRISMA_SHADOW_DATABASE_URL=postgresql://localhost:5432/app_shadow

RUN npm install --global corepack@latest
RUN corepack enable

WORKDIR /src/

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml /src/
COPY ./prisma/ /src/prisma/

RUN --mount=type=cache,id=pnpm,dst=/pnpm/store/ \
	pnpm install --frozen-lockfile

COPY ./ /src/

RUN --network=none --mount=type=cache,id=pnpm,dst=/pnpm/store/ \
	pnpm run lint build

##################################################
## "main" stage
##################################################

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:a3c413a866ff27d0ae9e8555fd7c29991799aba085d1d7eb3348acac171a1752 AS main

COPY --from=build --chown=0:0 /usr/local/bin/node /node
COPY --from=build --chown=0:0 /src/.output/ /app/

WORKDIR /app/

HEALTHCHECK --start-period=60s --interval=30s --timeout=10s --retries=2 \
	CMD ["/node", "/app/bin/healthcheck.mjs"]

ENTRYPOINT ["/node", "--no-experimental-require-module", "/app/server/index.mjs"]
CMD []
