# build stage
FROM node:22-alpine AS build
WORKDIR /app

# Build argument for API URL (CRA bakes REACT_APP_* vars at build time)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# runtime stage
FROM nginx:1.29-alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
