# ETAPA 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
ARG EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
ARG EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
ARG EXPO_PUBLIC_AUTH0_DOMAIN
ARG EXPO_PUBLIC_AUTH0_CLIENT_ID
ARG EXPO_PUBLIC_AUTH0_AUDIENCE

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID \
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID \
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=$EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID \
    EXPO_PUBLIC_AUTH0_DOMAIN=$EXPO_PUBLIC_AUTH0_DOMAIN \
    EXPO_PUBLIC_AUTH0_CLIENT_ID=$EXPO_PUBLIC_AUTH0_CLIENT_ID \
    EXPO_PUBLIC_AUTH0_AUDIENCE=$EXPO_PUBLIC_AUTH0_AUDIENCE

COPY package*.json ./
RUN npm install

COPY . .
# expo-cli global está deprecado desde SDK 50; npx usa el local de node_modules
RUN npx expo export -p web

# ETAPA 2: Runner (Nginx)
FROM nginx:alpine AS runner

RUN rm -rf /etc/nginx/conf.d/*

# Copiar la configuración personalizada para SPA (Rutas de React)
COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /etc/nginx/html
COPY --from=builder /app/dist .

RUN chown -R nginx:nginx /etc/nginx/html && \
    chmod -R 755 /etc/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]