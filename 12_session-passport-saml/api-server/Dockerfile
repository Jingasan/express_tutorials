#--------------------------------------------------
# ビルド環境
#--------------------------------------------------
FROM node:20-alpine as builder

# Node APIサーバーのビルド
COPY backend /backend
WORKDIR /backend
RUN npm install
RUN npm run build


#--------------------------------------------------
# 製品環境
#--------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian11:nonroot as releaser
USER nonroot

# Node APIサーバーのインストール
COPY --from=builder /backend /backend
WORKDIR /backend
CMD ["./dist/index.mjs"]