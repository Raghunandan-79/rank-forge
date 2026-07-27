FROM oven/bun:1.3-alpine AS base
WORKDIR /usr/src/app

# Install openssl for Prisma Client
RUN apk add --no-cache openssl

# Copy root configuration and lockfiles
COPY package.json bun.lock ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy database schema and generate Prisma Client
COPY packages/db ./packages/db
WORKDIR /usr/src/app/packages/db
RUN bun x prisma generate

# Copy API package code
WORKDIR /usr/src/app
COPY apps/api ./apps/api

# Expose backend API port
EXPOSE 8000

# Run API Express server
WORKDIR /usr/src/app/apps/api
CMD ["bun", "run", "src/index.ts"]
