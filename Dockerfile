##################################################
## "build" stage
##################################################

FROM docker.io/node:22.16.0-bookworm@sha256:0b5b940c21ab03353de9042f9166c75bcfc53c4cd0508c7fd88576646adbf875 AS build

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

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:20111f02d53c645d42d68fc2be1c82f471f3b6377063fada1643ef06182214b9 AS main

COPY --from=build --chown=0:0 /usr/local/bin/node /node
COPY --from=build --chown=0:0 /src/.output/ /app/

WORKDIR /app/

HEALTHCHECK --start-period=60s --interval=30s --timeout=10s --retries=2 \
	CMD ["/node", "/app/bin/healthcheck.mjs"]

ENTRYPOINT ["/node", "--no-experimental-require-module", "/app/server/index.mjs"]
CMD []
