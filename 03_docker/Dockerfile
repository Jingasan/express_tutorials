#============================================================
# ビルド環境
#============================================================
FROM node:20-alpine as builder

# Node APIサーバーのビルド
COPY node /node
WORKDIR /node
RUN npm install
RUN npm run build


#============================================================
# 製品環境
#============================================================
FROM gcr.io/distroless/nodejs20-debian11:nonroot as releaser
USER nonroot

# Node APIサーバーのインストール
COPY --from=builder /node/dist /node/dist
COPY --from=builder /node/node_modules /node/node_modules
CMD ["/node/dist/index.mjs"]