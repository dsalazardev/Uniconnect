# ETAPA 1: Builder - Compilar Vite + TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifests de dependencias (root monorepo + shared + web)
COPY package.json package-lock.json ./
COPY Frontend/shared/package.json ./Frontend/shared/
COPY Frontend/Frontend-web/package.json ./Frontend/Frontend-web/

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Copiar código fuente
COPY Frontend/shared ./Frontend/shared
COPY Frontend/Frontend-web ./Frontend/Frontend-web

# Build del web
RUN cd Frontend/Frontend-web && npm run build:prod

# ETAPA 2: Runner (Nginx)
FROM nginx:alpine AS runner

RUN rm -rf /etc/nginx/conf.d/*

# Copiar configuración Nginx para SPA
COPY Frontend/Frontend-web/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/Frontend/Frontend-web/dist .

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
