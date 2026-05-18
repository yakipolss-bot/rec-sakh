FROM node:22-alpine AS builder
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci
COPY apps/api/ .
RUN npx prisma generate
RUN npm run build 2>&1 || (echo "BUILD FAILED" && exit 1)

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache tini
COPY apps/api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
RUN ls -la dist/ && echo "--- BUILD SUCCESS ---"
EXPOSE 4000
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/main.js"]
