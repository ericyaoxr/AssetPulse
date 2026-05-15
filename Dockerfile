FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --registry=https://registry.npmmirror.com
COPY . .
RUN npm run build

FROM node:22-alpine AS server
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY server/package.json server/package-lock.json* ./
RUN npm install --registry=https://registry.npmmirror.com
COPY server/ ./

FROM node:22-alpine
WORKDIR /app
COPY --from=server /app/node_modules ./node_modules
COPY --from=server /app/*.js ./
RUN mkdir -p /app/routes /app/middleware
COPY --from=server /app/routes ./routes
COPY --from=server /app/middleware ./middleware
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data

ENV PORT=8642
ENV DATA_DIR=/app/data
EXPOSE 8642

CMD ["node", "index.js"]
