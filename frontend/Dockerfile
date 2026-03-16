FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci || npm install

COPY . .

# Vite 在构建时注入环境变量，通过 build-arg 传入
ARG VITE_TURNSTILE_SITE_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Docker 部署：前端由独立 nginx 提供，用 base /；本地 Django 集成用 /static/frontend/
RUN npx vite build --outDir dist --base /

FROM nginx:alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

