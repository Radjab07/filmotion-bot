# Используем готовый официальный образ Node.js
FROM node:20-slim

# Устанавливаем системные зависимости для работы Google Chrome в Linux
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libsq3-0 \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /usr/src/app

# Копируем зависимости
COPY package*.json ./

# Устанавливаем npm пакеты
RUN npm install

# Копируем весь исходный код
COPY . .

# Открываем порт для отображения QR-кода
EXPOSE 10000

# Указываем переменную окружения для Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=10000

# Запускаем бота
CMD ["node", "index.js"]
