FROM node:18-alpine

# 安裝 pnpm 和 PostgreSQL 客戶端庫
RUN apk add --no-cache postgresql-dev
RUN npm install -g pnpm

WORKDIR /app

# 定義構建時參數
ARG DB_HOST
ARG DB_USER
ARG DB_NAME
ARG DB_PASSWORD
ARG POSTGRES_URL
ARG DATABASE_URL
ARG OPENAI_API_KEY 

# 設置環境變數
ENV DB_HOST=$DB_HOST
ENV DB_USER=$DB_USER
ENV DB_NAME=$DB_NAME
ENV DB_PASSWORD=$DB_PASSWORD
ENV POSTGRES_URL=$POSTGRES_URL
ENV DATABASE_URL=$DATABASE_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# 複製 package.json 和 pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 嘗試使用 frozen-lockfile，如果失敗則不使用
RUN pnpm install --frozen-lockfile || pnpm install

# 複製源代碼
COPY . .

EXPOSE 3001

CMD ["pnpm", "start"]