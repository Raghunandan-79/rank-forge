FROM oven/bun:1.3-alpine AS base

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# Copy entire monorepo
COPY . .

# Install exactly from committed lockfile
RUN bun install --frozen-lockfile

# Generate Prisma Client
WORKDIR /usr/src/app/packages/db
RUN bun x prisma generate

# API
WORKDIR /usr/src/app/apps/api

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]
