#--------------------------------------------------
# ビルド環境
#--------------------------------------------------
FROM node:20-alpine as builder

# Node APIサーバーのビルド
COPY backend /backend
WORKDIR /backend
RUN npm install
RUN npm run build

# フロントエンドのビルド
COPY frontend /frontend
WORKDIR /frontend
RUN npm install
RUN npm run build


#--------------------------------------------------
# 製品環境
#--------------------------------------------------
FROM gcr.io/distroless/nodejs20-debian11:nonroot as releaser
USER nonroot

# Node APIサーバーのインストール
COPY --from=builder /backend /backend
COPY --from=builder /frontend/dist /frontend
WORKDIR /backend
CMD ["/backend/dist/index.mjs"]