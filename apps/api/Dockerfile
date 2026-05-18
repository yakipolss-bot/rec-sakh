FROM node:22-alpine AS build
ARG BUILD_ID=unknown
RUN echo "Building with ID: $BUILD_ID"
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api/ .
RUN npx prisma generate
RUN npm run build && ls -la dist/

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache tini
COPY apps/api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN npx prisma generate && ls -la dist/
EXPOSE 4000
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/main.js"]
