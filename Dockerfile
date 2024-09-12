FROM node:18-alpine

# 安裝 pnpm 和 PostgreSQL 客戶端庫
RUN apk add --no-cache postgresql-dev
RUN npm install -g pnpm

WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 嘗試使用 frozen-lockfile，如果失敗則不使用
RUN pnpm install --frozen-lockfile || pnpm install

# 複製源代碼
COPY . .

# 再次運行安裝以確保所有依賴都已安裝
RUN pnpm install
RUN pnpm run build

EXPOSE 3001
# ENV PORT=5002
CMD ["pnpm", "start"]