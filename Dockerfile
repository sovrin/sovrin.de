FROM node:24-alpine AS build
WORKDIR /app

# aequitas' built dist/, passed by docker-compose as the `aequitas` build context.
COPY --from=aequitas . /aequitas/dist
ENV AEQUITAS_DIST=/aequitas/dist

COPY package.json package-lock.json* ./
RUN npm install


COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
