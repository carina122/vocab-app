# --- WordBox backend microservice ---
FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

ENV PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O- http://localhost:4000/healthz || exit 1

USER node
CMD ["node", "src/server.js"]
