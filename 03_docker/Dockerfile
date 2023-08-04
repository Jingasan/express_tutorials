##### Build environment #####
FROM node:20-alpine as builder

# Express APIサーバーのビルド
COPY express /express
WORKDIR /express
RUN npm install
RUN npm run build


##### Production environment #####
FROM gcr.io/distroless/nodejs20-debian11:nonroot as releaser
USER nonroot

# Express APIサーバーのインストール
COPY --from=builder /express/dist /express/dist
CMD ["/express/dist/index.js"]