FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf