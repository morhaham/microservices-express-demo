FROM node:23-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=user-events --prod /prod/user-events
RUN pnpm deploy --filter=user-analytics --prod /prod/user-analytics

FROM base AS user-events
COPY --from=build /prod/user-events /prod/user-events
WORKDIR /prod/user-events
EXPOSE 8000
CMD [ "pnpm", "start" ]

FROM base AS user-analytics
COPY --from=build /prod/user-analytics /prod/user-analytics
WORKDIR /prod/user-analytics
EXPOSE 8001
CMD [ "pnpm", "start" ]