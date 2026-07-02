FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json prisma.config.ts ./
COPY src/ src/
COPY prisma/ prisma/
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
