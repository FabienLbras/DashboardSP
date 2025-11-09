# Multi-stage build for Vite React app

# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g npm@11.6.2
# Install dependencies first (use cached layer when possible)
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the rest of the sources and build
COPY . .
RUN npm run build

# 2) Runtime stage: serve static files with nginx on port 3000
FROM nginx:1.27-alpine AS runner

# Copy custom nginx config (listens on 3000 and supports SPA routing)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
