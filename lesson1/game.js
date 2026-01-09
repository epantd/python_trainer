function getStudentIdentifier() {
    const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');
    if (studentData && studentData.lastName && studentData.firstName && studentData.grade && studentData.classLetter && studentData.subgroup) {
        return `${studentData.lastName}_${studentData.firstName}_${studentData.grade}${studentData.classLetter}_${studentData.subgroup}`;
    }
    return 'anonymous';
}

const LESSON_NUMBER = 1;
// ===============================
// СИСТЕМА ОПЫТА
// ===============================
let totalExperience = 0;
let levelStartTime = null;
let levelAttempts = 0;

// Функция для обновления отображения опыта в сайдбаре
function updateExperienceDisplay() {
    let expElement = document.getElementById('experience-display');
    
    // Если элемент еще не создан, создаем его
    if (!expElement) {
        expElement = document.createElement('div');
        expElement.id = 'experience-display';
        expElement.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(52, 152, 219, 0.9);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        // Находим левый сайдбар и добавляем в него элемент опыта
        const taskSidebar = document.getElementById('task-sidebar');
        if (taskSidebar) {
            taskSidebar.appendChild(expElement);
        }
    }
    
    document.getElementById('experience-display').textContent = `Опыт: ${totalExperience}`;
}


// Функция для начала отслеживания уровня
function startLevelTracking() {
    levelStartTime = Date.now();
    levelAttempts = 0;
    console.log(`[Опыт] Начало отслеживания уровня в ${new Date(levelStartTime).toLocaleTimeString()}`);
    console.log(`[Опыт] Счетчик попыток сброшен: ${levelAttempts}`);
}

// Функция для расчета опыта при завершении уровня
function calculateExperience() {
    // ПРОВЕРЯЕМ, БЫЛ ЛИ УРОВЕНЬ УЖЕ ПРОЙДЕН ДАННЫМ УЧЕНИКОМ
    const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');

    
    // Создаем уникальный ключ для каждого ученика
    let studentIdentifier = 'anonymous';
    if (studentData && studentData.lastName && studentData.firstName && studentData.grade && studentData.classLetter && studentData.subgroup) {
        studentIdentifier = `${studentData.lastName}_${studentData.firstName}_${studentData.grade}${studentData.classLetter}_${studentData.subgroup}`;
    }
    
    const completedKey = `completed_levels_${studentIdentifier}_lesson${LESSON_NUMBER}`;
    let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
    const levelKey = `${LESSON_NUMBER}.${currentLevel}`;
    
    if (completedLevels.includes(levelKey)) {
        console.log(`[Опыт] Уровень ${currentLevel} уже пройден этим учеником, опыт не начисляется`);
        return 0; // Уровень уже пройден - опыт не начисляем
    }
    
    let earnedExp = 0;
    let reasons = [];
    
    console.log("=== РАСЧЕТ ОПЫТА ===");
    console.log(`Попыток прохождения уровня: ${levelAttempts}`);
    console.log(`Время старта уровня: ${levelStartTime ? new Date(levelStartTime).toLocaleTimeString() : 'не установлено'}`);
    
    // 1. Базовый опыт за уровень
    earnedExp += 1;
    reasons.push("+1 за завершение уровня");
    console.log("✅ +1 за завершение уровня");
    
    // 2. Бонус за малое количество попыток (≤ 4)
    console.log(`Проверка попыток: ${levelAttempts} <= 4 ? ${levelAttempts <= 4}`);
    if (levelAttempts <= 4) {
        earnedExp += 1;
        reasons.push(`+1 за малое количество попыток (${levelAttempts})`);
        console.log(`✅ +1 за малое количество попыток (${levelAttempts})`);
    } else {
        console.log(`❌ Нет бонуса за попытки (${levelAttempts} > 4)`);
    }
    
    // 3. Бонус за время (менее 3 минут)
    if (levelStartTime) {
        const timeSpent = Date.now() - levelStartTime;
        const threeMinutes = 3 * 60 * 1000; // 3 минуты в миллисекундах
        const secondsSpent = Math.floor(timeSpent / 1000);
        const minutesSpent = Math.floor(secondsSpent / 60);
        
        console.log(`Время прохождения: ${secondsSpent} сек (${minutesSpent} мин)`);
        console.log(`Проверка времени: ${timeSpent} < ${threeMinutes} ? ${timeSpent < threeMinutes}`);
        
        if (timeSpent < threeMinutes) {
            earnedExp += 1;
            reasons.push(`+1 за быстрое прохождение (${secondsSpent} сек)`);
            console.log(`✅ +1 за быстрое прохождение (${secondsSpent} сек)`);
        } else {
            console.log(`❌ Нет бонуса за время (${secondsSpent} сек > 3 мин)`);
        }
    } else {
        console.log("❌ Время старта не установлено, пропускаем проверку времени");
    }

    const lessonExpKey = `experience_lesson${LESSON_NUMBER}`;
    const currentLessonExp = parseInt(localStorage.getItem(lessonExpKey) || '0');
    const newLessonExp = currentLessonExp + earnedExp;
    localStorage.setItem(lessonExpKey, newLessonExp.toString());
    
    totalExperience += earnedExp;
    
    // Добавляем уровень в пройденные ДЛЯ ЭТОГО УЧЕНИКА
    completedLevels.push(levelKey);
    localStorage.setItem(completedKey, JSON.stringify(completedLevels));
    
    // СОХРАНЯЕМ ОПЫТ СРАЗУ ПОСЛЕ РАСЧЕТА
    setTimeout(async () => {
        await saveProgressToGoogleSheets('update');
        console.log('Опыт сохранен на сервер:', totalExperience);
    }, 100);
    
    updateExperienceDisplay();
    
    // Выводим подробный отчет в консоль
    console.log(`=== ИТОГО ===`);
    console.log(`Получено опыта: ${earnedExp}`);
    console.log(`Причины: ${reasons.join(', ')}`);
    console.log(`Общий опыт: ${totalExperience}`);
    console.log("===============");
    
    return earnedExp;
}

// --- Настройка DOM элементов ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');
const codeInput = document.getElementById('codeInput'); // <textarea>
const winModal = document.getElementById('win-modal');
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');
const lessonTitle = document.getElementById('lesson-title');
const lessonSubtitle = document.getElementById('lesson-subtitle');
const lessonText = document.getElementById('lesson-text');
const variablesDisplay = document.getElementById('variables-display');
const gameCanvas = document.getElementById('gameCanvas');
const gameMainTitle = document.getElementById('game-main-title');
const teacherCommandInput = document.getElementById('teacherCommand'); 
const outputDisplay = document.getElementById('output-display');
const taskSidebar = document.getElementById('task-sidebar');
const currentTaskDisplay = document.getElementById('current-task-display');

messageElement.style.cssText = `
    background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
    color: #333;
    padding: 15px;
    margin: 15px 0;
    border-radius: 10px;
    border-left: 5px solid #ff9800;
    box-shadow: 0 3px 10px rgba(255, 193, 7, 0.3);
    font-weight: 500;
    font-size: 16px;
`;

// Создаем элемент для отображения уровня и ошибок
const levelStatusElement = document.createElement('div');
levelStatusElement.id = 'level-status';
levelStatusElement.style.cssText = `
    background-color: #f8f9fa;
    padding: 10px 15px;
    margin-bottom: 15px;
    border-radius: 5px;
    border-left: 4px solid #3498db;
    font-size: 16px;
    font-weight: bold;
    display: none;
`;
// Добавляем его после заголовка урока
gameMainTitle.parentNode.insertBefore(levelStatusElement, gameMainTitle.nextSibling);

let allImagesLoaded = false;

// --- Загрузка изображений ---
const letterImage = new Image();
letterImage.src = '../images0/letter.png';

const playerImage = new Image();
playerImage.src = '../images0/player-main.png';

const mailboxImage = new Image();
mailboxImage.src = '../images0/mail-box.png';

const backgroundImage = new Image();
backgroundImage.src = '../images0/game-bg.png';

const game2BgImage = new Image();
game2BgImage.src = '../images0/game2-bg.png';


let imagesLoaded = {
    player: false,
    mailbox: false,
    background: false,
    letter: false,
};

imagesLoaded.game2Bg = false;
imagesLoaded.bird = false;
imagesLoaded.box = false;

letterImage.onload = function() {
    console.log("Изображение письма загружено.");
    imagesLoaded.letter = true;
};

playerImage.onload = function() {
    console.log("Изображение игрока загружено.");
    imagesLoaded.player = true;
};

mailboxImage.onload = function() {
    console.log("Изображение почтового ящика загружено.");
    imagesLoaded.mailbox = true;
};

backgroundImage.onload = function() {
    console.log("Изображение фона загружено.");
    imagesLoaded.background = true;
};

game2BgImage.onload = function() {
    console.log("Фон для Урока 3 загружен.");
    imagesLoaded.game2Bg = true;
};


// Обновляем проверку загрузки всех изображений
function checkAllImagesLoaded() {
    const allLoaded = Object.values(imagesLoaded).every(status => status === true);
    if (allLoaded) {
        console.log("Все изображения успешно загружены");
    }
}

checkAllImagesLoaded();

// ===============================
// СИСТЕМА АНИМАЦИИ ДЛЯ УРОКА 3.6-3.10
// ===============================

// Спрайт-листы для анимации (только для Урока 3)
const birdSprite = new Image();
birdSprite.src = '../images0/bird-sprite.png'; // Спрайт-лист для птицы

const boxSprite = new Image();
boxSprite.src = '../images0/box-sprite.png'; // Спрайт-лист для почтового ящика

// Константы анимации (как в файле с анимацией.js)
const TOTAL_FRAMES = 8;
const FRAME_WIDTH = 1098;
const FRAME_HEIGHT = 1098;
const FRAME_INTERVAL = 140;
const MIN_PAUSE_DURATION = 5000;
const MAX_PAUSE_DURATION = 10000;
const ANIMATION_CYCLES = 2;

const BIRD_TOTAL_FRAMES = 8;
const BOX_TOTAL_FRAMES = 14;

// Класс анимации сущности (как в файле с анимацией.js)
class EntityAnimation {
    constructor(entityType) {
        this.entityType = entityType;
        
        switch(entityType) {
            case 'bird':
                this.totalFrames = BIRD_TOTAL_FRAMES;
                break;
            case 'box':
                this.totalFrames = BOX_TOTAL_FRAMES;
                break;
            default:
                this.totalFrames = BIRD_TOTAL_FRAMES;
        }
        
        this.currentFrame = 0;
        this.state = 'idle';
        this.timer = 0;
        this.animationProgress = 0;
        this.cyclesCompleted = 0;
        this.isPlaying = false;
        
        this.nextPauseDuration = this.getRandomPauseDuration();
        this.idleTimer = Math.random() * 5000;
    }
    
    getRandomPauseDuration() {
        return MIN_PAUSE_DURATION + Math.random() * (MAX_PAUSE_DURATION - MIN_PAUSE_DURATION);
    }
    
    update(deltaTime) {
        this.timer += deltaTime;
        
        if (this.state === 'idle') {
            this.idleTimer -= deltaTime;
            
            if (this.idleTimer <= 0) {
                this.state = 'playing';
                this.currentFrame = 0;
                this.timer = 0;
                this.animationProgress = 0;
                this.cyclesCompleted = 0;
                this.isPlaying = true;
            }
        } 
        else if (this.state === 'playing') {
            if (this.timer >= FRAME_INTERVAL) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.timer = 0;
                
                if (this.currentFrame === 0) {
                    this.cyclesCompleted++;
                    
                    if (this.cyclesCompleted >= ANIMATION_CYCLES) {
                        this.state = 'idle';
                        this.isPlaying = false;
                        this.nextPauseDuration = this.getRandomPauseDuration();
                        this.idleTimer = this.nextPauseDuration;
                    }
                }
            }
            
            const totalFramesInCycle = this.totalFrames * ANIMATION_CYCLES;
            const currentFrameInAllCycles = this.cyclesCompleted * this.totalFrames + this.currentFrame;
            const frameProgress = this.timer / FRAME_INTERVAL;
            this.animationProgress = (currentFrameInAllCycles + frameProgress) / totalFramesInCycle;
        }
    }
    
    getCurrentFrame() {
        return this.currentFrame;
    }
    
    isAnimating() {
        return this.state === 'playing';
    }
    
    getAnimationProgress() {
        return this.animationProgress;
    }
}

// Глобальные переменные для анимации
let lastUpdateTime = 0;
let entityAnimations = new Map();

// Функция для получения или создания анимации для сущности
function getEntityAnimation(entityId, entityType) {
    if (!entityAnimations.has(entityId)) {
        entityAnimations.set(entityId, new EntityAnimation(entityType));
    }
    return entityAnimations.get(entityId);
}

// Функция обновления всех анимаций
function updateAnimations(currentTime) {
    if (lastUpdateTime === 0) {
        lastUpdateTime = currentTime;
        return false;
    }
    
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;
    
    const clampedDeltaTime = Math.min(deltaTime, 100);
    
    entityAnimations.forEach(animation => {
        animation.update(clampedDeltaTime);
    });
    
    return true;
}

// Функция для запуска цикла анимации
function startAnimationLoop() {
    function animate(currentTime) {
        updateAnimations(currentTime);
        
        // Перерисовываем только если мы в Уроке 3, уровнях 3.6-3.10
        if (currentPart === 3 &&
            currentLevel >= 5 && 
            currentLevel < PART_3_LEVELS.length && 
            PART_3_LEVELS[currentLevel].type === 'combined') {
            drawGamePart3Combined();
        }
        
        requestAnimationFrame(animate);
    }
    
    lastUpdateTime = 0;
    requestAnimationFrame(animate);
}

// Функция для сброса анимаций
function resetAnimations() {
    entityAnimations.clear();
}

// Обновляем обработчики загрузки изображений для спрайтов
birdSprite.onload = function() {
    console.log("Спрайт птицы загружен");
    imagesLoaded.birdSprite = true;
    checkAllImagesLoaded();
};

boxSprite.onload = function() {
    console.log("Спрайт почтового ящика загружен");
    imagesLoaded.boxSprite = true;
    checkAllImagesLoaded();
};

// Обновляем объект imagesLoaded
imagesLoaded.birdSprite = false;
imagesLoaded.boxSprite = false;

// Обновляем функцию проверки загрузки всех изображений
function checkAllImagesLoaded() {
    const allLoaded = Object.values(imagesLoaded).every(status => status === true);
    if (allLoaded) {
        console.log("Все изображения и спрайты успешно загружены");
    }
}

// === НОВАЯ СИСТЕМА СОХРАНЕНИЯ ПРОГРЕССА ===

async function saveProgressToGoogleSheets(action = 'update') {
    try {
        const studentData = JSON.parse(localStorage.getItem('currentStudent'));

        if (!studentData) {
            console.log('Нет данных ученика для сохранения');
            return true;
        }
        
        // Определяем номер урока из LESSON_NUMBER
        const lessonNumber = LESSON_NUMBER || 1;
        
        // ФОРМАТ СОХРАНЕНИЯ: "1.1", "1.2", "1.3"
        const savedPart = `1.${currentPart}`;
        
        // Получаем опыт этого урока из localStorage
        const lessonExpKey = `experience_lesson${lessonNumber}`;
        const lessonExperience = parseInt(localStorage.getItem(lessonExpKey) || '0');
        
        // ОБНОВЛЯЕМ ВСЕ ДАННЫЕ
        studentData.currentPart = savedPart;
        studentData.currentLevel = currentLevel;
        studentData.experience = totalExperience;  // ← Общий опыт
        studentData.lessonExperience = lessonExperience; // ← Опыт этого урока
        studentData.lastSave = new Date().toISOString();

        // Сохраняем в localStorage
        localStorage.setItem('currentStudent', JSON.stringify(studentData));

        // Отправляем на сервер ВСЕ ДАННЫЕ
        setTimeout(() => {
            try {
                const dataToSend = {
                    action: 'save',
                    password: 'teacher123',
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    grade: studentData.grade,
                    classLetter: studentData.classLetter,
                    subgroup: studentData.subgroup,
                    currentPart: savedPart, 
                    currentLevel: studentData.currentLevel || 0,
                    experience: totalExperience,          // ← Общий опыт
                    lessonNumber: lessonNumber,          // ← Номер урока (1, 2, 3...)
                    lessonExperience: lessonExperience,  // ← Опыт этого урока
                    lastLogin: new Date().toISOString()
                };

                fetch('https://script.google.com/macros/s/AKfycbwbuz4SQ1d35hzYqlRyBwBGuForQlFG9KJkYRHL4VCG_vK2_vfpXyRy4jV0_AWs7_2V/exec', {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend)
                });
            } catch (e) {
                console.log('Фоновое сохранение не удалось');
            }
        }, 50);

        return true;

    } catch (error) {
        console.log('Ошибка при сохранении прогресса:', error);
        return true;
    }
}

async function loadProgress() {
    try {
        const studentData = JSON.parse(localStorage.getItem('currentStudent'));

        if (studentData) {
            // Восстанавливаем опыт из данных ученика
            if (studentData.experience) {
                totalExperience = studentData.experience;
                console.log('Опыт загружен:', totalExperience);
            }

            // Проверяем, есть ли сохраненный прогресс для этого ученика
            if (studentData.currentPart && studentData.currentPart.startsWith('1.')) {
                try {
                    const savedPart = studentData.currentPart;
                    const partNumber = parseInt(savedPart.split('.')[1]);
                    
                    if (partNumber >= 1 && partNumber <= 3) {
                        currentPart = partNumber;
                        currentLevel = studentData.currentLevel || 0;
                        
                        console.log('Прогресс загружен:', {
                            savedPart: savedPart,
                            currentPart: currentPart,
                            currentLevel: currentLevel,
                            student: `${studentData.lastName} ${studentData.firstName}`
                        });
                        
                        return {
                            success: true,
                            currentPart: currentPart,
                            currentLevel: currentLevel
                        };
                    }
                } catch (e) {
                    console.log('Ошибка при парсинге сохраненной части:', e);
                }
            }
            
            console.log('Урок не совпадает или нет сохраненного уровня. Начинаем с начала.');
        } else {
            console.log('Нет данных ученика. Начинаем с начала.');
        }

        // По умолчанию начинаем с первой части
        return {
            success: true,
            currentPart: 1,
            currentLevel: 0
        };

    } catch (error) {
        console.log('Ошибка при загрузке прогресса:', error);
        return {
            success: true,
            currentPart: 1,
            currentLevel: 0
        };
    }
}

async function autoSaveProgress() {
    // Просто вызываем нашу новую функцию сохранения
    await saveProgressToGoogleSheets('update');
}

// --- Параметры Игры и Уровней ---
let currentLesson = 1; // Урок (главный уровень)
let currentPart = 1;   // Часть урока (бывший currentPart)
let currentLevel = 0;  // Уровень внутри части
const PLAYER_SIZE = 70;
const STEP_SIZE = 70;
const TEACHER_PASSWORD = 'python'; // ПАРОЛЬ ДЛЯ УЧИТЕЛЯ

// Переменные для эмуляции Python
let pythonVariables = {};
let consoleOutput = ""; // Переменная для накопления вывода print()

// Переменные для комбинированных уровней (Урок 3.6+)
let currentPassword = null;
let passwordBlockTouched = false;
let verifyBlockTouched = false;
let currentChallengeBlock = null; // Блок, с которым взаимодействует игрок

// Урок 1: Переменные, типы данных, операции присваивания и вывода (10 уровней)
const PART_1_LEVELS = [
    { 
        id: '1.1.1', 
        name: 'Уровень 1.1: Адрес отправителя', 
        checkType: 'assignment', 
        variables: { street: 'Школьная' }, 
        answer: ["street = 'Школьная'"], 
        description: "Посмотрите на письмо. Присвойте переменной <strong>street</strong> строковое значение, указанное на письме.",
        letterData: {
            type: 'sender',
            fromName: 'Иван Петров',
            fromStreet: 'Школьная',
            fromHouse: '15',
            toName: 'Мария Сидорова',
            toStreet: 'Лесная',
            toHouse: '23'
        }
    },
    { 
        id: '1.1.2', 
        name: 'Уровень 1.2: Номер дома', 
        checkType: 'assignment', 
        variables: { house_number: 27 }, 
        answer: ["house_number = 27"], 
        description: "Посмотрите на письмо. Присвойте переменной <strong>house_number</strong> целое число, указанное на письме (номер дома получателя).",
        letterData: {
            type: 'recipient',
            fromName: 'ООО "Ромашка"',
            fromStreet: 'Промышленная',
            fromHouse: '8',
            toName: 'Алексей Иванов',
            toStreet: 'Центральная',
            toHouse: '27'
        }
    },
    { 
        id: '1.1.3', 
        name: 'Уровень 1.3: Стоимость отправки', 
        checkType: 'assignment', 
        variables: { postage_price: 9.99 }, 
        answer: ["postage_price = 9.99"], 
        description: "Посмотрите на марке. Присвойте переменной <strong>postage_price</strong> число с плавающей точкой, указанное на марке.",
        letterData: {
            type: 'stamp',
            fromName: 'Петр Сергеев',
            fromStreet: 'Садовый проезд',
            fromHouse: '12А',
            toName: 'Елена Васильева',
            toStreet: 'Речной переулок',
            toHouse: '5',
            stampValue: 9.99,
            stampCode: 'RU-2024'
        }
    },
    { 
        id: '1.1.4', 
        name: 'Уровень 1.4: Регистрация письма', 
        checkType: 'assignment', 
        variables: { is_registered: 'True' }, 
        answer: ["is_registered = True"], 
        description: "Посмотрите на письмо. Присвойте переменной <strong>is_registered</strong> логическое значение, указанное на письме.",
        letterData: {
            type: 'registered',
            fromName: 'ГБОУ Школа №123',
            fromStreet: 'Образовательная',
            fromHouse: '45',
            toName: 'Департамент образования',
            toStreet: 'Административная',
            toHouse: '3',
            isRegistered: true,
            trackingNumber: 'TRK-789012'
        }
    },
    { 
        id: '1.1.5', 
        name: 'Уровень 1.5: Полный адрес', 
        checkType: 'assignment', 
        variables: { city: 'Москва', index: 123456 }, 
        answer: ["city = 'Москва'", "index = 123456"], 
        description: "Посмотрите на письмо. Присвойте значения двум разным переменным: <strong>city</strong> и <strong>index</strong> (город и индекс получателя).",
        letterData: {
            type: 'full_address',
            fromName: 'ТД "Весна"',
            fromStreet: 'Торговая площадь',
            fromHouse: '7',
            fromCity: 'Санкт-Петербург',
            fromIndex: 190000,
            toName: 'ИП "Зима"',
            toStreet: 'Промышленная зона',
            toHouse: '42',
            toCity: 'Москва',
            toIndex: 123456,
            weight: '120г'
        }
    },
    // Уровни с print() (бывшие 3.1-3.5)
    { 
        id: '1.1.6', 
        type: 'print', 
        variables: {}, 
        requiredCode: ["print('Привет, мир!')"], 
        requiredOutput: "Привет, мир!\n", 
        description: "Вы работаете на почте. Для начала рабочего дня выведите приветствие: \"Привет, мир!\" (обязательно с кавычками)." 
    },
    { 
        id: '1.1.7', 
        type: 'print', 
        variables: { num: 10 }, 
        requiredCode: ["num = 10", "print(num)"], 
        requiredOutput: "10\n", 
        description: "Присвойте переменной `num` значение 10 и выведите ее с помощью print(num)." 
    },
    { 
        id: '1.1.8', 
        type: 'print', 
        variables: { age: 15 }, 
        requiredCode: ["age = 15", "print('Мне', age, 'лет')"], 
        requiredOutput: "Мне 15 лет\n", 
        description: "Переменная `age` уже содержит число. Выведите фразу 'Мне 15 лет', используя print() с тремя аргументами через запятую." 
    },
    { 
        id: '1.1.9', 
        type: 'print', 
        variables: { a: 5, b: 10 }, 
        requiredCode: ["a = 5", "b = 10", "print('Я доставил утром', a, ', а вечером', b, 'писем')"], 
        requiredOutput: "Я доставил утром 5 , а вечером 10 писем\n", 
        description: "Переменные `a` и `b` уже содержат числа. Выведите фразу 'Я доставил утром 5, а вечером 10 писем', используя print() с несколькими аргументами через запятую." 
    },
    { 
        id: '1.1.10', 
        type: 'print', 
        variables: { name: 'Вася', count: 3 }, 
        requiredCode: ["name = 'Вася'", "count = 3", "print('У', name, count, 'письма.')"], 
        requiredOutput: "У Вася 3 письма.\n", 
        description: "Переменные `name` и `count` уже определены. Выведите фразу 'У <имя> <число> письма.', используя print() с несколькими аргументами через запятую." 
    }
];

// Урок 2: Оператор input() и Движение (10 уровней)
const PART_2_LEVELS = [
    { 
        id: '1.2.1', 
        startX: 1 * 70,  // 1-я клетка по X
        startY: 2 * 70,  // 2-я клетка по Y
        targetX: 7 * 70, // 7-я клетка по X
        targetY: 2 * 70, // 2-я клетка по Y
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Дойди до почтового ящика, используя <strong>только одну</strong> команду `move = int(input())`." 
    }, 
    { 
        id: '1.2.2', 
        startX: 1 * 70,
        startY: 1 * 70,
        targetX: 1 * 70,
        targetY: 4 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Измени направление, используя <strong>только одну</strong> команду `turn = input()`, а затем введи `move = int(input())` вручную, чтобы дойти до почтового ящика." 
    }, 
    { 
        id: '1.2.3', 
        startX: 7 * 70,
        startY: 4 * 70,
        targetX: 1 * 70,
        targetY: 4 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Чтобы дойти до почтового ящика, тебе нужно сменить направление. (move или turn)" 
    },
    { 
        id: '1.2.4', 
        startX: 1 * 70,
        startY: 4 * 70,
        targetX: 7 * 70,
        targetY: 1 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Нужно несколько команд, но вводи их <strong>по одной</strong> строке." 
    }, 
    { 
        id: '1.2.5', 
        startX: 4 * 70,
        startY: 3 * 70,
        targetX: 4 * 70,
        targetY: 1 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Почтовый ящик находится вверху. Используй команды move и turn поочередно." 
    }, 
    { 
        id: '1.2.6', 
        startX: 1 * 70,
        startY: 1 * 70,
        targetX: 7 * 70,
        targetY: 1 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Используй <strong>две строки</strong>: `turn = input()` и `move = int(input())`, чтобы достичь почтового ящика за один 'запуск кода'." 
    }, 
    { 
        id: '1.2.7', 
        startX: 7 * 70,
        startY: 1 * 70,
        targetX: 7 * 70,
        targetY: 5 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Почтовый ящик внизу. Напиши `turn = input()` (вниз) и `move = input()`." 
    }, 
    { 
        id: '1.2.8', 
        startX: 7 * 70,
        startY: 5 * 70,
        targetX: 1 * 70,
        targetY: 5 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Почтовый ящик слева. Напиши `turn = input()` (влево) и `move = input()`."
    },
    { 
        id: '1.2.9', 
        startX: 4 * 70,
        startY: 4 * 70,
        targetX: 1 * 70,
        targetY: 1 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Сначала поверни <strong>влево</strong>, сделай шаг, затем поверни <strong>вверх</strong> и сделай второй шаг, чтобы дойти до почтового ящика. (Четыре строки кода)." 
    },
    { 
        id: '1.2.10', 
        startX: 1 * 70,
        startY: 5 * 70,
        targetX: 7 * 70,
        targetY: 1 * 70,
        description: "Ты сотрудник почты, тебе нужно отнести письмо. Путь к почтовому ящику: вправо, потом вверх. Используй <strong>четыре строки</strong>." 
    }
];

// Урок 3: Ввод и вывод данных (10 уровней)
const PART_3_LEVELS = [
    // Линейные алгоритмы (бывшие 1.6-1.10)
    { 
        id: '1.3.1', 
        name: 'Уровень 3.1: Стоимость отправки', 
        checkType: 'linear_algo', 
        expectedOutput: '25\n', 
        testInputs: [
            { prompt: 'Введите цену конверта: ', input: '10' }, 
            { prompt: 'Введите цену марки: ', input: '15' }
        ], 
        description: "Рассчитайте стоимость отправки письма.<br><br><strong>Инструкция:</strong><br>1. Создай переменные с названиями, которые будут относиться к данным, которые содержатся в переменных.<br>2. Используй оператор ввода input() чтобы запросить данные на ввод.<br>3. Используй оператор print() чтобы вывести результат, используя переменные для подсчета"
    },
    { 
        id: '1.3.2', 
        name: 'Уровень 3.2: Стоимость нескольких писем', 
        checkType: 'linear_algo', 
        expectedOutput: '125\n', 
        testInputs: [
            { prompt: 'Введите стоимость одного письма: ', input: '25' }, 
            { prompt: 'Введите количество писем: ', input: '5' }
        ], 
        description: "Рассчитайте стоимость отправки нескольких писем.<br><br><strong>Инструкция:</strong><br>1. Создай переменные с названиями, которые будут относиться к данным, которые содержатся в переменных.<br>2. Используй оператор ввода input() чтобы запросить данные на ввод.<br>3. Используй оператор print() чтобы вывести результат, используя переменные для подсчета"
    },
    { 
        id: '1.3.3', 
        name: 'Уровень 3.3: Сдача при оплате', 
        checkType: 'linear_algo', 
        expectedOutput: '30\n', 
        testInputs: [
            { prompt: 'Введите стоимость отправки: ', input: '70' }, 
            { prompt: 'Введите внесенную сумму: ', input: '100' }
        ], 
        description: "Рассчитайте сдачу при оплате отправки.<br><br><strong>Инструкция:</strong><br>1. Создай переменные с названиями, которые будут относиться к данным, которые содержатся в переменных.<br>2. Используй оператор ввода input() чтобы запросить данные на ввод.<br>3. Используй оператор print() чтобы вывести результат, используя переменные для подсчета"
    },
    { 
        id: '1.3.4', 
        name: 'Уровень 3.4: Общий вес посылки', 
        checkType: 'linear_algo', 
        expectedOutput: '180\n', 
        testInputs: [
            { prompt: 'Введите вес одного письма (г): ', input: '40' }, 
            { prompt: 'Введите количество писем: ', input: '3' },
            { prompt: 'Введите вес коробки (г): ', input: '60' }
        ], 
        description: "Рассчитайте общий вес посылки.<br><br><strong>Инструкция:</strong><br>1. Создай переменные с названиями, которые будут относиться к данным, которые содержатся в переменных.<br>2. Используй оператор ввода input() чтобы запросить данные на ввод.<br>3. Используй оператор print() чтобы вывести результат, используя переменные для подсчета"
    },
    { 
        id: '1.3.5', 
        name: 'Уровень 3.5: Стоимость со скидкой', 
        checkType: 'linear_algo', 
        expectedOutput: '180\n', 
        testInputs: [
            { prompt: 'Введите начальную стоимость: ', input: '200' }, 
            { prompt: 'Введите скидку (в %): ', input: '10' }
        ], 
        description: "Рассчитайте стоимость со скидкой.<br><br><strong>Инструкция:</strong><br>1. Создай переменные с названиями, которые будут относиться к данным, которые содержатся в переменных.<br>2. Используй оператор ввода input() чтобы запросить данные на ввод.<br>3. Используй оператор print() чтобы вывести результат, используя переменные для подсчета"
    },
    // НОВЫЕ КОМБИНИРОВАННЫЕ УРОВНИ (print() + input() + movement)
    { 
        id: '1.3.6', 
        type: 'combined', 
        startX: 1 * 70,
        startY: 2 * 70,
        passwordBlock: { x: 7 * 70, y: 2 * 70, type: 'bird' },
        verifyBlock: { x: 1 * 70, y: 1 * 70, type: 'box' },
        description: "Вы - почтальон. У вас есть секретное письмо для доставки. Сначала подойдите к <strong>почтовому голубю</strong> (птица) и используйте команду `print('Какой адрес?')`, чтобы получить адрес доставки. Затем идите к <strong>почтовому ящику</strong> и используйте `print('Адрес')` для подтверждения доставки." 
    },
    { 
        id: '1.3.7', 
        type: 'combined', 
        startX: 1 * 70,
        startY: 4 * 70,
        passwordBlock: { x: 7 * 70, y: 4 * 70, type: 'bird' },
        verifyBlock: { x: 1 * 70, y: 1 * 70, type: 'box' },
        description: "Вы - почтальон с важным письмом. Подойдите к <strong>почтовому голубю</strong>, используйте `print('Какой адрес?')` для получения адреса. Затем идите к <strong>почтовому ящику</strong> и введите адрес с помощью `print('Адрес')`." 
    },
    { 
        id: '1.3.8', 
        type: 'combined', 
        startX: 1 * 70,
        startY: 1 * 70,
        passwordBlock: { x: 7 * 70, y: 1 * 70, type: 'bird' },
        verifyBlock: { x: 7 * 70, y: 4 * 70, type: 'box' },
        description: "Почтовый маршрут: сначала вправо к <strong>голубю</strong>, затем вниз к <strong>почтовому ящику</strong>. Используйте `print('Какой адрес?')` для получения адреса у голубя и `print('Адрес')` для его ввода в почтовый ящик." 
    },
    { 
        id: '1.3.9', 
        type: 'combined', 
        startX: 4 * 70,
        startY: 3 * 70,
        passwordBlock: { x: 1 * 70, y: 1 * 70, type: 'bird' },
        verifyBlock: { x: 7 * 70, y: 5 * 70, type: 'box' },
        description: "Сложный почтовый маршрут. Вам нужно изменить направление дважды. Получите адрес доставки у <strong>почтового голубя</strong> и подтвердите его в <strong>почтовом ящике</strong>. Используйте <strong>две разные команды</strong> `print('Какой адрес?')` и `print('Адрес')`." 
    },
    { 
        id: '1.3.10', 
        type: 'combined', 
        startX: 1 * 70,
        startY: 5 * 70,
        passwordBlock: { x: 7 * 70, y: 1 * 70, type: 'bird' },
        verifyBlock: { x: 1 * 70, y: 1 * 70, type: 'box' },
        description: "Финальный уровень: выполните сложный почтовый маршрут. Взаимодействуйте с <strong>почтовым голубем</strong> и <strong>почтовым ящиком</strong>, используя `print('Какой адрес?')` для получения и `print('Адрес')` для передачи адреса доставки. Команды движения: `move = int(input())` и `turn = input()`." 
    },
];

// --- Переменные состояния Игрока (для Part 2 & Combined) ---
let playerX;
let playerY;
let direction;

// --- Управление экранами ---

function updateTaskSidebar(taskText, levelId) {
    let partTitle = "";
    if (currentPart === 1) partTitle = "Урок 1.1: Переменные, типы данных, операции присваивания и вывода";
    else if (currentPart === 2) partTitle = "Урок 1.2: input() и Движение";
    else if (currentPart === 3) partTitle = "Урок 1.3: Ввод и вывод данных";
    
    document.getElementById('sidebar-title').textContent = `${partTitle} (${levelId})`;
    currentTaskDisplay.innerHTML = taskText;
    taskSidebar.style.display = 'block';
}

// Обновляем элемент статуса уровня
// В функции updateLevelStatus упрощаем логику:
function updateLevelStatus(levelName = '', message = '') {
    if (levelName || message) {
        levelStatusElement.style.display = 'block';
        let statusText = '';
        if (levelName && message) {
            statusText = `${levelName} | ${message}`;
        } else if (levelName) {
            statusText = levelName;
        } else if (message) {
            statusText = message;
        }
        levelStatusElement.textContent = statusText;
    } else {
        // Если оба параметра пустые, оставляем элемент видимым с текстом по умолчанию
        levelStatusElement.style.display = 'block';
        
        // Устанавливаем текст по умолчанию в зависимости от текущего урока
        let defaultText = '';
        if (currentPart === 1) {
            defaultText = 'Введите код программы';
        } else if (currentPart === 2) {
            defaultText = 'Введите команды движения';
        } else if (currentPart === 3) {
            defaultText = 'Введите код с input() и print()';
        }
        
        levelStatusElement.textContent = defaultText;
    }
}

// --- Обновленный текст введения для Урока 2 ---
function showIntroScreen() {
    introScreen.style.display = 'flex';
    gameContainer.style.opacity = '0'; 
    taskSidebar.style.display = 'none'; 
    levelStatusElement.style.display = 'none';
    messageElement.style.display = 'none';
    
    if (currentPart === 1) {
        lessonSubtitle.textContent = 'Урок 1.1. Переменные, типы данных, операции присваивания и вывода';
        lessonText.innerHTML = `
            <strong>Переменная</strong> — это "коробочка" для хранения данных. <strong>Оператор присваивания (=)</strong> кладет значение в эту "коробочку".<br>
            В этом уроке вы также научитесь выводить данные с помощью <strong>\`print()\`</strong>.<br><br>
            <strong>Твоя задача:</strong> Освоить присваивание и вывод данных.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 1';
        
    } else if (currentPart === 2) {
        lessonSubtitle.textContent = 'Урок 1.2. Оператор input() и Управление почтальоном';
        lessonText.innerHTML = `
            <strong>Ты - почтальон!</strong> Твоя задача - доставлять письма.<br>
            <strong>Оператор \`input()\`</strong> используется для получения данных от пользователя. Он приостанавливает выполнение и запрашивает ввод.<br><br>
            <strong>Твоя задача:</strong> Используй команды \`move = int(input())\` или \`turn = input()\` чтобы управлять почтальоном и доставить письмо в почтовый ящик.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 2';
        
    } else if (currentPart === 3) {
        lessonSubtitle.textContent = 'Урок 1.3. Ввод и вывод данных';
        lessonText.innerHTML = `
            Первые 5 уровней посвящены линейным алгоритмам с использованием \`int(input())\`. Уровни 3.6-3.10 комбинируют <strong>движение, \`print()\` и \`input()\`</strong>.<br><br>
            <strong>Твоя задача:</strong> Освоить ввод данных и создание линейных алгоритмов, а затем комбинировать различные операции.
        `;
        document.getElementById('start-game-btn').textContent = 'Начать Урок 3';
    }
    updateReferenceContent();
}

// В функции hideIntroAndStart убираем изменение отображения levelStatusElement:
window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    
    // Пытаемся загрузить сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        // Загружаем часть и уровень из сохраненного прогресса
        currentPart = savedProgress.currentPart || 1;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен:', { currentPart, currentLevel, totalExperience });
    }

    // Сброс видимости элементов
    variablesDisplay.style.display = 'none';
    gameCanvas.style.display = 'none';
    outputDisplay.style.display = 'none';
    codeInput.value = '';
    
    // Установка заголовка и видимости в зависимости от части
    if (currentPart === 1) {
        gameMainTitle.textContent = 'Урок 1.1: Переменные и вывод данных';
        codeInput.placeholder = "каждая команда с новой строки";
    } else if (currentPart === 2) {
        gameMainTitle.textContent = 'Урок 1.2: Оператор input()';
        gameCanvas.style.display = 'block';
        codeInput.placeholder = "move = int(input()) или turn = input() (можно несколько)";
    } else if (currentPart === 3) {
        gameMainTitle.textContent = 'Урок 1.3: Ввод и вывод данных';
        codeInput.placeholder = "print(...) / move = int(input()) / turn = input()";
    }
    
    startGame(currentLevel);
    
    // Сохраняем факт начала сессии
    saveProgressToGoogleSheets('login');
}

function showWinModal(isPartComplete = false) {
    // 🆕 ДОБАВЛЕНО: Расчет опыта при завершении уровня
    const earnedExp = calculateExperience();
    const expMessage = isPartComplete 
        ? `<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`
        : `<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
    
    if (isPartComplete) {
        const nextPart = currentPart + 1;
        let nextLessonText = "";
        if (nextPart === 2) nextLessonText = "Оператор input()";
        else if (nextPart === 3) nextLessonText = "Ввод и вывод данных";
        else nextLessonText = "Игра пройдена!";

        winModal.querySelector('#modal-title').textContent = "Часть пройдена!";
        winModal.querySelector('#modal-text').innerHTML = `Ты молодец! Успешно освоил текущий урок. <br> Готов к следующему уроку: <strong>${nextLessonText}</strong>?${expMessage}`;
        document.getElementById('next-level-btn').textContent = nextPart <= 3 ? `Перейти к Уроку ${nextPart}` : 'Завершить игру';
    } else {
        winModal.querySelector('#modal-title').textContent = "Уровень пройден!";
        winModal.querySelector('#modal-text').innerHTML = `Правильно! Переходим к следующей задаче.${expMessage}`;
        document.getElementById('next-level-btn').textContent = 'Следующий уровень';
    }
    document.getElementById('next-level-btn').style.display = 'inline-block'; 
    winModal.style.display = 'flex';
}

// Обновите функцию nextLevel:
window.nextLevel = async function() {
    winModal.style.display = 'none';
    
    let currentLevelList = [];
    if (currentPart === 1) currentLevelList = PART_1_LEVELS;
    else if (currentPart === 2) currentLevelList = PART_2_LEVELS;
    else if (currentPart === 3) currentLevelList = PART_3_LEVELS;
    
    if (currentLevel + 1 < currentLevelList.length) {
        currentLevel++;
        await saveProgressToGoogleSheets();
        startGame(currentLevel);
    } else {
        currentPart++;
        currentLevel = 0;
        await saveProgressToGoogleSheets();
        
        if (currentPart > 3) {
            // Все уроки завершены
            winModal.querySelector('#modal-title').textContent = "Игра пройдена!";
            winModal.querySelector('#modal-text').innerHTML = `Поздравляем! Вы прошли все уроки!<br><br>🎖️ <strong>Общий опыт: ${totalExperience}</strong>`;
            document.getElementById('next-level-btn').style.display = 'none';
            winModal.style.display = 'flex';
        } else {
            showIntroScreen();
        }
    }
    updateReferenceContent();
}

window.restartLevel = function() {
    winModal.style.display = 'none';
    startGame(currentLevel);
}

// --- Инициализация / Запуск Уровня ---

// Обновляем функцию startGame для сброса анимаций
function startGame(levelIndex) {
    startLevelTracking();
    
    variablesDisplay.style.display = 'none';
    gameCanvas.style.display = 'none';
    outputDisplay.style.display = 'none';
    outputDisplay.innerHTML = '';
    
    // Сброс анимаций только для Урока 3, уровней 3.6-3.10
    if (currentPart === 3 && levelIndex >= 5 && PART_3_LEVELS[levelIndex].type === 'combined') {
        resetAnimations();
    }
    
    levelStatusElement.style.display = 'block';
    
    if (currentPart === 1) {
        const levelData = PART_1_LEVELS[levelIndex];
        updateLevelStatus(`${levelData.id}: ${levelData.name || 'Переменные и вывод данных'}`, 'Введите код в поле ниже');
        startGamePart1(levelIndex);
        outputDisplay.innerHTML = '--- Консоль вывода (print) ---<br>';
        consoleOutput = "--- Консоль вывода (print) ---\n";
    } else if (currentPart === 2) {
        const levelData = PART_2_LEVELS[levelIndex];
        updateLevelStatus(`Уровень ${levelData.id}`, 'Введите команды движения (move = int(input()) или turn = input())');
        startGamePart2(levelIndex);
        gameCanvas.style.display = 'block';
    } else if (currentPart === 3) {
        const levelData = PART_3_LEVELS[levelIndex];
        if (levelData.checkType === 'linear_algo') {
            updateLevelStatus(`${levelData.id}: ${levelData.name || 'Ввод и вывод данных'}`, 'Введите код с input() и print()');
            startGamePart3LinearAlgo(levelIndex);
            outputDisplay.style.display = 'block';
            gameCanvas.style.display = 'block';
        } else if (levelData.type === 'combined') {
            updateLevelStatus(`Уровень ${levelData.id}`, 'Введите команды движения и print() для взаимодействия');
            startGamePart3Combined(levelIndex);
            gameCanvas.style.display = 'block';
            outputDisplay.style.display = 'block';
        }
    }
    
    updateExperienceDisplay();
    updateReferenceContent(); 
}

// Запускаем игровой цикл анимации при загрузке страницы
window.addEventListener('load', () => {
    startAnimationLoop();
});

// --- ЛОГИКА ЧАСТИ 1: ПРИСВАИВАНИЕ и PRINT() ---

function startGamePart1(levelIndex) {
    const levelData = PART_1_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 1: Переменные и вывод данных';
    
    // Обновляем статус уровня
    updateLevelStatus(levelData.name || levelData.id, '');

    updateTaskSidebar(levelData.description, levelData.id);

    codeInput.value = '';
    
    // ВСЕГДА скрываем variables-display для всех уровней Урока 1
    variablesDisplay.style.display = 'none';
    
    // Для уровней 1.6-1.10 (print) скрываем канвас, показываем только терминал
    if (levelIndex >= 5) { // Уровни 1.6 и выше (индексы 5-9)
        gameCanvas.style.display = 'none';
        outputDisplay.style.display = 'block';
        outputDisplay.innerHTML = '--- Консоль вывода (print) ---<br>';
        consoleOutput = "--- Консоль вывода (print) ---\n";
        
        // Очищаем канвас
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Для print-уровней не рисуем ничего на канвасе
    } else {
        gameCanvas.style.display = 'block'; // Показываем канвас для первых 5 уровней
        outputDisplay.style.display = 'block';
        outputDisplay.innerHTML = '--- Консоль вывода (print) ---<br>';
        consoleOutput = "--- Консоль вывода (print) ---\n";

        // Очищаем канвас
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (levelData.checkType === 'assignment' || levelData.checkType === 'assignment_expr') {
            // Отрисовываем письмо на канвасе для первых 5 уровней
            drawLetterOnCanvas(levelData.letterData, levelIndex);
        }
    }
}

// Функция для отрисовки письма на канвасе (убраны подсказки с ответами)
function drawLetterOnCanvas(letterData, levelIndex) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон канваса - светлый
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Конверт
    const envelopeX = 100;
    const envelopeY = 80;
    const envelopeWidth = 400;
    const envelopeHeight = 250;
    
    // Основной конверт (белый)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight);
    ctx.strokeRect(envelopeX, envelopeY, envelopeWidth, envelopeHeight);
    
    // Клапан конверта
    ctx.fillStyle = '#e3e3e3';
    ctx.beginPath();
    ctx.moveTo(envelopeX, envelopeY);
    ctx.lineTo(envelopeX + envelopeWidth / 2, envelopeY - 40);
    ctx.lineTo(envelopeX + envelopeWidth, envelopeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Марка (для уровня 1.3)
    if (letterData.stampValue) {
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(envelopeX + envelopeWidth - 80, envelopeY + 20, 60, 40);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('ПОЧТА', envelopeX + envelopeWidth - 75, envelopeY + 35);
        ctx.font = '12px Arial';
        ctx.fillText(`${letterData.stampValue} руб.`, envelopeX + envelopeWidth - 75, envelopeY + 55);
        if (letterData.stampCode) {
            ctx.font = '10px Arial';
            ctx.fillText(letterData.stampCode, envelopeX + envelopeWidth - 75, envelopeY + 70);
        }
    }
    
    // Адрес отправителя (левый верхний угол)
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('ОТ:', envelopeX + 20, envelopeY + 40);
    
    ctx.font = '12px Arial';
    ctx.fillText(letterData.fromName, envelopeX + 20, envelopeY + 60);
    ctx.fillText(`ул. ${letterData.fromStreet}, д. ${letterData.fromHouse}`, envelopeX + 20, envelopeY + 80);
    
    if (letterData.fromCity && letterData.fromIndex) {
        ctx.fillText(`г. ${letterData.fromCity}, ${letterData.fromIndex}`, envelopeX + 20, envelopeY + 100);
    }
    
    // Адрес получателя (правый нижний угол)
    ctx.font = 'bold 14px Arial';
    ctx.fillText('КОМУ:', envelopeX + envelopeWidth - 150, envelopeY + envelopeHeight - 80);
    
    ctx.font = '12px Arial';
    ctx.fillText(letterData.toName, envelopeX + envelopeWidth - 150, envelopeY + envelopeHeight - 60);
    ctx.fillText(`ул. ${letterData.toStreet}, д. ${letterData.toHouse}`, envelopeX + envelopeWidth - 150, envelopeY + envelopeHeight - 40);
    
    if (letterData.toCity && letterData.toIndex) {
        ctx.fillText(`г. ${letterData.toCity}, ${letterData.toIndex}`, envelopeX + envelopeWidth - 150, envelopeY + envelopeHeight - 20);
    }
    
    // Дополнительная информация в центре
    ctx.fillStyle = '#666';
    ctx.font = 'italic 11px Arial';
    
    if (letterData.type === 'registered') {
        ctx.fillText(`Заказное письмо №: ${letterData.trackingNumber}`, envelopeX + 100, envelopeY + 150);
        ctx.fillText(`Зарегистрировано: ${letterData.isRegistered ? 'ДА' : 'НЕТ'}`, envelopeX + 100, envelopeY + 170);
    }
    
    if (letterData.weight) {
        ctx.fillText(`Вес: ${letterData.weight}`, envelopeX + 100, envelopeY + 190);
    }
    
    // Подсказка для игрока (БЕЗ конкретного ответа)
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Посмотрите на письмо и введите код в поле ниже:', 50, 380);
}

function checkAssignment(playerCode, levelAnswer) {
    const normalizeCode = (code) => {
        return code.toLowerCase().trim()
                   .split('\n')
                   .map(line => line.replace(/\s+/g, '').replace(/'/g, '"').trim())
                   .filter(line => line.length > 0)
                   .sort(); 
    };

    const normalizedPlayerLines = normalizeCode(playerCode);
    const normalizedAnswerLines = normalizeCode(levelAnswer.join('\n')); 

    if (normalizedPlayerLines.length !== normalizedAnswerLines.length) {
        return false;
    }
    const answerSet = new Set(normalizedAnswerLines);
    return normalizedPlayerLines.every(line => answerSet.has(line));
}

// Функция для запуска уровней с print() в уроке 1
function startGamePart1Print(levelIndex) {
    const levelData = PART_1_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 1: Переменные и вывод данных';
    
    // Обновляем статус уровня
    updateLevelStatus(levelData.name || levelData.id, '');
    
    updateTaskSidebar(levelData.description, levelData.id);
    
    codeInput.value = '';
    outputDisplay.innerHTML = '';
    consoleOutput = ""; 
    pythonVariables = { }; 
    
    if (levelData.variables) {
        pythonVariables = { ...levelData.variables };
    }
}

// --- ЛОГИКА ЧАСТИ 3: Линейные алгоритмы и комбинированные уровни ---

function startGamePart3LinearAlgo(levelIndex) {
    const levelData = PART_3_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 3: Ввод и вывод данных';
    
    // Обновляем статус уровня
    updateLevelStatus(levelData.name || levelData.id, '');
    
    updateTaskSidebar(levelData.description, levelData.id);

    codeInput.value = '';
    
    variablesDisplay.style.display = 'none';
    gameCanvas.style.display = 'block';
    outputDisplay.style.display = 'block';
    outputDisplay.innerHTML = '--- Консоль вывода (print) ---<br>';
    consoleOutput = "--- Консоль вывода (print) ---\n";

    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем почтовую сцену для линейных алгоритмов
    drawPostalScene(levelData, levelIndex);
}

// Функция для отрисовки почтовых сцен уровней 3.1-3.5 (линейные алгоритмы)
function drawPostalScene(levelData, levelIndex) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем изображение письма
    const imgX = (canvas.width - 300) / 2;
    const imgY = 60;
    
    if (letterImage && letterImage.complete) {
        // Белый фон для изображения
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(imgX - 10, imgY - 10, 320, 220);
        ctx.strokeStyle = '#bbb';
        ctx.strokeRect(imgX - 10, imgY - 10, 320, 220);
        
        // Само изображение
        ctx.drawImage(letterImage, imgX, imgY, 300, 200);
    } else {
        // Если изображение не загружено, показываем заглушку
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(imgX, imgY, 300, 200);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(imgX, imgY, 300, 200);
        ctx.fillStyle = '#999';
        ctx.font = 'bold 13px "Century Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Изображение письма', imgX + 150, imgY + 100);
        ctx.textAlign = 'left';
    }
    
    // Формула под изображением (ТОЛЬКО ФОРМУЛА) - СМЕЩЕНА НИЖЕ
    ctx.fillStyle = '#000000'; // Черный цвет
    ctx.font = 'bold 28px "Century Gothic", sans-serif';
    ctx.textAlign = 'center';
    
    // Формулы для каждого уровня
    let formula = '';
    switch(levelIndex) {
        case 0: // Уровень 3.1
            formula = 'Марка + Конверт = Итого';
            break;
        case 1: // Уровень 3.2
            formula = 'Цена письма × Количество = Итого';
            break;
        case 2: // Уровень 3.3
            formula = 'Внесённая сумма - Стоимость = Итого';
            break;
        case 3: // Уровень 3.4
            formula = 'Вес × Количество + Коробка = Итого';
            break;
        case 4: // Уровень 3.5
            formula = 'Цена - (Цена × Скидка ÷ 100) = Итого';
            break;
    }
    
    // Увеличено расстояние от изображения
    ctx.fillText(formula, canvas.width / 2, imgY + 260);
    ctx.textAlign = 'left';
    
    // Инструкция пользователю - тоже смещена ниже
    ctx.fillStyle = '#000000'; // Черный цвет
    ctx.font = 'bold 18px "Century Gothic", sans-serif';
    ctx.textAlign = 'center';
    // Увеличено расстояние от формулы
    ctx.fillText('Введите код программы в поле ниже', canvas.width / 2, imgY + 310);
    ctx.textAlign = 'left';
}

function checkLinearAlgo(playerCode, levelData) {
    // Сбрасываем переменные и консоль для эмуляции
    pythonVariables = {};
    consoleOutput = "";
    
    const lines = playerCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let inputCounter = 0;
    
    for (const line of lines) {
        // 1. Поиск input() - БОЛЕЕ ГИБКОЕ РЕГУЛЯРНОЕ ВЫРАЖЕНИЕ
        const inputMatch = line.match(/(\w+)\s*=\s*(?:int|float)\s*\(\s*input\s*\(\s*(?:["']([^"']*)["']\s*)?\)\s*\)/i);
        
        if (inputMatch) {
            const varName = inputMatch[1];
            
            if (inputCounter >= levelData.testInputs.length) {
                return { success: false, message: `Слишком много команд input(). Ожидалось ${levelData.testInputs.length}.` };
            }
            
            const simulatedInput = levelData.testInputs[inputCounter].input;
            
            // Эмуляция ввода
            pythonVariables[varName] = parseFloat(simulatedInput);
            inputCounter++;
            continue;
        }

        // 2. Поиск assignment (Присваивание без input)
        const assignmentMatch = line.match(/^(\w+)\s*=\s*(.*)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const valueStr = assignmentMatch[2].trim();
            
            let value = evaluatePythonExpression(valueStr, pythonVariables);
            pythonVariables[varName] = value;
            continue;
        }

        // 3. Поиск print()
        if (line.startsWith('print')) {
            if (!emulatePrint(line)) {
                return { success: false, message: `Ошибка: Некорректный синтаксис print() в строке: ${line}` };
            }
            continue;
        }
        
        return { success: false, message: `Неизвестная команда или синтаксическая ошибка: ${line}` };
    }
    
    // Проверка, что все input'ы были использованы
    if (inputCounter !== levelData.testInputs.length) {
        return { success: false, message: `Недостаточно команд input(). Ожидалось ${levelData.testInputs.length}.` };
    }
    
    // Нормализация вывода для сравнения
    const normalizeOutput = (str) => {
        return str.trim().replace(/\s+/g, ' ').toLowerCase();
    };
    
    // Извлекаем числа из вывода
    const numbersInOutput = consoleOutput.match(/\d+(\.\d+)?/g);
    
    if (!numbersInOutput || numbersInOutput.length === 0) {
        return { success: false, message: `В выводе не найдено число.` };
    }
    
    const lastNumber = numbersInOutput[numbersInOutput.length - 1];
    const expectedNumberMatch = levelData.expectedOutput.match(/\d+(\.\d+)?/);
    
    if (!expectedNumberMatch) {
        return { success: false, message: `Ошибка в данных уровня: ожидаемый вывод не содержит числа.` };
    }
    
    const expectedNumber = expectedNumberMatch[0];
    
    // Сравниваем числа (как числа, а не строки)
    if (parseFloat(lastNumber) === parseFloat(expectedNumber)) {
        return { success: true, message: "Правильно!" };
    } else {
        let detailMessage = `Ожидался вывод: ${levelData.expectedOutput.trim()}\n`;
        detailMessage += `Ваш вывод: ${consoleOutput.trim()}`;
        return { success: false, message: `Неверный результат! \n${detailMessage}` };
    }
}

// --- ЛОГИКА ЧАСТИ 2: INPUT() И ДВИЖЕНИЕ ---

function startGamePart2(levelIndex) {
    const levelData = PART_2_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 2: Оператор input()';
    
    // Обновляем статус уровня
    updateLevelStatus(`Уровень: ${levelData.id}`, '');

    playerX = levelData.startX;
    playerY = levelData.startY;
    direction = 'вправо'; 
    
    updateTaskSidebar(levelData.description, levelData.id);
    
    codeInput.value = '';
    drawGamePart2(); // Переименовано для ясности
}

// --- Обновленная функция отрисовки для Урока 2 ---
function drawGamePart2() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const target = PART_2_LEVELS[currentLevel]; 

    // Рисуем фон
    if (imagesLoaded.background) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: простой фон
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Рисуем почтовый ящик (цель)
    if (imagesLoaded.mailbox) {
        ctx.drawImage(mailboxImage, target.targetX, target.targetY, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        // Fallback: зеленый прямоугольник
        ctx.fillStyle = 'green';
        ctx.fillRect(target.targetX, target.targetY, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // Рисуем игрока (почтальона)
    if (imagesLoaded.player) {
        ctx.drawImage(playerImage, playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        // Fallback: синий прямоугольник
        ctx.fillStyle = 'blue';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    drawDirectionArrow();

    // Отображаем информацию об уровне
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Уровень: ${PART_2_LEVELS[currentLevel].id} | Направление: ${direction}`, 10, 20);
    
    // Почтовый текст подсказки
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px sans-serif';
    ctx.fillText('Задача: доставить письмо в почтовый ящик', 10, canvas.height - 10);
}

// Обновляем функцию отрисовки для комбинированных уровней Урока 3 (3.6-3.10)
function drawGamePart3Combined() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const levelData = PART_3_LEVELS[currentLevel]; 

    // Используем фон для Урока 3
    if (imagesLoaded.game2Bg) {
        ctx.drawImage(game2BgImage, 0, 0, canvas.width, canvas.height);
    } else if (imagesLoaded.background) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Почтовый голубь (птица) с анимацией
    const birdEntityId = 'bird_' + currentLevel;
    const birdAnimation = getEntityAnimation(birdEntityId, 'bird');
    const currentBirdFrame = birdAnimation.getCurrentFrame();
    
    if (imagesLoaded.birdSprite && birdSprite.complete) {
        const sx = currentBirdFrame * FRAME_WIDTH;
        const sy = 0;
        ctx.drawImage(birdSprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, 
                      levelData.passwordBlock.x, levelData.passwordBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    } else if (imagesLoaded.bird && birdImage.complete) {
        ctx.drawImage(birdImage, levelData.passwordBlock.x, levelData.passwordBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        ctx.fillStyle = passwordBlockTouched ? '#2ecc71' : '#f1c40f';
        ctx.fillRect(levelData.passwordBlock.x, levelData.passwordBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // Почтовый ящик (box) с анимацией
    const boxEntityId = 'box_' + currentLevel;
    const boxAnimation = getEntityAnimation(boxEntityId, 'box');
    const currentBoxFrame = boxAnimation.getCurrentFrame();
    
    if (imagesLoaded.boxSprite && boxSprite.complete) {
        const sx = currentBoxFrame * FRAME_WIDTH;
        const sy = 0;
        ctx.drawImage(boxSprite, sx, sy, FRAME_WIDTH, FRAME_HEIGHT, 
                      levelData.verifyBlock.x, levelData.verifyBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    } else if (imagesLoaded.box && boxImage.complete) {
        ctx.drawImage(boxImage, levelData.verifyBlock.x, levelData.verifyBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        ctx.fillStyle = verifyBlockTouched ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(levelData.verifyBlock.x, levelData.verifyBlock.y, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // Игрок (почтальон) - БЕЗ АНИМАЦИИ
    if (imagesLoaded.player && playerImage.complete) {
        ctx.drawImage(playerImage, playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    drawDirectionArrow();

    // Информация об уровне
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Код получен: ${passwordBlockTouched ? 'Да' : 'Нет'}`, 10, 40);
    
    // Почтовый контекст
    if (passwordBlockTouched) {
        ctx.fillStyle = '#27ae60';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Код доставки: ${currentPassword}`, 10, 60);
    }
}

// --- ЛОГИКА ЧАСТИ 3: Комбинированные (Уровни 3.6-3.10) ---

// Обновляем генерацию случайного пароля для почтовой тематики
function generateRandomPassword() {
    const streets = ['Ленина', 'Пушкина', 'Гагарина', 'Советская', 'Мира', 'Центральная'];
    const numbers = [10, 15, 20, 25, 30, 35, 40, 45, 50];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = numbers[Math.floor(Math.random() * numbers.length)];
    return `${street}${number}`;
}

function startGamePart3Combined(levelIndex) {
    const levelData = PART_3_LEVELS[levelIndex];
    
    gameMainTitle.textContent = 'Урок 3: Ввод и вывод данных';
    
    // Обновляем статус уровня
    updateLevelStatus(`Уровень: ${levelData.id}`, '');
    
    updateTaskSidebar(levelData.description, levelData.id);

    // Сброс состояния
    playerX = levelData.startX;
    playerY = levelData.startY;
    direction = 'вправо';
    currentPassword = generateRandomPassword();
    passwordBlockTouched = false;
    verifyBlockTouched = false;
    currentChallengeBlock = null;
    codeInput.value = '';
    outputDisplay.innerHTML = '--- Сброс консоли ---<br>';
    consoleOutput = "--- Сброс консоли ---\n";
    
    drawGamePart3Combined();
}

function checkCollision(x, y, block) {
    // Теперь сравниваем целые клетки
    const playerCellX = Math.floor(x / PLAYER_SIZE);
    const playerCellY = Math.floor(y / PLAYER_SIZE);
    const blockCellX = Math.floor(block.x / PLAYER_SIZE);
    const blockCellY = Math.floor(block.y / PLAYER_SIZE);
    
    return playerCellX === blockCellX && playerCellY === blockCellY;
}

function checkWinPart3Combined() {
    // Уровень пройден, если пароль получен И пароль введен (verifyBlockTouched)
    if (passwordBlockTouched && verifyBlockTouched) {
        // Добавляем небольшую задержку, чтобы убедиться, что консольный вывод виден
        setTimeout(() => { 
            if (currentLevel + 1 === PART_3_LEVELS.length) {
                showWinModal(true); 
            } else {
                showWinModal(false);
            }
        }, 50); 
        return true;
    }
    return false;
}

// --- Общие функции движения и взаимодействия ---

function drawDirectionArrow() {
    ctx.fillStyle = 'red'; ctx.beginPath();
    let x = playerX + PLAYER_SIZE / 2; let y = playerY + PLAYER_SIZE / 2;
    switch (direction) {
        case 'вправо': ctx.moveTo(x + 15, y); ctx.lineTo(x + 5, y - 10); ctx.lineTo(x + 5, y + 10); break;
        case 'влево': ctx.moveTo(x - 15, y); ctx.lineTo(x - 5, y - 10); ctx.lineTo(x - 5, y + 10); break;
        case 'вверх': ctx.moveTo(x, y - 15); ctx.lineTo(x - 10, y - 5); ctx.lineTo(x + 10, y - 5); break;
        case 'вниз': ctx.moveTo(x, y + 15); ctx.lineTo(x - 10, y + 5); ctx.lineTo(x + 10, y + 5); break;
    }
    ctx.closePath(); ctx.fill();
}

function fakeMoveInput(steps, drawFunction) {
    if (isNaN(steps)) { 
        updateLevelStatus('', `Ошибка! Значение '${steps}' не является числом.`); 
        return false; 
    }
    
    let actualSteps = steps * STEP_SIZE; 
    let newX = playerX; 
    let newY = playerY;
    
    switch (direction) {
        case 'вправо': newX += actualSteps; break; 
        case 'влево': newX -= actualSteps; break;
        case 'вверх': newY -= actualSteps; break; 
        case 'вниз': newY += actualSteps; break;
    }
    
    // Ограничиваем движение по сетке
    // Максимальные координаты: 8 клеток по X (0-8), 5 клеток по Y (0-5)
    newX = Math.min(Math.max(newX, 0), 8 * PLAYER_SIZE);
    newY = Math.min(Math.max(newY, 0), 5 * PLAYER_SIZE);
    
    // Выравнивание по сетке (опционально, но лучше оставить)
    playerX = Math.round(newX / PLAYER_SIZE) * PLAYER_SIZE;
    playerY = Math.round(newY / PLAYER_SIZE) * PLAYER_SIZE;
    
    drawFunction(); 
    return true;
}

function fakeTurnInput(newDir, drawFunction) {
    const validDirections = ['вправо', 'влево', 'вверх', 'вниз'];
    const normalizedDir = newDir ? newDir.toLowerCase().trim() : '';
    if (validDirections.includes(normalizedDir)) {
        direction = normalizedDir; 
        drawFunction();
        return true;
    } else {
        updateLevelStatus('', `Ошибка! Некорректное направление '${newDir}'. Используйте: вправо, влево, вверх, вниз.`);
        return false;
    }
}

// --- Общие функции print() и проверки ---

function emulatePrint(line) {
    const printMatch = line.match(/print\s*\(([^)]*)\)/);
    if (!printMatch) return false;

    const argsStr = printMatch[1].trim();
    // Используем более точный regex для разделения по запятой, игнорируя запятые внутри кавычек
    const parts = argsStr.split(/,\s*(?=(?:(?:[^"']*["']){2})*[^"']*$)/); 
    
    let sep = ' '; 
    let end = '\n'; 
    const outputItems = [];

    for (let part of parts) {
        part = part.trim();
        if (part.startsWith('sep=')) {
            sep = part.substring(4).replace(/"|'/g, '');
        } else if (part.startsWith('end=')) {
            end = part.substring(4).replace(/"|'/g, '');
        } else if (part.length > 0) {
            try {
                if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
                    outputItems.push(part.slice(1, -1));
                } 
                else if (pythonVariables.hasOwnProperty(part)) {
                    // Если это имя переменной, берем ее значение
                    outputItems.push(pythonVariables[part]);
                }
                else {
                    // Пытаемся вычислить выражение
                    const evaluated = evaluatePythonExpression(part, pythonVariables);
                    outputItems.push(evaluated);
                }
                
            } catch (e) {
                // Если не удалось вычислить, добавляем как есть
                outputItems.push(part);
            }
        }
    }

    const outputString = outputItems.join(sep) + end;
    consoleOutput += outputString;

    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    return true;
}

function emulatePrintPassword(line, levelData) {
    // 🆕 ДОБАВЛЕНО: Увеличиваем счетчик попыток при взаимодействии с объектами
    levelAttempts++;
    console.log(`[Опыт] Попытка взаимодействия с объектом №${levelAttempts}`);
    
    // 1. Команда print() для получения адреса у почтового голубя
    if (line.trim().toLowerCase() === 'print("какой адрес?")' || 
        line.trim().toLowerCase() === "print('какой адрес?')") {
        
        // Проверка столкновения с почтовым голубем
        if (!checkCollision(playerX, playerY, levelData.passwordBlock)) {
            updateLevelStatus('', `Ошибка: Чтобы получить адрес, нужно подойти к ПОЧТОВОМУ ГОЛУБЮ.`);
            return { success: false, win: false };
        }

        consoleOutput += `Какой адрес?\n`;
        
        if (passwordBlockTouched) {
            consoleOutput += `Адрес доставки: ${currentPassword} (Уже получен)\n`;
            updateLevelStatus('', `Адрес уже получен: ${currentPassword}. Идите к ПОЧТОВОМУ ЯЩИКУ.`);
        } else {
            const password = generateRandomPassword(); 
            currentPassword = password;
            consoleOutput += `Адрес доставки: ${currentPassword}\n`;
            passwordBlockTouched = true;
            updateLevelStatus('', `Адрес доставки получен! Идите к ПОЧТОВОМУ ЯЩИКУ.`);
        }
        
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        drawGamePart3Combined();
        return { success: true, win: false };
    } 
    
    // 2. Команда print() для ввода адреса в почтовый ящик
    if (verifyBlockTouched) {
        return { success: true, win: true };
    }

    const passwordMatch = line.match(/print\s*\(([^)]*)\)/);
    if (passwordMatch && passwordBlockTouched) {
        
        // Проверка столкновения с почтовым ящиком
        if (!checkCollision(playerX, playerY, levelData.verifyBlock)) {
            updateLevelStatus('', `Ошибка: Чтобы ввести адрес, нужно подойти к ПОЧТОВОМУ ЯЩИКУ.`);
            return { success: false, win: false };
        }

        const printedValueRaw = passwordMatch[1].trim();
        const printedValue = printedValueRaw.replace(/^['"]|['"]$/g, '');
        
        consoleOutput += `Введен адрес: ${printedValue}\n`;
        
        if (printedValue === currentPassword) {
            consoleOutput += `Адрес верный! Доставка подтверждена.\n`;
            verifyBlockTouched = true;
            updateLevelStatus('', "Адрес верный! Доставка письма завершена!");
            
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            drawGamePart3Combined();
            
            return { success: true, win: true }; 
            
        } else {
            consoleOutput += `Адрес неверный! Попробуйте снова.\n`;
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            updateLevelStatus('', "Неверный адрес. Попробуйте снова.");
            return { success: true, win: false };
        }
    }
    
    // Если это команда print(), но не соответствует ни одному из сценариев взаимодействия
    if (line.startsWith('print')) {
         if (emulatePrint(line)) {
            return { success: true, win: false };
         }
         return { success: false, win: false };
    }

    return { success: false, win: false }; 
}

function checkPrintResult(playerCode, levelData) {
    consoleOutput = "";
    outputDisplay.innerHTML = '';
    
    // Инициализируем переменные из levelData.variables
    pythonVariables = { ...levelData.variables };
    
    const lines = playerCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
        const assignmentMatch = line.match(/^(\w+)\s*=\s*(.*)/);
        if (assignmentMatch) {
            const varName = assignmentMatch[1];
            const valueStr = assignmentMatch[2].trim();
            
            // Обрабатываем строки и числа
            if (valueStr.match(/^["'].*["']$/)) {
                // Строковое значение
                pythonVariables[varName] = valueStr.slice(1, -1);
            } else if (valueStr === 'True' || valueStr === 'False') {
                // Логическое значение
                pythonVariables[varName] = valueStr === 'True';
            } else if (!isNaN(parseFloat(valueStr))) {
                // Числовое значение
                pythonVariables[varName] = parseFloat(valueStr);
            } else {
                // Простое выражение
                try {
                    pythonVariables[varName] = evaluatePythonExpression(valueStr, pythonVariables);
                } catch (e) {
                    pythonVariables[varName] = valueStr;
                }
            }
            continue;
        }

        if (line.startsWith('print')) {
            if (!emulatePrint(line)) {
                return { success: false, message: `Ошибка: Некорректный синтаксис print() в строке: ${line}` };
            }
        }
    }
    
    const expected = levelData.requiredOutput;
    const actual = consoleOutput;
    
    if (actual === expected) {
        return { success: true, message: "Правильно! Вывод соответствует ожидаемому." };
    } else {
        let detailMessage = `Ожидаемый вывод: \n>>> ${expected.replace(/\n/g, '[новая строка]\n>>> ')}\n`;
        detailMessage += `Ваш вывод: \n>>> ${actual.replace(/\n/g, '[новая строка]\n>>> ')}`;
        return { success: false, message: `Вывод не соответствует заданию! \n${detailMessage}` };
    }
}

function evaluatePythonExpression(expression, variables) {
    try {
        let jsExpression = expression;
        
        // Сначала заменяем все имена переменных, которые есть в variables
        Object.keys(variables).forEach(varName => {
            const value = variables[varName];
            // Экранируем специальные символы для регулярного выражения
            const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedVarName}\\b`, 'g');
            
            if (typeof value === 'string') {
                jsExpression = jsExpression.replace(regex, `'${value}'`);
            } else if (typeof value === 'boolean') {
                jsExpression = jsExpression.replace(regex, value ? 'true' : 'false');
            } else {
                jsExpression = jsExpression.replace(regex, value);
            }
        });

        // Заменяем Python логические значения на JavaScript
        jsExpression = jsExpression.replace(/True\b/g, 'true').replace(/False\b/g, 'false');

        // Проверяем, является ли выражение просто числом или строкой
        if (!isNaN(parseFloat(jsExpression)) && isFinite(jsExpression)) {
            return parseFloat(jsExpression);
        }
        
        if ((jsExpression.startsWith("'") && jsExpression.endsWith("'")) || 
            (jsExpression.startsWith('"') && jsExpression.endsWith('"'))) {
            return jsExpression.slice(1, -1);
        }

        // Пытаемся вычислить выражение
        let result = eval(jsExpression);

        if (typeof result === 'boolean') {
            return result ? 'True' : 'False';
        }

        return result;

    } catch (e) {
        // Если не удалось вычислить, возвращаем оригинальное выражение
        return expression; 
    }
}

// --- ФУНКЦИЯ: Режим Учителя ---

function handleTeacherMode() {
    const password = prompt("Режим Учителя: Введите пароль для доступа к уровням.");
    
    if (password !== TEACHER_PASSWORD) {
        updateLevelStatus('', "Неверный пароль. Доступ запрещен.");
        return;
    }
    
    const targetLevelInput = prompt(
        `Пароль верный! Введите целевой уровень для перехода.
        
        Формат: Урок.Уровень (напр., 1.5, 2.7 или 3.2)
        Урок 1: 1.1 - 1.10
        Урок 2: 2.1 - 2.10
        Урок 3: 3.1 - 3.10`
    );

    if (!targetLevelInput) {
        updateLevelStatus('', "Переход отменен.");
        return;
    }

    const [partStr, levelStr] = targetLevelInput.split('.');
    const targetPart = parseInt(partStr);
    const targetSubLevel = parseInt(levelStr);

    if (isNaN(targetPart) || isNaN(targetSubLevel)) {
        updateLevelStatus('', "Неверный формат ввода. Используйте формат: ЧАСТЬ.УРОВЕНЬ (например, 1.5).");
        return;
    }

    let targetLevelIndex = -1;
    let maxLevelIndex = 0;
    
    if (targetPart === 1) {
        maxLevelIndex = PART_1_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else if (targetPart === 2) {
        maxLevelIndex = PART_2_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else if (targetPart === 3) {
        maxLevelIndex = PART_3_LEVELS.length;
        targetLevelIndex = targetSubLevel - 1;
    } else {
        updateLevelStatus('', "Неизвестный номер урока. Доступны только Урок 1, 2 и 3.");
        return;
    }

    if (targetLevelIndex < 0 || targetLevelIndex >= maxLevelIndex) {
        updateLevelStatus('', `Урок ${targetPart} имеет уровни от 1 до ${maxLevelIndex}. Введите корректный номер.`);
        return;
    }

    currentPart = targetPart;
    currentLevel = targetLevelIndex;
    updateLevelStatus('', `Переход на Урок ${targetPart}, Уровень ${targetSubLevel}.`);
    
    winModal.style.display = 'none';
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    
    startGame(currentLevel); 
}

// --- Главная Функция Выполнения Кода ---

window.executeCode = async function() {
    const code = codeInput.value.trim();
    
    // 🆕 ДОБАВЛЕНО: Увеличиваем счетчик попыток при каждой отправке кода
    levelAttempts++;
    console.log(`[Опыт] Попытка выполнения кода №${levelAttempts}`);
    
    if (code.toLowerCase() === 'go') {
        handleTeacherMode();
        codeInput.value = ''; 
        return;
    }

    if (currentPart === 1) {
        const levelData = PART_1_LEVELS[currentLevel];
        
        if (levelData.checkType === 'assignment' || levelData.checkType === 'assignment_expr') {
            // Старая логика проверки присваивания
            if (checkAssignment(code, levelData.answer)) { 
                updateLevelStatus(levelData.name || levelData.id, "Правильно! Код выполнен.");
                
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                if (currentLevel + 1 === PART_1_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            } else {
                updateLevelStatus(levelData.name || levelData.id, "Неправильно! Проверь количество строк, синтаксис (кавычки для текста) и операторы.");
            }
        } else if (levelData.type === 'print') {
            // Логика проверки print() для уровней 1.6-1.10
            const result = checkPrintResult(code, levelData);
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>'); // Обновляем консоль после эмуляции
            updateLevelStatus(levelData.name || levelData.id, result.message);
            
            if (result.success) {
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                if (currentLevel + 1 === PART_1_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            }
        }

    } else if (currentPart === 2) {
        // Логика Урока 2
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let success = true;

        for (const line of lines) {
            if (!success) break; 

            if (line === 'move = int(input())') {
                // Имитация int(input()) для движения
                const inputSteps = prompt(`>>> ${line}\nСколько шагов сделать (введите ЦЕЛОЕ ЧИСЛО)?`);
                if (inputSteps !== null && inputSteps.trim() !== "") {
                    const steps = parseInt(inputSteps);
                    success = fakeMoveInput(steps, drawGamePart2);
                } else { 
                    updateLevelStatus('', "Движение отменено. Выполнение кода остановлено.");
                    success = false; 
                }

            } else if (line === 'turn = input()') {
                const inputDir = prompt(`>>> ${line}\nКуда повернуть (введите 'вправо', 'влево', 'вверх' или 'вниз')?`);
                if (inputDir !== null && inputDir.trim() !== "") {
                     success = fakeTurnInput(inputDir, drawGamePart2);
                } else { 
                    updateLevelStatus('', "Поворот отменен. Выполнение кода остановлено.");
                    success = false; 
                }

            } else {
                updateLevelStatus('', `Ошибка синтаксиса на строке "${line}"! Должно быть: move = int(input()) или turn = input()`);
                success = false;
            }
        }
        
        if (success) {
            updateLevelStatus('', "Код успешно выполнен.");
            setTimeout(async () => {
                // checkWin() от Урока 2
                const target = PART_2_LEVELS[currentLevel];
                const playerCenter = { x: playerX + PLAYER_SIZE / 2, y: playerY + PLAYER_SIZE / 2 };
                const targetArea = {
                    x: target.targetX, y: target.targetY,
                    width: PLAYER_SIZE, height: PLAYER_SIZE
                };

                if (playerCenter.x >= targetArea.x && playerCenter.x <= targetArea.x + targetArea.width &&
                    playerCenter.y >= targetArea.y && playerCenter.y <= targetArea.y + targetArea.height) {
                    
                    // Сохраняем прогресс
                    await saveProgressToGoogleSheets('update');
                    
                    if (currentLevel + 1 === PART_2_LEVELS.length) {
                        showWinModal(true); 
                    } else {
                        showWinModal(false);
                    }
                }
            }, 100); 
        } 

    } else if (currentPart === 3) {
        const levelData = PART_3_LEVELS[currentLevel];
        
        if (levelData.checkType === 'linear_algo') {
            // Уровни 3.1-3.5 (Линейные алгоритмы)
            const result = checkLinearAlgo(code, levelData);
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>'); // Обновляем консоль после эмуляции
            updateLevelStatus(levelData.name || levelData.id, result.message);
            
            if (result.success) {
                // Сохраняем прогресс
                await saveProgressToGoogleSheets('update');
                
                 if (currentLevel + 1 === PART_3_LEVELS.length) {
                    showWinModal(true); 
                } else {
                    showWinModal(false); 
                }
            }
        } else if (levelData.type === 'combined') {
            // Уровни 3.6-3.10 (Комбинированные)
            const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            let success = true;

            for (const line of lines) {
                
                if (!success) break; 

                if (line.startsWith('move = int(input())')) {
                    const inputSteps = prompt(`>>> ${line}\nСколько шагов сделать (введите число)?`);
                    if (inputSteps !== null && inputSteps.trim() !== "") {
                        const steps = parseInt(inputSteps);
                        success = fakeMoveInput(steps, drawGamePart3Combined);
                    } else { 
                        updateLevelStatus('', "Движение отменено. Выполнение кода остановлено.");
                        success = false; 
                    }

                } else if (line.startsWith('turn = input()')) {
                    const inputDir = prompt(`>>> ${line}\nКуда повернуть (введите 'вправо', 'влево', 'вверх' или 'вниз')?`);
                    if (inputDir !== null && inputDir.trim() !== "") {
                         success = fakeTurnInput(inputDir, drawGamePart3Combined);
                    } else { 
                        updateLevelStatus('', "Поворот отменен. Выполнение кода остановлено.");
                        success = false; 
                    }

                } else if (line.startsWith('print')) {
                    // Обработка print() для взаимодействия с блоками
                    const printResult = emulatePrintPassword(line, levelData);
                    success = printResult.success;
                    
                    // ЕСЛИ ПАРОЛЬ ВВЕДЕН ВЕРНО -> НЕМЕДЛЕННЫЙ ВЫХОД
                    if (printResult.win) {
                        // Сохраняем прогресс
                        await saveProgressToGoogleSheets('update');
                        checkWinPart3Combined(); // Показывает модальное окно
                        return; // 🛑 Прерываем выполнение executeCode полностью
                    }
                    
                } else {
                    updateLevelStatus('', `Ошибка синтаксиса на строке "${line}"! Должно быть: move = int(input()), turn = input(), или print(...)`);
                    success = false;
                }
            }
            
            // Финальная проверка после выполнения всех команд, если победа не была обработана внутри цикла
            if (success) { 
                // Не показываем сообщение "Код успешно выполнен", если только что завершили уровень.
                // Сообщение о завершении уровня будет в checkWinPart3Combined().
                if (!levelStatusElement.textContent.includes('Пароль верный')) {
                    updateLevelStatus('', "Код успешно выполнен. Проверьте консоль и положение.");
                }
            }
        }
    }
}
// --- СПРАВОЧНИК ---

const REFERENCE_DATA = {
    "1.1": {
        title: "Справка: Урок 1 - Основы",
        content: `
            <h3>📌 Переменные</h3>
            <p>Коробочка для данных. Создаётся при присваивании:</p>
            <p><code>имя = значение</code></p>
            
            <h3>📤 Вывод</h3>
            <p><code>print()</code> — выводит текст или переменные.</p>
            <p><code>print("текст")</code> или <code>print(переменная)</code></p>
            
            <h3>🧮 Типы данных</h3>
            <ul>
                <li><code>"текст"</code> — строка (str)</li>
                <li><code>10</code> — целое число (int)</li>
                <li><code>9.99</code> — дробное число (float)</li>
                <li><code>True</code> — логическое (bool)</li>
            </ul>
        `
    },
    "1.2": {
        title: "Справка: Урок 1.2 - Ввод и движение",
        content: `
            <h3>📥 Ввод данных</h3>
            <p><code>input()</code> — запрашивает ввод текстовой информации.</p>
            <p><code>int(input())</code> — запрашивает ввод числовой информации.</p>
            
            <h3>🚶 Команды движения</h3>
            <ul>
                <li><code>move = int(input())</code> — шаги</li>
                <li><code>turn = input()</code> — поворот</li>
            </ul>
            <p>Направления: вправо, влево, вверх, вниз.</p>
        `
    },
    "1.3": {
        title: "Справка: Урок 1.3 - Комбинирование",
        content: `
            <h3>🔄 Линейные алгоритмы</h3>
            <p>Сочетайте <code>input()</code>, вычисления и <code>print()</code>.</p>
            <p>Порядок: ввод → обработка → вывод.</p>
            
            <h3>🏃‍♂️ Комбинированные уровни</h3>
            <p>1. Подойти к голубю, получить адрес</p>
            <p>2. Подойти к ящику, подтвердить адрес</p>
            <p>Используйте <code>move</code>, <code>turn</code> и <code>print()</code>.</p>
        `
    }
};

// Функция обновления справочника
function updateReferenceContent() {
    // Формируем ключ для поиска в справочнике
    const partKey = `1.${currentPart}`;
    
    if (REFERENCE_DATA[partKey]) {
        document.getElementById('reference-title').textContent = REFERENCE_DATA[partKey].title;
        document.getElementById('reference-text').innerHTML = REFERENCE_DATA[partKey].content;
    } else {
        // Fallback на случай если ключ не найден
        document.getElementById('reference-title').textContent = "Справка";
        document.getElementById('reference-text').innerHTML = "<p>Справка для этого урока недоступна.</p>";
    }
}

// Открыть справочник
document.getElementById('reference-button').addEventListener('click', function() {
    updateReferenceContent();
    document.getElementById('reference-modal').style.display = 'flex';
});

// Закрыть справочник
document.getElementById('reference-close').addEventListener('click', function() {
    document.getElementById('reference-modal').style.display = 'none';
});

// Закрыть при клике вне окна
window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('reference-modal')) {
        document.getElementById('reference-modal').style.display = 'none';
    }
});

// Обновлять справочник при смене уровня
// Добавляем вызовы updateReferenceContent() в существующие функции:

// В функции startGame() добавляем в конец:
// updateReferenceContent();

// В функции nextLevel() после смены уровня:
// updateReferenceContent();

// В функции showIntroScreen() при показе:
// updateReferenceContent();

// Добавить в конец каждого game.js, после всех функций
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем localStorage для нового ученика
    const studentData = JSON.parse(localStorage.getItem('currentStudent'));
    if (studentData) {
        // Убеждаемся, что есть переменные для хранения опыта уроков
        for (let i = 1; i <= 6; i++) {
            const lessonExpKey = `experience_lesson${i}`;
            const completedKey = `completed_levels_lesson${i}`;
            
            if (!localStorage.getItem(lessonExpKey)) {
                localStorage.setItem(lessonExpKey, '0');
            }
            if (!localStorage.getItem(completedKey)) {
                localStorage.setItem(completedKey, '[]');
            }
        }
        
        // Обновляем отображение опыта
        updateExperienceDisplay();
    }
});

// --- Запуск игры при загрузке страницы ---
lessonTitle.textContent = 'Уроки Python 8 класс';
showIntroScreen();
