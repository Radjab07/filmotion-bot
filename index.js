const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// ⚙️ НАСТРОЙКИ: Номер менеджера WhatsApp (без +, например: 77051110511)
const MANAGER_PHONE = '77051110511';

let currentQR = null;
let isAuthenticated = false;
let sock = null;

// Хранилище сессий пользователей
const userSessions = {};

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
        text: `🎭 **Сценический дизайн и медиа-оформление от Filmotion**\n\nМы создаем эффектное визуальное пространство для концертов, форумов, конференций и шоу.\n\n**Наши решения:**\n• **Разработка концепции сцены:** 3D-визуализация, архитектура и геометрия сцены.\n• **Visual Content & Видеосерверы:** Генеративный и видео-контент для LED-экранов любых конфигураций.\n• **Световой дизайн & Маппинг:** Синхронизация света, видео и звука в единый перформанс.\n\n➡️ Отправьте **1**, чтобы рассчитать стоимость сценического дизайна.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '2': {
        title: 'Интерактивные инсталляции, VR/AR & 3D-Mapping',
        text: `💡 **Интерактивные технологии и 3D-Mapping**\n\nСоздаем вау-эффект и эмоциональное погружение для ваших гостей и клиентов.\n\n**Наши направления:**\n• **3D Video Mapping:** Проекции на фасады зданий, объекты, сцену или автомобили.\n• **Интерактивные зоны & Инсталляции:** Сенсорные стены, кинетические объекты, реагирующие на движения гостей.\n• **VR / AR решения:** Виртуальная и дополненная реальность для презентации продуктов.\n• **Голограммы & Проекционные шоу:** 3D-голограммы продуктов и спикеров.\n\n➡️ Отправьте **2**, чтобы рассчитать стоимость инсталляции или 3D-Mapping.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '3': {
        title: 'Мультимедийные презентации и Видеопродакшн',
        text: `📊 **Мультимедийные презентации & Видеопродакшн**\n\nПомогаем брендам и компаниям презентовать продукты, отчеты и смыслы на высшем уровне.\n\n**Наши услуги:**\n• **Имиджевые & B2B презентационные ролики:** Высококлассные видео с VFX и инфографикой.\n• **Корпоративные фильмы:** Истории брендов для юбилеев, инвесторов и международных форумов.\n• **Интерактивные презентации:** Управление контентом с планшетов/сенсорных экранов во время выступления.\n\n➡️ Отправьте **3**, чтобы рассчитать видеопродакшн или презентацию.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '4': {
        title: '3DOOH, CGI & 3D-Графика / VFX',
        text: `🌐 **3D-Графика, VFX и Наружная 3D-реклама (3DOOH)**\n\nВизуальные спецэффекты, опережающие время.\n\n**Наши услуги:**\n• **3DOOH (Outdoor 3D экраны):** Создание эффекта вылетающих из угловых LED-экранов объектов (как на Times Square).\n• **CGI & Motion Design:** 3D-анимация любой сложности, моделирование продуктов, VFX-эффекты.\n• **Motion Capture (MoCap):** Захват движений для виртуальных персонажей и цифровых аватаров.\n\n➡️ Отправьте **4**, чтобы рассчитать 3D/CGI проект.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '5': {
        title: 'Оформление выставочных стендов',
        text: `🎪 **Мультимедийное оформление выставочных стендов**\n\nДелаем так, чтобы ваш стенд привлекал максимальное внимание посетителей.\n\n**Наши услуги:**\n• Застройка & медиа-интеграция под ключ (LED-экраны, бесшовные видеостены, медиа-полы).\n• Интерактивные презентационные стойки и тач-столы для работы с клиентами.\n• Создание уникального медиаконтента (в нашем портфолио кейсы для BI Group, Freedom, Janssen, Kaspi и др.).\n\n➡️ Отправьте **5**, чтобы рассчитать оформление стенда.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    },
    '6': {
        title: 'Техническое сопровождение & Сетап оборудования',
        text: `🛠 **Техническое сопровождение под ключ**\n\nМы берем на себя полную техническую реализацию и управление медиа-системами.\n\n**Что входит:**\n• Подбор и сетап аудиовизуального оборудования (LED-экраны, проекторы, медиасерверы).\n• Пуско-наладка и программирование медиасерверов (Disguise, TouchDesigner, Resolume и др.).\n• Работа инженеров и медиа-операторов во время проведения вашего мероприятия.\n\n➡️ Отправьте **6**, чтобы рассчитать технический сетап.\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`
    }
};

const ABOUT_TEXT = `💼 **О компании Filmotion (Creative Multimedia Lab)**\n\nFilmotion — мультимедийная студия полного цикла в Алматы. Мы совмещаем технологии, дизайн и режиссуру, создавая масштабные визуальные проекты мирового уровня.\n\n📍 **Адрес:** г. Алматы, ул. Бекхожина 15А, Блок 7, Офис 4 (ЖК ART Residence)\n📞 **Телефоны:** +7 (705) 111 05 11, +7 (707) 222 53 33\n🌐 **Сайт:** https://filmotion.kz\n✉️ **Email:** hi@filmotion.kz\n\n➡️ Отправьте **0**, чтобы вернуться в Главное меню.`;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Filmotion Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr;
            isAuthenticated = false;
            console.log('🔄 Сгенерирован новый QR-код для Baileys!');
        }

        if (connection === 'open') {
            isAuthenticated = true;
            currentQR = null;
            console.log('\n==================================================');
            console.log('✅ WhatsApp Бот Filmotion на Baileys УСПЕШНО ЗАПУЩЕН!');
            console.log('==================================================\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('⚠️ Соединение закрыто. Переподключение...', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(startBot, 3000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const userId = msg.key.remoteJid;
            if (userId.endsWith('@g.us')) continue; // Игнорируем группы

            const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            if (!text) continue;

            console.log(`📩 Получено сообщение от [${userId}]: ${text}`);

            if (!userSessions[userId]) {
                userSessions[userId] = { state: 'MAIN_MENU', data: {} };
            }
            const session = userSessions[userId];

            // Если диалог на паузе
            if (session.state === 'PAUSED') continue;

            // Сброс в меню
            if (text === '0') {
                session.state = 'MAIN_MENU';
                session.data = {};
                await sock.sendMessage(userId, { text: MAIN_MENU });
                continue;
            }

            // ГЛАВНОЕ МЕНЮ
            if (session.state === 'MAIN_MENU') {
                const textLower = text.toLowerCase();
                if (['привет', 'здравствуйте', 'добрый день', 'старт', 'start', 'меню', 'hi', 'hello'].includes(textLower)) {
                    await sock.sendMessage(userId, { text: MAIN_MENU });
                    continue;
                }

                if (['1', '2', '3', '4', '5', '6'].includes(text)) {
                    session.selectedCategoryKey = text;
                    session.selectedCategoryTitle = SERVICES[text].title;
                    await sock.sendMessage(userId, { text: SERVICES[text].text });
                    session.state = 'VIEWING_SERVICE';
                } else if (text === '7') {
                    await sock.sendMessage(userId, { text: ABOUT_TEXT });
                } else if (text === '8') {
                    await sock.sendMessage(userId, { text: `📞 Вы можете позвонить нам напрямую по номерам:\n+7 (705) 111 05 11\n+7 (707) 222 53 33\n\nИли напишите ваш вопрос прямо сюда, и менеджер ответит вам в ближайшее время!` });
                } else {
                    await sock.sendMessage(userId, { text: `⚠️ Пожалуйста, отправьте **цифру от 1 до 8** из меню выше для выбора раздела.\n\n` + MAIN_MENU });
                }
                continue;
            }

            // ПРОСМОТР УСЛУГИ
            if (session.state === 'VIEWING_SERVICE') {
                if (text === session.selectedCategoryKey) {
                    session.state = 'SURVEY_TASK';
                    await sock.sendMessage(userId, { text: `✍️ **Шаг 1 из 5: Описание задачи**\n\nОпишите коротко ваш проект или мероприятие (например: *"Нужен 3D-Mapping на фасад здания к 20 сентября"* или *"Оформление сцены на корпоративный форум"*):` });
                } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(text)) {
                    session.state = 'MAIN_MENU';
                    // Рекурсивный вызов для обработки выбора
                    continue;
                } else {
                    await sock.sendMessage(userId, { text: `⚠️ Для подтверждения расчета отправьте цифру **${session.selectedCategoryKey}**, либо отправьте **0** для выхода в Главное меню.` });
                }
                continue;
            }

            // ОПРОС ШАГ 1: ЗАДАЧА
            if (session.state === 'SURVEY_TASK') {
                session.data.task = text;
                session.state = 'SURVEY_TIMELINE';
                await sock.sendMessage(userId, { text: `📅 **Шаг 2 из 5: Сроки реализации**\n\nПожалуйста, отправьте **цифру от 1 до 4** из вариантов ниже:\n\n1️⃣ Срочно (в течение 1-2 недель)\n2️⃣ В течение 1 месяца\n3️⃣ В течение 2-3 месяцев\n4️⃣ Планируем на будущее` });
                continue;
            }

            // ОПРОС ШАГ 2: СРОКИ
            if (session.state === 'SURVEY_TIMELINE') {
                const timelines = {
                    '1': 'Срочно (1-2 недели)',
                    '2': 'В течение 1 месяца',
                    '3': 'В течение 2-3 месяцев',
                    '4': 'На будущее'
                };
                if (!timelines[text]) {
                    await sock.sendMessage(userId, { text: `⚠️ Пожалуйста, выберите вариант, отправив **цифру от 1 до 4**:\n\n1️⃣ Срочно (в течение 1-2 недель)\n2️⃣ В течение 1 месяца\n3️⃣ В течение 2-3 месяцев\n4️⃣ Планируем на будущее` });
                    continue;
                }
                session.data.timeline = timelines[text];
                session.state = 'SURVEY_BUDGET';
                await sock.sendMessage(userId, { text: `💰 **Шаг 3 из 5: Бюджет**\n\nПожалуйста, отправьте **цифру от 1 до 5** из вариантов ниже:\n\n1️⃣ До 1 500 000 ₸\n2️⃣ От 1 500 000 ₸ до 3 500 000 ₸\n3️⃣ От 3 500 000 ₸ до 7 000 000 ₸\n4️⃣ Свыше 7 000 000 ₸ (Масштабный проект)\n5️⃣ Нужен расчет от менеджера` });
                continue;
            }

            // ОПРОС ШАГ 3: БЮДЖЕТ
            if (session.state === 'SURVEY_BUDGET') {
                const budgets = {
                    '1': 'До 1 500 000 ₸',
                    '2': '1.5M - 3.5M ₸',
                    '3': '3.5M - 7.0M ₸',
                    '4': 'Свыше 7.0M ₸',
                    '5': 'Нужен расчет'
                };
                if (!budgets[text]) {
                    await sock.sendMessage(userId, { text: `⚠️ Пожалуйста, выберите вариант, отправив **цифру от 1 до 5**:\n\n1️⃣ До 1 500 000 ₸\n2️⃣ От 1 500 000 ₸ до 3 500 000 ₸\n3️⃣ От 3 500 000 ₸ до 7 000 000 ₸\n4️⃣ Свыше 7 000 000 ₸ (Масштабный проект)\n5️⃣ Нужен расчет от менеджера` });
                    continue;
                }
                session.data.budget = budgets[text];
                session.state = 'SURVEY_NAME';
                await sock.sendMessage(userId, { text: `👤 **Шаг 4 из 5: Ваше имя**\n\nНапишите, пожалуйста, как к вам обращаться и название компании (если есть):\n*(Например: Арман, компания «Event Media»)*` });
                continue;
            }

            // ОПРОС ШАГ 4: ИМЯ
            if (session.state === 'SURVEY_NAME') {
                session.data.name = text;
                session.state = 'SURVEY_PHONE';
                await sock.sendMessage(userId, { text: `📞 **Шаг 5 из 5: Ваш номер телефона для связи**\n\nУкажите ваш прямой номер телефона (WhatsApp или сотовый), чтобы менеджер мог с вами связаться и направить КП:\n*(Например: +7 707 123 45 67)*` });
                continue;
            }

            // ОПРОС ШАГ 5: ТЕЛЕФОН И ФИНАЛ
            if (session.state === 'SURVEY_PHONE') {
                session.data.phone = text;

                const summaryText = `✅ **Спасибо! Ваша заявка сформирована.**\n\n📋 **Сводка по проекту:**\n• **Услуга:** ${session.selectedCategoryTitle}\n• **Задача:** ${session.data.task}\n• **Сроки:** ${session.data.timeline}\n• **Бюджет:** ${session.data.budget}\n• **Имя:** ${session.data.name}\n• **Телефон:** ${session.data.phone}\n\n⏳ Наш ведущий продюсер/менеджер изучит детали и свяжется с вами в течение 15-30 минут!`;

                await sock.sendMessage(userId, { text: summaryText });

                try {
                    const managerJid = `${MANAGER_PHONE}@s.whatsapp.net`;
                    let cleanedUserPhone = session.data.phone.replace(/\D/g, '');

                    let managerNotification = `🚨 *НОВАЯ ЗАЯВКА С BOT FILMOLUTION.KZ*\n\n👤 *Клиент:* ${session.data.name}\n📞 *Телефон:* ${session.data.phone}\n🛠 *Услуга:* ${session.selectedCategoryTitle}\n📝 *Описание:* ${session.data.task}\n📅 *Сроки:* ${session.data.timeline}\n💰 *Бюджет:* ${session.data.budget}`;

                    if (cleanedUserPhone && cleanedUserPhone.length >= 10) {
                        managerNotification += `\n\n💬 *Написать клиенту в 1 клик:* https://wa.me/${cleanedUserPhone}`;
                    }

                    await sock.sendMessage(managerJid, { text: managerNotification });
                    console.log(`[LOG] Заявка успешно отправлена менеджеру (${MANAGER_PHONE})`);
                } catch (err) {
                    console.error('[ERROR] Ошибка отправки менеджеру:', err);
                }

                session.state = 'PAUSED';
                session.data = {};
            }
        }
    });
}

// ВЕБ-СТРАНИЦА С QR-КОДОМ
app.get('/', async (req, res) => {
    if (isAuthenticated) {
        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #2e7d32;">✅ WhatsApp Бот на Baileys успешно подключен!</h1>
                <p style="font-size: 18px;">Бот работает 24/7 без зависаний.</p>
            </div>
        `);
    }

    if (!currentQR) {
        return res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                <h2>⏳ Генерируем QR-код...</h2>
                <p>Обновите страницу через 3 секунды.</p>
                <script>setTimeout(() => location.reload(), 3000);</script>
            </div>
        `);
    }

    try {
        const qrImage = await QRCode.toDataURL(currentQR);
        res.send(`
            <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 30px;">
                <h1 style="color: #111;">🤖 Подключение WhatsApp Бота (Baileys)</h1>
                <p style="font-size: 18px; color: #555;">Отсканируйте QR-код в WhatsApp (Связанные устройства):</p>
                <div style="margin: 20px 0;">
                    <img src="${qrImage}" style="width: 320px; height: 320px; border: 4px solid #333; padding: 10px; borderRadius: 12px;" />
                </div>
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
        res.status(500).send('Error');
    }
});

app.get('/status', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

app.listen(PORT, () => {
    console.log(`🌐 Веб-сервер запущен на порту ${PORT}`);
    startBot();
});
