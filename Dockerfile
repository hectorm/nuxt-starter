##################################################
## "build" stage
##################################################

FROM docker.io/node:24.9.0-bookworm@sha256:c54b0b6001291558f6ce3cb8b87ef086e70d581d81a9c0c8ec1fa637fa1702d5 AS build

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

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:15b189376c7556cf06fc93a8e3e2879f8555ff253b8c11a3e45dc634f0ac85c7 AS main

COPY --from=build --chown=0:0 /usr/local/bin/node /node
COPY --from=build --chown=0:0 /src/.output/ /app/

WORKDIR /app/

HEALTHCHECK --start-period=60s --interval=30s --timeout=10s --retries=2 \
	CMD ["/node", "/app/bin/healthcheck.mjs"]

ENTRYPOINT ["/node", "/app/server/index.mjs"]
CMD []
