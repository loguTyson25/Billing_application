# ============================================================
# PIXOUS HARDWARE — Dockerfile
# Stage 1: Build Angular app
# Stage 2: Serve with nginx
# ============================================================

# ── Stage 1: Node build ──────────────────────────────────────
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy all source files
COPY . .

# Build Angular for production
RUN npm run build -- --configuration production

# ── Stage 2: nginx serve ─────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular files from Stage 1
COPY --from=builder /app/dist/pixous-billing /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
