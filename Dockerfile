##################################################
## "build" stage
##################################################

FROM docker.io/node:22.15.0-bookworm@sha256:a1f1274dadd49738bcd4cf552af43354bb781a7e9e3bc984cfeedc55aba2ddd8 AS build

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

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:3c62069321a46fd2fe1072fa2dff4c41deef3055be9de8a80e51bd8354ef893c AS main

COPY --from=build --chown=0:0 /usr/local/bin/node /node
COPY --from=build --chown=0:0 /src/.output/ /app/

WORKDIR /app/

HEALTHCHECK --start-period=60s --interval=30s --timeout=10s --retries=2 \
	CMD ["/node", "/app/bin/healthcheck.mjs"]

ENTRYPOINT ["/node", "--no-experimental-require-module", "/app/server/index.mjs"]
CMD []
