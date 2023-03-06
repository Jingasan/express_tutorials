##### Build environment #####
FROM node:16.19-alpine as builder

# Express APIサーバーのビルド
COPY express /express
WORKDIR /express
RUN npm install
RUN npm run build


##### Production environment #####
FROM node:16.19-alpine as releaser

# Express APIサーバーのインストール
COPY --from=builder /express /express
WORKDIR /express
ENTRYPOINT ["node", "dist/index.js"]