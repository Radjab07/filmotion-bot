const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ⚙️ НАСТРОЙКИ: Номер менеджера WhatsApp (без знака +, с кодом страны, например: 77051110511)
const MANAGER_PHONE = '77051110511';

let currentQR = null;
let isAuthenticated = false;

// Поиск пути к установленному Chrome на сервере Render / Linux / Docker
let chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
if (!chromePath) {
    const possiblePaths = [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/opt/render/.cache/puppeteer/chrome/linux-146.0.7680.31/chrome-linux64/chrome'
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            chromePath = p;
            break;
        }
    }
}

// Инициализация WhatsApp клиента с обходом зависания загрузки (Remote Web Version Cache)
const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1014111620-alpha.html'
    },
    puppeteer: {
        executablePath: chromePath,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-component-update'
        ]
    }
});

// Хранилище сессий пользователей
const userSessions = {};

// ГЕНЕРАЦИЯ QR
client.on('qr', (qr) => {
    currentQR = qr;
    isAuthenticated = false;
    console.log('\n🔄 Новый QR-код сгенерирован!');
    console.log(`👉 Откройте в браузере: http://localhost:${PORT}\n`);
});

client.on('authenticated', () => {
    isAuthenticated = true;
    currentQR = null;
    console.log('🔑 Авторизация прошла успешно!');
});

client.on('ready', () => {
    console.log('\n==================================================');
    console.log('✅ WhatsApp Бот Filmotion успешно запущен (Первоначальная версия)!');
    console.log('==================================================\n');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Ошибка авторизации:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Клиент был отключен:', reason);
});

// ВЕБ-СТРАНИЦА С ЧЕТКИМ QR-КОДОМ
app.get('/', async (req, res) => {
    if (isAuthenticated) {
        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #2e7d32;">✅ WhatsApp Бот успешно подключен!</h1>
                <p style="font-size: 18px;">Бот готов и принимает сообщения.</p>
            </div>
        `);
    }

    if (!currentQR) {
        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h2>⏳ Генерируем QR-код...</h2>
                <p>Обновите страницу через 3-5 секунд.</p>
                <script>setTimeout(() => location.reload(), 3000);</script>
            </div>
        `);
    }

    try {
        const qrImage = await QRCode.toDataURL(currentQR);
        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 30px;">
                <h1 style="color: #111;">🤖 Подключение WhatsApp Бота Filmotion</h1>
                <p style="font-size: 18px; color: #555;">Отсканируйте этот QR-код через телефон:<br><b>WhatsApp ➔ Настройки ➔ Связанные устройства ➔ Привязать устройство</b></p>
                <div style="margin: 20px 0;">
                    <img src="${qrImage}" style="width: 320px; height: 320px; border: 4px solid #333; padding: 10px; borderRadius: 12px;" />
                </div>
                <p style="color: #888;">Страница автоматически обновится после сканирования</p>
                <script>
                    setInterval(async () => {
                        const r = await fetch('/status');
                        const data = await r.json();
                        if (data.authenticated) location.reload();
                    }, 2000);
                </script>
            </div>
        `);
    } catch (e) {
        res.status(500).send('Ошибка генерации QR');
    }
});

app.get('/status', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

app.listen(PORT, () => {
    console.log(`🌐 Веб-сервер QR-кодов запущен на http://localhost:${PORT}`);
});

// ТЕКСТЫ СООБЩЕНИЙ
const MAIN_MENU = `👋 Вас приветствует **Filmotion (Creative Multimedia Lab)**!

Мы разрабатываем комплексные аудиовизуальные решения, сценический дизайн, интерактивные инсталляции и 3D-графику высокого уровня для выставок, форумов, презентаций и масштабных мероприятий.

Выберите интересующий вас раздел (отправьте цифру):

1️⃣ 🎭 **Сценический дизайн и медиа-оформление**
2️⃣ 💡 **Интерактивные инсталляции, VR/AR & 3D-Mapping**
3️⃣ 📊 **Мультимедийные презентации и Видеопродакшн**
4️⃣ 🌐 **3DOOH, CGI & 3D-Графика / VFX**
5️⃣ 🎪 **Оформление выставочных стендов**
6️⃣ 🛠 **Техническое сопровождение & Сетап оборудования**
7️⃣ 💼 **Портфолио и О компании**
8️⃣ 📞 **Связаться с менеджером напрямую**`;

const SERVICES = {
    '1': {
        title: 'Сценический дизайн и медиа-оформление',
        text: `🎭 **Сценический дизайн и медиа-оформление от Filmotion**

Мы создаем эффектное визуальное пространство для концертов, форумов, конференций и шоу.

**Наши решения:**
• **Разработка концепции сцены:** 3D-визуализация, архитектура и геометрия сцены.
• **Visual Content & Видеосерверы:** Генеративный и видео-контент для LED-экранов любых конфигураций.
• **Световой дизайн & Маппинг:** Синхронизация света, видео и звука в единый перформанс.

➡️ Отправьте **1**, чтобы рассчитать стоимость сценического дизайна.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '2': {
        title: 'Интерактивные инсталляции, VR/AR & 3D-Mapping',
        text: `💡 **Интерактивные технологии и 3D-Mapping**

Создаем вау-эффект и эмоциональное погружение для ваших гостей и клиентов.

**Наши направления:**
• **3D Video Mapping:** Проекции на фасады зданий, объекты, сцену или автомобили.
• **Интерактивные зоны & Инсталляции:** Сенсорные стены, кинетические объекты, реагирующие на движения гостей.
• **VR / AR решения:** Виртуальная и дополненная реальность для презентации продуктов.
• **Голограммы & Проекционные шоу:** 3D-голограммы продуктов и спикеров.

➡️ Отправьте **2**, чтобы рассчитать стоимость инсталляции или 3D-Mapping.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '3': {
        title: 'Мультимедийные презентации и Видеопродакшн',
        text: `📊 **Мультимедийные презентации & Видеопродакшн**

Помогаем брендам и компаниям презентовать продукты, отчеты и смыслы на высшем уровне.

**Наши услуги:**
• **Имиджевые & B2B презентационные ролики:** Высококлассные видео с VFX и инфографикой.
• **Корпоративные фильмы:** Истории брендов для юбилеев, инвесторов и международных форумов.
• **Интерактивные презентации:** Управление контентом с планшетов/сенсорных экранов во время выступления.

➡️ Отправьте **3**, чтобы рассчитать видеопродакшн или презентацию.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '4': {
        title: '3DOOH, CGI & 3D-Графика / VFX',
        text: `🌐 **3D-Графика, VFX и Наружная 3D-реклама (3DOOH)**

Визуальные спецэффекты, опережающие время.

**Наши услуги:**
• **3DOOH (Outdoor 3D экраны):** Создание эффекта вылетающих из угловых LED-экранов объектов (как на Times Square).
• **CGI & Motion Design:** 3D-анимация любой сложности, моделирование продуктов, VFX-эффекты.
• **Motion Capture (MoCap):** Захват движений для виртуальных персонажей и цифровых аватаров.

➡️ Отправьте **4**, чтобы рассчитать 3D/CGI проект.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '5': {
        title: 'Оформление выставочных стендов',
        text: `🎪 **Мультимедийное оформление выставочных стендов**

Делаем так, чтобы ваш стенд привлекал максимальное внимание посетителей.

**Наши услуги:**
• Застройка & медиа-интеграция под ключ (LED-экраны, бесшовные видеостены, медиа-полы).
• Интерактивные презентационные стойки и тач-столы для работы с клиентами.
• Создание уникального медиаконтента (в нашем портфолио кейсы для BI Group, Freedom, Janssen, Kaspi и др.).

➡️ Отправьте **5**, чтобы рассчитать оформление стенда.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '6': {
        title: 'Техническое сопровождение & Сетап оборудования',
        text: `🛠 **Техническое сопровождение под ключ**

Мы берем на себя полную техническую реализацию и управление медиа-системами.

**Что входит:**
• Подбор и сетап аудиовизуального оборудования (LED-экраны, проекторы, медиасерверы).
• Пуско-наладка и программирование медиасерверов (Disguise, TouchDesigner, Resolume и др.).
• Работа инженеров и медиа-операторов во время проведения вашего мероприятия.

➡️ Отправьте **6**, чтобы рассчитать технический сетап.
➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    }
};

const ABOUT_TEXT = `💼 **О компании Filmotion (Creative Multimedia Lab)**

Filmotion — мультимедийная студия полного цикла в Алматы. Мы совмещаем технологии, дизайн и режиссуру, создавая масштабные визуальные проекты мирового уровня.

📍 **Адрес:** г. Алматы, ул. Бекхожина 15А, Блок 7, Офис 4 (ЖК ART Residence)
📞 **Телефоны:** +7 (705) 111 05 11, +7 (707) 222 53 33
🌐 **Сайт:** https://filmotion.kz
✉️ **Email:** hi@filmotion.kz

➡️ Отправьте **0**, чтобы вернуться в Главное меню.`;

// Обработка входящих сообщений
client.on('message', async (msg) => {
    await handleIncomingMessage(msg);
});

// Дополнительно обрабатываем сообщения от себя для тестов
client.on('message_create', async (msg) => {
    if (msg.fromMe && msg.to === msg.from) {
        await handleIncomingMessage(msg);
    }
});

async function handleIncomingMessage(msg) {
    let chat;
    try {
        chat = await msg.getChat();
    } catch (e) {
        console.log('⚠️ Предупреждение getChat:', e.message);
    }
    if (chat && chat.isGroup) return;

    const userId = msg.from;
    const text = msg.body ? msg.body.trim() : '';
    if (!text) return;

    console.log(`📩 Получено сообщение от [${userId}]: ${text}`);

    if (!userSessions[userId]) {
        userSessions[userId] = { state: 'MAIN_MENU', data: {} };
    }

    const session = userSessions[userId];

    // Пропускаем обработку, если диалог на паузе (менеджер взял общение на себя)
    if (session.state === 'PAUSED') {
        return;
    }

    if (text === '0') {
        session.state = 'MAIN_MENU';
        session.data = {};
        await msg.reply(MAIN_MENU);
        return;
    }

    if (session.state === 'MAIN_MENU') {
        const textLower = text.toLowerCase();
        
        // Если клиент здоровается или просит меню/старт — вежливо показываем меню без предупреждений
        if (['привет', 'здравствуйте', 'добрый день', 'старт', 'start', 'меню', '0', 'hi', 'hello'].includes(textLower)) {
            await msg.reply(MAIN_MENU);
            return;
        }

        if (['1', '2', '3', '4', '5', '6'].includes(text)) {
            session.selectedCategoryKey = text;
            session.selectedCategoryTitle = SERVICES[text].title;
            await msg.reply(SERVICES[text].text);
            session.state = 'VIEWING_SERVICE';
        } else if (text === '7') {
            await msg.reply(ABOUT_TEXT);
        } else if (text === '8') {
            await msg.reply(`📞 Вы можете позвонить нам напрямую по номерам:\n+7 (705) 111 05 11\n+7 (707) 222 53 33\n\nИли напишите ваш вопрос прямо сюда, и менеджер ответит вам в ближайшее время!`);
        } else {
            // Если вместо цифры от 1 до 8 написали произвольный текст
            await msg.reply(`⚠️ Пожалуйста, отправьте **цифру от 1 до 8** из меню выше для выбора раздела.\n\n` + MAIN_MENU);
        }
        return;
    }

    if (session.state === 'VIEWING_SERVICE') {
        if (text === session.selectedCategoryKey) {
            session.state = 'SURVEY_TASK';
            await msg.reply(`✍️ **Шаг 1 из 4: Описание задачи**\n\nОпишите коротко ваш проект или мероприятие (например: *"Нужен 3D-Mapping на фасад здания к 20 сентября"* или *"Оформление сцены на корпоративный форум"*):`);
        } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(text)) {
            // Если клиент передумал и выбрал другую цифру
            session.state = 'MAIN_MENU';
            await handleIncomingMessage(msg);
        } else {
            await msg.reply(`⚠️ Для подтверждения расчета отправьте цифру **${session.selectedCategoryKey}**, либо отправьте **0** для выхода в Главное меню.`);
        }
        return;
    }

    if (session.state === 'SURVEY_TASK') {
        // Задача принимается текстом (любое описание)
        session.data.task = text;
        session.state = 'SURVEY_TIMELINE';
        await msg.reply(`📅 **Шаг 2 из 4: Сроки реализации**\n\nПожалуйста, отправьте **цифру от 1 до 4** из вариантов ниже:\n\n1️⃣ Срочно (в течение 1-2 недель)\n2️⃣ В течение 1 месяца\n3️⃣ В течение 2-3 месяцев\n4️⃣ Планируем на будущее`);
        return;
    }

    if (session.state === 'SURVEY_TIMELINE') {
        const timelines = {
            '1': 'Срочно (1-2 недели)',
            '2': 'В течение 1 месяца',
            '3': 'В течение 2-3 месяцев',
            '4': 'На будущее'
        };

        // Строгая проверка: разрешаем только цифры 1, 2, 3 или 4
        if (!timelines[text]) {
            await msg.reply(`⚠️ Пожалуйста, выберите вариант, отправив **цифру от 1 до 4**:\n\n1️⃣ Срочно (в течение 1-2 недель)\n2️⃣ В течение 1 месяца\n3️⃣ В течение 2-3 месяцев\n4️⃣ Планируем на будущее`);
            return;
        }

        session.data.timeline = timelines[text];
        session.state = 'SURVEY_BUDGET';
        await msg.reply(`💰 **Шаг 3 из 4: Бюджет**\n\nПожалуйста, отправьте **цифру от 1 до 5** из вариантов ниже:\n\n1️⃣ До 1 500 000 ₸\n2️⃣ От 1 500 000 ₸ до 3 500 000 ₸\n3️⃣ От 3 500 000 ₸ до 7 000 000 ₸\n4️⃣ Свыше 7 000 000 ₸ (Масштабный проект)\n5️⃣ Нужен расчет от менеджера`);
        return;
    }

    if (session.state === 'SURVEY_BUDGET') {
        const budgets = {
            '1': 'До 1 500 000 ₸',
            '2': '1.5M - 3.5M ₸',
            '3': '3.5M - 7.0M ₸',
            '4': 'Свыше 7.0M ₸',
            '5': 'Нужен расчет'
        };

        if (!budgets[text]) {
            await msg.reply(`⚠️ Пожалуйста, выберите вариант, отправив **цифру от 1 до 5**:\n\n1️⃣ До 1 500 000 ₸\n2️⃣ От 1 500 000 ₸ до 3 500 000 ₸\n3️⃣ От 3 500 000 ₸ до 7 000 000 ₸\n4️⃣ Свыше 7 000 000 ₸ (Масштабный проект)\n5️⃣ Нужен расчет от менеджера`);
            return;
        }

        session.data.budget = budgets[text];
        session.state = 'SURVEY_NAME';
        await msg.reply(`👤 **Шаг 4 из 5: Ваше имя**\n\nНапишите, пожалуйста, как к вам обращаться и название компании (если есть):\n*(Например: Арман, компания «Event Media»)*`);
        return;
    }

    if (session.state === 'SURVEY_NAME') {
        session.data.name = text;
        session.state = 'SURVEY_PHONE';
        await msg.reply(`📞 **Шаг 5 из 5: Ваш номер телефона для связи**\n\nУкажите ваш прямой номер телефона (WhatsApp или сотовый), чтобы менеджер мог с вами связаться и направить КП:\n*(Например: +7 707 123 45 67)*`);
        return;
    }

    if (session.state === 'SURVEY_PHONE') {
        session.data.phone = text;

        const summaryText = `✅ **Спасибо! Ваша заявка сформирована.**

📋 **Сводка по проекту:**
• **Услуга:** ${session.selectedCategoryTitle}
• **Задача:** ${session.data.task}
• **Сроки:** ${session.data.timeline}
• **Бюджет:** ${session.data.budget}
• **Имя:** ${session.data.name}
• **Телефон:** ${session.data.phone}

⏳ Наш ведущий продюсер/менеджер изучит детали и свяжется с вами в течение 15-30 минут!`;

        await msg.reply(summaryText);

        try {
            const managerJid = `${MANAGER_PHONE}@c.us`;

            // Извлекаем чистые цифры из введенного пользователем номера
            let cleanedUserPhone = session.data.phone.replace(/\D/g, '');

            let managerNotification = `🚨 *НОВАЯ ЗАЯВКА С BOT FILMOLUTION.KZ*

👤 *Клиент:* ${session.data.name}
📞 *Телефон:* ${session.data.phone}
🛠 *Услуга:* ${session.selectedCategoryTitle}
📝 *Описание:* ${session.data.task}
📅 *Сроки:* ${session.data.timeline}
💰 *Бюджет:* ${session.data.budget}`;

            if (cleanedUserPhone && cleanedUserPhone.length >= 10) {
                managerNotification += `\n\n💬 *Написать клиенту в 1 клик:* https://wa.me/${cleanedUserPhone}`;
            }

            await client.sendMessage(managerJid, managerNotification);
            console.log(`[LOG] Заявка успешно отправлена менеджеру (${MANAGER_PHONE}) с введённым номером: ${session.data.phone}`);
        } catch (err) {
            console.error('[ERROR] Ошибка отправки менеджеру:', err);
        }

        // ПЕРЕВОДИМ БОТА В РЕЖИМ ПАУЗЫ (Передача менеджеру)
        session.state = 'PAUSED';
        session.data = {};
        console.log(`[LOG] Бот временно отключен для клиента [${userId}], так как заявка передана менеджеру.`);
    }
}

client.initialize();
