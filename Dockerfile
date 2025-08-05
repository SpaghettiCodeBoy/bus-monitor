# ---- RUNTIME / DEV --------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# 1) Abhängigkeiten
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# 2) Quellcode
COPY . .

# 3) Ports nach außen freigeben
EXPOSE 3000 4000

# 4) Startet *concurrently* → React (3000) + server/index.js (4000)
CMD ["npm", "run", "start"]
