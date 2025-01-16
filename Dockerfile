##################################################
## "build" stage
##################################################

FROM docker.io/node:22.0.0-bookworm@sha256:cbd62dc7ba7e50d01520f2c0a8d9853ec872187fa806ed61d0f87081c220386d AS build

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV NITRO_PRESET=node-server

RUN corepack enable

WORKDIR /src/

COPY ./package.json ./pnpm-lock.yaml /src/
COPY ./prisma/ /src/prisma/

RUN --mount=type=cache,id=pnpm,dst=/pnpm/store/ \
	pnpm install --frozen-lockfile

COPY ./ /src/

RUN --mount=type=cache,id=pnpm,dst=/pnpm/store/ \
	pnpm run lint build

##################################################
## "main" stage
##################################################

FROM gcr.io/distroless/cc-debian12:nonroot@sha256:6970a2b2cb07c68f3e15d1b5d2ba857e53da911d5d321f48a842d6b0d26984cf AS main

COPY --from=build --chown=0:0 /usr/local/bin/node /node
COPY --from=build --chown=0:0 /src/.output/ /app/

WORKDIR /app/

HEALTHCHECK --start-period=60s --interval=30s --timeout=10s --retries=2 \
	CMD ["/node", "/app/bin/healthcheck.mjs"]

ENTRYPOINT ["/node", "/app/server/index.mjs"]
CMD []
