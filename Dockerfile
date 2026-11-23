# Bot Airi's Corner untuk Hugging Face Spaces (Docker SDK) atau mana-mana host Docker
FROM node:20-slim

# ffmpeg untuk klip & sticker; ca-certificates untuk HTTPS
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Hugging Face Spaces guna port 7860 secara lalai
ENV PORT=7860
EXPOSE 7860

CMD ["node", "index.js"]
