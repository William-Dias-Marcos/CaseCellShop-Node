# Stage 1: Build (Ambiente de compilação)
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production (Imagem final leve e segura)
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
# Instala apenas dependências de produção
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# Prática de segurança: usar usuário não-root nativo do Node
USER node

EXPOSE 3000
CMD ["npm", "start"]