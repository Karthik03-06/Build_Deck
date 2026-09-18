FROM node:20-alpine

WORKDIR /app

# Install system dependencies including openssl for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["node", "src/index.js"]
