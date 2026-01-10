const LESSON_NUMBER = 3;

function getStudentIdentifier() {
    const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');
    if (studentData && studentData.lastName && studentData.firstName && studentData.grade && studentData.classLetter && studentData.subgroup) {
        return `${studentData.lastName}_${studentData.firstName}_${studentData.grade}${studentData.classLetter}_${studentData.subgroup}`;
    }
    return 'anonymous';
}

// ===============================
// СИСТЕМА СОХРАНЕНИЯ ПРОГРЕССА
// ===============================

async function saveProgressToGoogleSheets(action = 'save', earnedExp = 0) {
    try {
        const studentData = JSON.parse(localStorage.getItem('currentStudent'));

        if (!studentData) {
            console.log('Нет данных ученика для сохранения');
            return true;
        }
        
        // 🔧 ФОРМАТ КАК В УРОКЕ 1 и 2: "3.0" (урок.часть)
        const partKey = `3.0`;
        
        // 🆕 Обновляем текущие данные ученика
        studentData.currentPart = partKey; // Сохраняем как строку "3.0"
        studentData.currentLevel = currentLevel;
        studentData.lastLogin = new Date().toISOString();
        
        // 🆕 ВАЖНО: Берем опыт уже обновленный в calculateExperience()
        const currentStudentExp = totalExperience;
        
        // 🆕 Обновляем опыт в данных ученика
        studentData.experience = currentStudentExp;
        localStorage.setItem('currentStudent', JSON.stringify(studentData));
        
        // 🆕 Формируем ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА
        const studentIdentifier = getStudentIdentifier();
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
        
        const levelKey = `${partKey}.${currentLevel + 1}`;
        
        // 🆕 Добавляем уровень в пройденные, если еще не добавлен
        if (!completedLevels.includes(levelKey) && earnedExp > 0) {
            completedLevels.push(levelKey);
            localStorage.setItem(completedKey, JSON.stringify(completedLevels));
        }
        
        // 🆕 ВАЖНО: Формируем правильный ключ уровня
        const levelKeyForSheet = `${partKey}.${currentLevel + 1}`;
        
        // Формируем данные для отправки - ТАКИЕ ЖЕ КАК В game-2.js
        const dataToSend = {
            action: 'save',
            password: 'teacher123',
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            classLetter: studentData.classLetter,
            subgroup: studentData.subgroup,
            currentPart: partKey,           // "3.0"
            currentLevel: currentLevel + 1, // +1 для человекочитаемого формата        
            earnedExp: earnedExp,              
            totalExperience: currentStudentExp,
            lessonNumber: 3,       
            partNumber: 0,                 // Часть урока 3 всегда 0
            levelKey: levelKeyForSheet,    // "3.0.1", "3.0.2" и т.д.              
            lastLogin: studentData.lastLogin
        };

        console.log('Отправляю данные на сервер (Урок 3):', dataToSend);
        
        // 🆕 ИСПРАВЛЕНИЕ: Используем тот же URL, что и в lesson2
        fetch('https://script.google.com/macros/s/AKfycbzxAsVN4tNt0d6Uvm--n_vlypPDnflxEQpZ_IvMhEOOzq6KjBlMItvhdWQtB6pAMEJH/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        }).then(() => {
            console.log('Данные отправлены на сервер (Урок 3)');
        }).catch(error => {
            console.log('Ошибка отправки (Урок 3):', error);
        });

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
            // 🆕 ИСПРАВЛЕНО: Восстанавливаем опыт из данных ученика
            if (studentData.experience !== undefined) {
                totalExperience = studentData.experience;
                console.log('Опыт загружен из данных ученика (Урок 3):', totalExperience);
            }

            // 🆕 ИСПРАВЛЕНИЕ: Проверяем формат как в game-2.js
            const savedPart = studentData.currentPart;
            
            // Проверяем разные форматы savedPart
            if (savedPart === '3.0' || savedPart === '3') {
                // Если сохранен Урок 3
                if (studentData.currentLevel !== undefined) {
                    console.log('Загружен уровень', studentData.currentLevel, 'для урока 3');
                    return {
                        success: true,
                        currentPart: 3,
                        currentLevel: studentData.currentLevel
                    };
                }
            } else if (typeof savedPart === 'string' && savedPart.startsWith('2.')) {
                // Если сохранен Урок 2, начинаем Урок 3 с 0
                console.log('Обнаружен Урок 2. Начинаем Урок 3 с 0.');
            } else if (typeof savedPart === 'string' && savedPart.startsWith('1.')) {
                // Если сохранен Урок 1, начинаем Урок 3 с 0
                console.log('Обнаружен Урок 1. Начинаем Урок 3 с 0.');
            } else {
                console.log('Урок не совпадает или нет сохраненного уровня. Начинаем с 0.');
            }
        }

        return {
            success: true,
            currentPart: 3,
            currentLevel: 0
        };

    } catch (error) {
        console.log('Ошибка при загрузке прогресса:', error);
        return {
            success: true,
            currentPart: 3,
            currentLevel: 0
        };
    }
}

async function autoSaveProgress() {
    await saveProgressToGoogleSheets('update', 0);
}

// --- Настройка DOM элементов ---
// --- Настройка DOM элементов ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');
const codeInput = document.getElementById('codeInput'); // <textarea>
const winModal = document.getElementById('win-modal');
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');

// 🛑 Ссылки на элементы DOM, которые вы используете
const lessonTitle = document.getElementById('lesson-title');
const lessonSubtitle = document.getElementById('lesson-subtitle');
const lessonText = document.getElementById('lesson-text'); // Добавленный элемент

const gameMainTitle = document.getElementById('game-main-title'); // Оставьте эту
const outputDisplay = document.getElementById('output-display');

// Элементы сайдбаров
const instructionSidebar = document.getElementById('instruction-sidebar'); // ЛЕВЫЙ
const instructionContent = document.getElementById('instruction-content'); // Контент ЛЕВОГО
const taskSidebar = document.getElementById('task-sidebar'); // ПРАВЫЙ
const currentTaskDisplay = document.getElementById('current-task-display'); // Заголовок ПРАВОГО
const taskContent = document.getElementById('task-content'); // Контент ПРАВОГО
// ...

// --- ФОН ИГРОВОГО ПОЛЯ ---
const background = new Image();
background.src = '../images3/game-bg.png'; // 🛑 ВАШ ПРАВИЛЬНЫЙ ПУТЬ
background.onload = function() {
    drawGame(); 
};

// 🚀 Проход/Цель будет использовать passage.png
const passageImage = new Image();
passageImage.src = '../images3/passage.png'; // <-- ИЗМЕНЕН ПУТЬ
passageImage.onload = function() { drawGame(); };

const playerImage = new Image();
playerImage.src = '../images3/player-main.png'; 
playerImage.onload = function() { drawGame(); };

// Спрайт-листы для анимации
const stoneSprite = new Image();
stoneSprite.src = '../images3/stone-sprite.png'; // 16 кадров для камня

const sourceSprite = new Image();
sourceSprite.src = '../images3/source-sprite.png'; // 16 кадров для источника

// Константы анимации
const STONE_TOTAL_FRAMES = 4;        // Камень: 16 кадров
const SOURCE_TOTAL_FRAMES = 4;       // Источник: 16 кадров
const FRAME_WIDTH = 1098;
const FRAME_HEIGHT = 1098;
const FRAME_INTERVAL = 120;
const MIN_PAUSE_DURATION = 5000;
const MAX_PAUSE_DURATION = 10000;
const ANIMATION_CYCLES = 2;

// Класс для управления анимацией сущности
class EntityAnimation {
    constructor(entityType, entityIndex) {
        this.entityType = entityType;
        this.entityIndex = entityIndex;
        
        this.totalFrames = entityType === 'stone' ? STONE_TOTAL_FRAMES : SOURCE_TOTAL_FRAMES;
        
        this.currentFrame = 0;
        this.state = 'idle';
        this.timer = 0;
        this.cyclesCompleted = 0;
        this.isPlaying = false;
        
        this.nextPauseDuration = this.getRandomPauseDuration();
        this.idleTimer = Math.random() * 5000 + (entityIndex * 3000);
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
        }
    }
    
    getCurrentFrame() {
        return this.currentFrame;
    }
    
    isAnimating() {
        return this.state === 'playing';
    }
}

// Глобальные переменные для анимации
let lastUpdateTime = 0;
let entityAnimations = new Map();

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

// Функция для сброса анимаций
function resetAnimations() {
    entityAnimations.clear();
    
    if (currentLevelData && currentLevelData.entities) {
        currentLevelData.entities.forEach((entity, index) => {
            if (entity.name_en === 'direction_stone' || entity.name_en === 'essence') {
                const entityId = `${entity.name_en}_${index}`;
                let entityType = entity.name_en === 'direction_stone' ? 'stone' : 'source';
                entityAnimations.set(entityId, new EntityAnimation(entityType, index));
            }
        });
    }
}

// Функция для запуска цикла анимации
function startAnimationLoop() {
    function animate(currentTime) {
        updateAnimations(currentTime);
        drawGame();
        requestAnimationFrame(animate);
    }
    
    lastUpdateTime = 0;
    requestAnimationFrame(animate);
}

function loadImageWithCache(url) {
    return new Promise((resolve, reject) => {
        const cached = localStorage.getItem(`image_${url}`);
        if (cached) {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = cached;
        } else {
            const img = new Image();
            img.onload = () => {
                // Кешируем как Data URL (осторожно: может занять много памяти)
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    localStorage.setItem(`image_${url}`, dataUrl);
                } catch (e) {
                    console.warn('Не удалось кешировать изображение:', e);
                }
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        }
    });
}

// --- Параметры Игры и Уровней ---
let currentPart = 3; 
let currentLevel = 0; 
const PLAYER_SIZE = 70;
const STEP_SIZE = 70; 
const TEACHER_PASSWORD = 'python'; 

// Переменные для эмуляции Python
let pythonVariables = {};
let consoleOutput = ""; 
let isSkippingBlock = false; // Для if/elif/else
let currentBlockIndentation = 0; // Для if/elif/else
let ifConditionMetInBlock = false; // Для if/elif/else


// Переменные состояния Игрока
let playerX = 0;
let playerY = 0;
let direction = 'вправо';

// Новые переменные для Занятия 2 (фиксированные значения)
let currentLevelData = null; 
let lastPrintedResult = null; 
let printedExpression = null; 
let targetUnlocked = false; // 🛑 Флаг приветствия

// 🛑 Глобальное состояние для двухфазной победы
let levelPhase = 'initial'; // 'initial', 'stone_activated'
let requiredPassageIndex = -1;
let requiredCodeword = null;

// 🛑 НОВОЕ: Флаги для проверки if/переменных
let currentExecutionFlags = {
    isConditional: false, // Была ли команда вызвана внутри сработавшего if/elif/else
    usedLevelVariable: false // Была ли переменная уровня использована в if/elif
};

// ===============================
// СИСТЕМА ОПЫТА (добавлено в начало)
// ===============================

let totalExperience = 0;
let levelStartTime = null;
let levelAttempts = 0;

// Функция для обновления отображения опыта
function updateExperienceDisplay() {
    const expElement = document.getElementById('experience-display');
    if (!expElement) {
        const display = document.createElement('div');
        display.id = 'experience-display';
        display.style.cssText = `
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
        document.getElementById('game-main').appendChild(display);
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
    // Используем функцию getStudentIdentifier для уникальности ученика
    let studentIdentifier = getStudentIdentifier();
    
    // 🆕 Ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА
    const partKey = '3.0';
    const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
    let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
    
    const levelKey = `${partKey}.${currentLevel + 1}`;
    
    // 🆕 ПРОВЕРКА: если уровень уже пройден этим учеником, не даем опыт
    if (completedLevels.includes(levelKey)) {
        console.log(`[Опыт] Уровень ${levelKey} уже пройден этим учеником, опыт не начисляется`);
        return 0;
    }
    
    let earnedExp = 0;
    let reasons = [];
    
    console.log("=== РАСЧЕТ ОПЫТА (Урок 3) ===");
    console.log(`Попыток взаимодействия с Фараоном: ${levelAttempts}`);
    console.log(`Время старта уровня: ${levelStartTime ? new Date(levelStartTime).toLocaleTimeString() : 'не установлено'}`);
    
    // 1. Базовый опыт за уровень
    earnedExp += 1;
    reasons.push("+1 за завершение уровня");
    console.log("✅ +1 за завершение уровня");
    
    // 2. Бонус за малое количество попыток (≤ 6 для Урока 3)
     console.log(`Проверка попыток с Камнем: ${stoneInteractionAttempts} <= 3 ? ${stoneInteractionAttempts <= 3}`);
    if (stoneInteractionAttempts <= 3) {
        earnedExp += 1;
        reasons.push(`+1 за малое количество попыток с Камнем (${stoneInteractionAttempts})`);
        console.log(`✅ +1 за малое количество попыток с Камнем (${stoneInteractionAttempts})`);
    } else {
        console.log(`❌ Нет бонуса за попытки (${stoneInteractionAttempts} > 3)`);
    }
    
    // 3. Бонус за время (менее 3 минут)
    if (levelStartTime) {
        const timeSpent = Date.now() - levelStartTime;
        const threeMinutes = 3 * 60 * 1000;
        const secondsSpent = Math.floor(timeSpent / 1000);
        
        console.log(`Время прохождения: ${secondsSpent} сек`);
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
    
    // 🆕 Добавляем уровень в пройденные ДЛЯ ЭТОГО УЧЕНИКА
    completedLevels.push(levelKey);
    localStorage.setItem(completedKey, JSON.stringify(completedLevels));
    
    // 🆕 Обновляем общий опыт
    totalExperience += earnedExp;
    
    // Обновляем данные ученика в localStorage
    const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');
    if (studentData) {
        studentData.experience = totalExperience;
        localStorage.setItem('currentStudent', JSON.stringify(studentData));
    }
    
    // Обновляем отображение опыта
    updateExperienceDisplay();
    
    // Выводим подробный отчет в консоль
    console.log(`=== ИТОГО ===`);
    console.log(`Получено опыта: ${earnedExp}`);
    console.log(`Причины: ${reasons.join(', ')}`);
    console.log(`Общий опыт: ${totalExperience}`);
    console.log("===============");
    
    // Также показываем всплывающее сообщение для пользователя
    setTimeout(() => {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML += `<br><small>Получено опыта: ${earnedExp} (${reasons.join(', ')})</small>`;
        }
    }, 500);
    
    return earnedExp;
}


// 🛑 НОВЫЙ СПИСОК КОДОВЫХ СЛОВ ДЛЯ ПРОХОДОВ
const PASSAGE_CODEWORDS = [
    'СилаВетра',
    'ТайныйКлюч',
    'ЗолотойРассвет',
    'ВечныйСон',
    'ЛедянойВзрыв',
    'ТеньГоры',
    'ЗвездныйМост',
    'КровьДракона'
];

// 🛑 НОВЫЙ СПИСОК ПРИВЕТСТВИЙ ОТ ЭССЕНЦИИ
const ESSENCE_GREETINGS = [
    'Энергия', 
    'Трансформация', 
    'Равновесие', 
    'ДревнееЗнание',
    'Активация',
    'ПутьОткрыт'
];


// --- Вспомогательная функция для создания структуры сущности ---
function createEntity(name_ru, name_en, type, x, y, value = null, index = null) { // Добавлен index
    return { name_ru, name_en, type, x: 0, y: 0, value, index }; // Храним index для порталов
}

// --- Вспомогательная функция для генерации подсказок по операторам ---
function getOpHint(ops) {
    let operatorsHtml = ops.map(op => `<code>${op.replace(/<.?code>/g, '')}</code>`).join(' ');
    if (!operatorsHtml.includes('if')) {
        operatorsHtml = '<code>if</code> <code>elif</code> <code>else</code> ' + operatorsHtml;
    }

    let base = `
        <p><b>Движение:</b> <code>move = int(input())</code>, <code>turn = input()</code></p>
        <p><strong>Доступные операторы:</strong> ${operatorsHtml}</p>
        <p>Обязательно используйте двоеточие (:) в конце оператора и отступ (4 пробела) для кода внутри блока.</p>
        <pre style="background: #2c3e50; color: white; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 5px;">
if переменная_состояния == 'состояние':
    print('Магическое слово')
</pre>
        <p><b>Взаимодействие (Две фазы):</b></p>
        <p>1. Приветствие: Подойди к Камню и произнеси Магическое Приветствие (Для 1 Абракадабра, для остальных скажет Эссенция)</p>
        <p>2. Условие: Используй \`if\`, чтобы произнести верное Магическое Слово и узнать Кодовое Слово для Прохода.</p>
        <p>3. Проход (Портал): Переместись к указанному Проходу и произнеси его Кодовое Слово.</p>
    `;
    return base;
}


// --- Вспомогательная функция для генерации подсказок по операторам ---
function getTaskHint(levelData) {
    let hint = `<p><b>Разговор с эссенцией</b> Используй print("Спросить")</p>`;
    if (levelData.id === '3.1') {
        hint += `<p><b>❗ ВНИМАНИЕ:</b> Для активации Камня используй приветственное слово <code>"Абракадабра"</code></p>`;
    }
    hint += `<p><b>Возможные состояния (Камня):</b> ${levelData.possibleStates.join(', ')}</p>`;
    hint += `<p><b>Правильный ответ:</b> В зависимости от состояния, произнеси магическое слово (<code>print("Слово")</code>), чтобы Камень указал тебе Проход и Кодовое Слово для его открытия.`;
    return hint;
}

// -------------------------------------------------------------------------------------------------
// Урок 3: УСЛОВНЫЕ ОПЕРАТОРЫ 
// -------------------------------------------------------------------------------------------------

const PART_3_LEVELS = [
    // Уровень 3.1 (ОРИГИНАЛЬНЫЙ)
    {
        id: '3.1',
        name: 'Состояние Камня (if/else)',
        passages: 2, 
        currentState: 'hot', 
        possibleStates: ['hot', 'cold'],
        correctPassageIndex: 1, 
        correctCodeword: 'Fireball', // Магическое слово для активации
        magicWords: { 
            'hot': 'Fireball',
            'cold': 'Freeze'
        },
        description: "<b>❗ Для активации Камня сначала произнеси приветственное слово: \"Абракадабра\"</b>. Камень может быть <b>'hot'</b> или <b>'cold'</b> (значение хранится в переменной stone_temp). Используй if/else, чтобы произнести магическое слово: <b>Fireball</b> (если `hot`) или <b>Freeze</b> (если `cold`). ",
        operators: ['<code>if:</code>', '<code>else:</code>', '<code>==</code>'],
        // 🛑 НОВОЕ: Переменная, которую использует игрок
        levelVariable: 'stone_temp', 
        levelVariableValue: null,
        requiredGreeting: 'Абракадабра', // Стандартное приветствие
        entities: [
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
            // Порталы генерируются в setupDynamicLevel
        ]
    },
    
    // 🛑 НОВЫЙ УРОВЕНЬ 3.2: Четное/Нечетное число
    {
        id: '3.2',
        name: 'Четность/Нечетность Числа',
        passages: 2, 
        currentState: null, 
        possibleStates: ['even', 'odd'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            'even': 'Flow',
            'odd': 'Stop'
        },
        description: "Эссенция сообщит Приветственное Заклинание. Камень имеет числовое состояние (`number`). Используй оператор остатка от деления (`%`) с `if/else`, чтобы определить, четно ли число (<code>number % 2 == 0</code>), и произнеси <b>'Flow'</b> (если четное) или <b>'Stop'</b> (если нечетное).",
        operators: ['<code>if:</code>', '<code>else:</code>', '<code>==</code>', '<code>%</code>'],
        levelVariable: 'number', 
        levelVariableValue: null, 
        requiredGreeting: null, 
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
   },

    // 🛑 НОВЫЙ УРОВЕНЬ 3.3: Сравнение двух состояний
    {
        id: '3.3',
        name: 'Сравнение Двух Энергий',
        passages: 3, 
        currentState: null, 
        possibleStates: ['high_low', 'low_high', 'equal'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            'high_low': 'Superior',
            'low_high': 'Inferior',
            'equal': 'Balance'
        },
        description: "Эссенция сообщит Приветственное Заклинание. Камень хранит две числовые энергии, `energy_a` и `energy_b`. Используй `if/elif/else` с операторами сравнения (`>`, `<`) для определения: <b>'Superior'</b> (если `a > b`), <b>'Inferior'</b> (если `a < b`), или <b>'Balance'</b> (если `a == b`).",
        operators: ['<code>if</code>', '<code>elif</code>', '<code>else</code>', '<code>></code>', '<code><</code>', '<code>==</code>'],
        levelVariable: 'energy_a', // Будет использоваться для энергии 'a'
        levelVariableValue: null, 
        requiredGreeting: null, 
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    },
    
    // Уровень 3.2 (ОРИГИНАЛЬНЫЙ) -> ПЕРЕИМЕНОВАН В 3.4
    {
        id: '3.4', // ID изменен с 3.2 на 3.4
        name: 'Эссенция и Состояние Камня (2 фазы)',
        passages: 3, 
        currentState: null, 
        possibleStates: ['high', 'mid', 'low'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { // Слова, используемые в IF (зависят от Stone's state)
            'high': 'Shout',
            'mid': 'Echo',
            'low': 'Whisper'
        },
        description: "Сначала подойди к Источнику Приветствия (Эссенции) и произнеси <code>print(\"Спросить\")</code>, чтобы узнать Приветственное Заклинание. Затем подойди к Камню, произнеси заклинание. Далее используй `if/elif/else` с переменной состояния Камня `stone_temp`: произнеси <b>'Shout'</b> (если `high`), <b>'Echo'</b> (если `mid`), или <b>'Whisper'</b> (если `low`).",
        operators: ['<code>if</code>', '<code>elif</code>', '<code>else</code>', '<code>==</code>', '<code><=</code>', '<code>></code>'],
        levelVariable: 'stone_temp', // Переменная для if/elif
        levelVariableValue: null, 
        requiredGreeting: null, // Будет установлено динамически
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null), // Будет содержать Приветственное Заклинание
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    },
    
    // 🛑 НОВЫЙ УРОВЕНЬ 3.5: Квадратное уравнение (Дискриминант)
    {
        id: '3.5',
        name: 'Квадратное Уравнение (Дискриминант)',
        passages: 3, 
        currentState: null, 
        possibleStates: ['positive', 'zero', 'negative'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            'positive': 'TwoRoots',
            'zero': 'OneRoot',
            'negative': 'NoRoots'
        },
        description: "Эссенция сообщит Приветственное Заклинание. Камень хранит значение Дискриминанта `D`. Используй `if/elif/else` для проверки знака `D`: произнеси <b>'TwoRoots'</b> (если `D > 0`), <b>'OneRoot'</b> (если `D == 0`), или <b>'NoRoots'</b> (если `D < 0`).",
        operators: ['<code>if</code>', '<code>elif</code>', '<code>else</code>', '<code>></code>', '<code><</code>', '<code>==</code>'],
        levelVariable: 'D', // Переменная для Дискриминанта
        levelVariableValue: null, 
        requiredGreeting: null, 
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    },

    // 🛑 НОВЫЙ УРОВЕНЬ 3.6: Сравнение трех состояний
    {
        id: '3.6',
        name: 'Самая Большая Энергия из Трех',
        passages: 3, 
        currentState: null, 
        possibleStates: ['A_max', 'B_max', 'C_max'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            'A_max': 'Alpha',
            'B_max': 'Beta',
            'C_max': 'Gamma'
        },
        description: "Эссенция сообщит Приветственное Заклинание. Камень хранит три энергии: `e_a`, `e_b`, `e_c`. Используй `if/elif/else` с логическим оператором `and` (например, `if e_a > e_b and e_a > e_c:`): произнеси <b>'Alpha'</b> (если `e_a` - максимум), <b>'Beta'</b> (если `e_b` - максимум), или <b>'Gamma'</b> (если `e_c` - максимум).",
        operators: ['<code>if</code>', '<code>elif</code>', '<code>else</code>', '<code>></code>', '<code>and</code>'],
        levelVariable: 'e_a', // Будет использоваться для e_a
        levelVariableValue: null, 
        requiredGreeting: null, 
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    },
    
    // Уровень 3.3 (ОРИГИНАЛЬНЫЙ) -> ПЕРЕИМЕНОВАН В 3.7
    {
        id: '3.7', // ID изменен с 3.3 на 3.7
        name: 'Двойное Состояние (Асимметричный Вложенный if)',
        passages: 4, 
        currentState: null, 
        // Изменены возможные состояния для отражения новой асимметрии
        possibleStates: ['hot', 'cold', 'clean', 'dirty', 'cracked', 'whole'],
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            // Новые комбинации
            'hot_dirty': 'Cleanse', // hot + dirty
            'hot_clean': 'Inferno',
            'cold_cracked': 'Shatter',
            'cold_whole': 'Heal' // cold + whole
        },
        description: "Камень имеет <b>температуру</b> (`temp`) и <b>дополнительное состояние</b> (`surface`). Используй <b>вложенный <code>if</code></b>: <b>'Inferno'</b> (если `temp == 'hot'` и `surface == 'clean'`), <b>'Cleanse'</b> (если `hot` и `dirty`), <b>'Shatter'</b> (если `cold` и `cracked`), или <b>'Heal'</b> (если `cold` и `whole`).",
        operators: ['<code>if</code>', '<code>==</code>', '<code>and</code>', '<code>Вложенный if</code>'],
        requiredGreeting: null, // Будет установлено динамически
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    },

    // 🛑 НОВЫЙ УРОВЕНЬ 3.8: Сравнение четырех состояний
    {
        id: '3.8',
        name: 'Самая Большая Энергия из Четырех',
        passages: 4, 
        currentState: null, 
        possibleStates: ['A_max', 'B_max', 'C_max', 'D_max'], // Stone's possible states for IF
        correctPassageIndex: null, 
        correctCodeword: null,     
        magicWords: { 
            'A_max': 'First',
            'B_max': 'Second',
            'C_max': 'Third',
            'D_max': 'Fourth'
        },
        description: "Эссенция сообщит Приветственное Заклинание. Камень хранит четыре энергии: `e1`, `e2`, `e3`, `e4`. Используй `if/elif/elif/else` с логическим оператором `and` для определения наибольшей энергии: произнеси <b>'First'</b> (если `e1` - максимум), <b>'Second'</b> (если `e2` - максимум), <b>'Third'</b> (если `e3` - максимум), или <b>'Fourth'</b> (если `e4` - максимум).",
        operators: ['<code>if</code>', '<code>elif</code>', '<code>else</code>', '<code>></code>', '<code>and</code>'],
        levelVariable: 'e1', // Будет использоваться для e1
        levelVariableValue: null, 
        requiredGreeting: null, 
        entities: [
            createEntity('Источник Приветствия', 'essence', 'source', 0, 0, null),
            createEntity('Камень Направления', 'direction_stone', 'target', 0, 0),
        ]
    }
];

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomPosition(existingPositions = []) {
    const GRID_SIZE = PLAYER_SIZE; 
    const PADDING = 1; 
    
    let newX, newY, attempts = 0;
    let isCollision = true;

    while (isCollision && attempts < 100) {
        const totalGridX = Math.floor(canvas.width / GRID_SIZE); 
        const totalGridY = Math.floor(canvas.height / GRID_SIZE);
        
        const minGridIndex = 1; 
        const maxGridX_Index = totalGridX - 2; 
        const maxGridY_Index = totalGridY - 2; 

        if (maxGridX_Index < minGridIndex || maxGridY_Index < minGridIndex) {
            const fallbackMaxX = Math.floor((canvas.width - PLAYER_SIZE) / GRID_SIZE);
            const fallbackMaxY = Math.floor((canvas.height - PLAYER_SIZE) / GRID_SIZE);
            newX = getRandomInt(0, fallbackMaxX) * GRID_SIZE; 
            newY = getRandomInt(0, fallbackMaxY) * GRID_SIZE;
        } else {
            newX = getRandomInt(minGridIndex, maxGridX_Index) * GRID_SIZE; 
            newY = getRandomInt(minGridIndex, maxGridY_Index) * GRID_SIZE;
        }

        isCollision = existingPositions.some(pos => {
            const minDistance = GRID_SIZE * (PADDING + 1);
            return Math.abs(newX - pos.x) < minDistance && Math.abs(newY - pos.y) < minDistance;
        });

        if (existingPositions.length === 0) {
            isCollision = false; 
        }
        attempts++;
    }
    
    return { x: newX, y: newY };
}

function setupRandomPositions(levelData) {
    const occupiedPositions = [];

    levelData.entities.forEach(entity => {
        const newPos = generateRandomPosition(occupiedPositions);
        entity.x = newPos.x;
        entity.y = newPos.y;
        occupiedPositions.push(newPos);
    });

    const playerPos = generateRandomPosition(occupiedPositions);
    playerX = playerPos.x;
    playerY = playerPos.y;
}


function setupDynamicLevel(levelData) {
    // --- Phase 0: Select the Passage Codeword (NEW) ---
    const randomCodewordIndex = getRandomInt(0, PASSAGE_CODEWORDS.length - 1);
    levelData.passageCodeword = PASSAGE_CODEWORDS[randomCodewordIndex]; // NEW PROPERTY
    
    // --- Phase 1: Dynamic Level Setup (Stones/Sources) ---
    levelData.correctPassageIndex = getRandomInt(1, levelData.passages); 
    
    // Вспомогательная логика для случайного выбора правильного ответа (Магическое Слово)
    let tempCodeword = levelData.magicWords[Object.keys(levelData.magicWords)[getRandomInt(0, Object.keys(levelData.magicWords).length - 1)]]; 
    levelData.correctCodeword = tempCodeword; // Это слово для активации Камня

    switch (levelData.id) {
        case '3.1': {
            const states = ['hot', 'cold'];
            const state = states[getRandomInt(0, 1)]; // Выбор случайного состояния
            levelData.currentState = state;
            // 🛑 Установка значения переменной уровня
            levelData.levelVariableValue = state; 
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; // Магическое слово для if
            // 🛑 FIX: Инициализация переменной для Уровня 3.1
            pythonVariables['stone_temp'] = state; 
            // 🛑 КОНЕЦ FIX 
            break;
        }
        case '3.2': { // НОВЫЙ УРОВЕНЬ: Четное/Нечетное
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;
            
            const number = getRandomInt(1, 100);
            const state = (number % 2 === 0) ? 'even' : 'odd';
            
            levelData.currentState = state;
            levelData.levelVariableValue = number; 
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; 
            // 🛑 Дополнительная переменная для отображения
            pythonVariables['number'] = levelData.levelVariableValue;
            break;
        }
        case '3.3': { // НОВЫЙ УРОВЕНЬ: Сравнение двух энергий
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;

            let energy_a = getRandomInt(10, 50);
            let energy_b = getRandomInt(10, 50);

            let state;
            if (energy_a > energy_b) {
                state = 'high_low';
            } else if (energy_b > energy_a) {
                state = 'low_high';
            } else {
                state = 'equal';
            }
            
            levelData.currentState = state;
            levelData.levelVariableValue = energy_a; 
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; 

            // 🛑 Дополнительные переменные для отображения
            pythonVariables['energy_a'] = energy_a;
            pythonVariables['energy_b'] = energy_b;
            break;
        }
        case '3.4': { // ОРИГИНАЛЬНЫЙ 3.2
            // 🛑 ИЗМЕНЕНИЕ: Эссенция дает ПРИВЕТСТВЕННОЕ СЛОВО
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;
            // Установка состояния Камня (stone_temp)
            const stoneStates = ['high', 'mid', 'low'];
            const stoneState = stoneStates[getRandomInt(0, 2)];
            
            levelData.currentState = stoneState;
            levelData.levelVariableValue = stoneState; 
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; // Магическое слово для if
            pythonVariables['stone_temp'] = stoneState;
            break;
        }
        case '3.5': { // НОВЫЙ УРОВЕНЬ: Дискриминант
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;

            const a = getRandomInt(1, 5);
            const b = getRandomInt(-10, 10);
            const c = getRandomInt(-10, 10);
            
            // Расчет Дискриминанта: D = b*b - 4*a*c
            const D = b * b - 4 * a * c;
            
            let state;
            if (D > 0) {
                state = 'positive';
            } else if (D === 0) {
                state = 'zero';
            } else {
                state = 'negative';
            }
            
            levelData.currentState = state;
            levelData.levelVariableValue = D; 
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; 

            // 🛑 Дополнительные переменные для отображения
            pythonVariables['D'] = D;
            pythonVariables['a'] = a;
            pythonVariables['b'] = b;
            pythonVariables['c'] = c;
            break;
        }
        case '3.6': { // НОВЫЙ УРОВЕНЬ: Сравнение трех энергий
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;

            let e_a, e_b, e_c;
            
            // Гарантируем уникальность и разное значение
            do {
                e_a = getRandomInt(10, 50);
                e_b = getRandomInt(10, 50);
                e_c = getRandomInt(10, 50);
            } while (e_a === e_b || e_a === e_c || e_b === e_c);
            
            let state;
            if (e_a > e_b && e_a > e_c) {
                state = 'A_max';
            } else if (e_b > e_a && e_b > e_c) {
                state = 'B_max';
            } else {
                state = 'C_max';
            }
            
            levelData.currentState = state;
            levelData.levelVariableValue = e_a; // Переменная для if
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; 

            // 🛑 Дополнительные переменные для отображения
            pythonVariables['e_a'] = e_a;
            pythonVariables['e_b'] = e_b;
            pythonVariables['e_c'] = e_c;
            break;
        }
        case '3.7': { // ОРИГИНАЛЬНЫЙ 3.3
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];

            // 🛑 ИСПРАВЛЕНИЕ: Гарантируем генерацию только асимметричных комбинаций
            // Разрешенные комбинации: hot/dirty, hot/clean, cold/cracked, cold/whole
            const validCombinations = [
                { temp: 'hot', surface: 'dirty', state: 'hot_dirty' },
                { temp: 'hot', surface: 'clean', state: 'hot_clean' },
                { temp: 'cold', surface: 'cracked', state: 'cold_cracked' },
                { temp: 'cold', surface: 'whole', state: 'cold_whole' }
            ];

            const randomCombination = validCombinations[getRandomInt(0, validCombinations.length - 1)];

            const temp = randomCombination.temp;
            const surface = randomCombination.surface;
            const state = randomCombination.state;
            
            // Задаем состояние уровня и кодовое слово
            levelData.currentState = state;
            levelData.correctCodeword = levelData.magicWords[levelData.currentState];
            levelData.requiredGreeting = greetingWord;
            
            // 🛑 Установка переменных для отображения в консоли
            pythonVariables['temp'] = temp;
            pythonVariables['surface'] = surface;
            break;
        }
        case '3.8': { // НОВЫЙ УРОВЕНЬ: Сравнение четырех энергий
            const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
            levelData.requiredGreeting = greetingWord;

            let e1, e2, e3, e4;
            
            // Гарантируем, что они все разные
            const numbers = [];
            while (numbers.length < 4) {
                const r = getRandomInt(10, 50);
                if (numbers.indexOf(r) === -1) numbers.push(r);
            }
            e1 = numbers[0];
            e2 = numbers[1];
            e3 = numbers[2];
            e4 = numbers[3];

            let state;
            if (e1 > e2 && e1 > e3 && e1 > e4) {
                state = 'A_max';
            } else if (e2 > e1 && e2 > e3 && e2 > e4) {
                state = 'B_max';
            } else if (e3 > e1 && e3 > e2 && e3 > e4) {
                state = 'C_max';
            } else {
                state = 'D_max';
            }
            
            levelData.currentState = state;
            levelData.levelVariableValue = e1; // Переменная для if
            levelData.correctCodeword = levelData.magicWords[levelData.currentState]; 

            // 🛑 Дополнительные переменные для отображения
            pythonVariables['e1'] = e1;
            pythonVariables['e2'] = e2;
            pythonVariables['e3'] = e3;
            pythonVariables['e4'] = e4;
            break;
        }
    }
    
    // --- Phase 2: Dynamic Passage (Portal) Generation ---
    const portalEntities = [];
    for (let i = 1; i <= levelData.passages; i++) {
        const portalName = `Проход ${i}`;
        // Тип сущности passage используется для всех порталов. correct_passage не нужен, т.к. статус хранится в levelData.
        const portalType = 'passage'; 
        portalEntities.push(createEntity(portalName, `passage_${i}`, portalType, 0, 0, null, i));
    }
    
    // Add portals to entities list, making sure Direction Stone and Sources are there
    const existingEntities = levelData.entities.filter(e => e.type !== 'passage');
    levelData.entities = [...existingEntities, ...portalEntities];
}


function updateSidebars(levelData) {
    if (!levelData || !levelData.entities) {
        instructionSidebar.style.display = 'block';
        taskSidebar.style.display = 'block';
        return; 
    }
    
    // --- ЛЕВЫЙ САЙДБАР (Инструкции) ---
    instructionSidebar.style.display = 'block';
    instructionContent.innerHTML = getOpHint(levelData.operators);

    // --- ПРАВЫЙ САЙДБАР (Задание) ---
    taskSidebar.style.display = 'block'; 

    let taskHtml = `
        <p style="margin-top: 0;"><b>Задание:</b></p>
        <p>${levelData.description}</p>
        ${getTaskHint(levelData)} 
    `;
    taskContent.innerHTML = taskHtml;
}

function showIntroScreen() {
    introScreen.style.display = 'flex';
    gameContainer.style.opacity = '0'; 
    taskSidebar.style.display = 'none'; 
    instructionSidebar.style.display = 'none'; 
    
    lessonSubtitle.textContent = 'Занятие 3: Условные операторы (if/elif/else)';
    lessonText.innerHTML = `
        Вы прибыли к древнему Камню Направления. Он укажет путь, только если ты назовешь правильное магическое слово, которое зависит от его текущего состояния.<br><br>
        <strong>Условный оператор</strong> (\`if\`, \`elif\`, \`else\`) позволяет программе принимать решения, выполняя разные блоки кода в зависимости от того, истинно условие или ложно.<br>
        <strong>Твоя задача:</strong> Проанализировать состояние объекта, используя условия (\`==\`, \`>\`, \`<=\`), произнести правильное магическое слово, а затем войти в нужный Проход с Кодовым Словом!
    `;
    document.getElementById('start-game-btn').textContent = 'Начать Занятие 3';
}

// Обновите функцию hideIntroAndStart
window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1'; 
    canvas.style.display = 'block'; 
    outputDisplay.style.display = 'block'; 
    gameMainTitle.textContent = `Занятие ${currentPart}`;
    codeInput.placeholder = "if условие:, print(...), move = int(input()), turn = input()"; 
    
    // 🆕 Загружаем сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        currentPart = savedProgress.currentPart || 3;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен (Урок 3):', { currentPart, currentLevel, totalExperience });
    }
    
    // 🆕 Инициализируем опыт при загрузке
    updateExperienceDisplay();
    
    startGame(currentLevel);
    // 🆕 Сохраняем факт начала сессии без опыта
    saveProgressToGoogleSheets('save', 0);
}

// Обновите функцию showWinModal
function showWinModal(isPartComplete = false) {
    // 🆕 ДОБАВЬ ЭТУ СТРОКУ:
    const earnedExp = calculateExperience();
    const expMessage = isPartComplete 
        ? `<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`
        : `<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
    
    if (winModal.querySelector('#modal-text')) {
        winModal.querySelector('#modal-text').innerHTML += expMessage;
    }
    if (isPartComplete) {
        winModal.querySelector('#modal-title').textContent = "Занятие 3 пройдено!";
        winModal.querySelector('#modal-text').innerHTML = `Ты отлично справился с условными операторами! <br> Готов к следующему уроку?`;
        document.getElementById('next-level-btn').textContent = 'Продолжить';
    } else {
        winModal.querySelector('#modal-title').textContent = "Уровень пройден!";
        winModal.querySelector('#modal-text').textContent = "Правильно! Переходим к следующей задаче.";
        document.getElementById('next-level-btn').textContent = 'Следующий уровень';
    }
    document.getElementById('next-level-btn').style.display = 'inline-block'; 
    winModal.style.display = 'flex';
    
    // 🆕 Сохраняем прогресс ПОСЛЕ показа модального окна
    setTimeout(async () => {
        await saveProgressToGoogleSheets('save', earnedExp);
    }, 100);
}

// Обновите функцию nextLevel
window.nextLevel = async function() {
    winModal.style.display = 'none';
    
    if (currentLevel + 1 < PART_3_LEVELS.length) {
        currentLevel++;
        // 🆕 Сохраняем прогресс при переходе на следующий уровень
        await saveProgressToGoogleSheets('save', 0);
        startGame(currentLevel);
    } else {
        // Занятие 3 завершено
        // 🆕 Сохраняем прогресс при завершении занятия
        await saveProgressToGoogleSheets('save', 0);
        showWinModal(true); // Показываем, что часть завершена
    }
}

window.restartLevel = function() { 
    winModal.style.display = 'none';
    startGame(currentLevel);
} 

function startGame(levelIndex) {
    startLevelTracking();
    resetStoneInteractionAttempts();
    if (levelIndex < 0 || levelIndex >= PART_3_LEVELS.length) {
        messageElement.textContent = `Ошибка: Уровень ${levelIndex} не существует. Запущено Занятие 3.1.`;
        levelIndex = 0;
    }
    currentLevel = levelIndex;
    
    const levelSource = PART_3_LEVELS[levelIndex];
    if (!levelSource) {
        messageElement.textContent = "Ошибка загрузки уровня. Проверьте PART_3_LEVELS.";
        return; 
    }
    
    // 🛑 Сброс ВСЕХ переменных для нового уровня, чтобы избежать утечек
    pythonVariables = {}; 
    currentLevelData = JSON.parse(JSON.stringify(levelSource)); 

    setupDynamicLevel(currentLevelData); 
    setupRandomPositions(currentLevelData); 

    // Сброс состояния
    direction = 'вправо';
    lastPrintedResult = null;
    printedExpression = null;
    consoleOutput = "--- Сброс консоли ---\n";
    targetUnlocked = false; // Состояние приветствия Камня
    
    codeInput.value = '';
    messageElement.textContent = `Уровень ${currentLevelData.id}. Введите код.`;
    
    // 🛑 Сброс состояния для двухфазной победы
    levelPhase = 'initial'; 
    requiredPassageIndex = -1;
    requiredCodeword = null;

    // 🛑 КОРРЕКТНАЯ ИНИЦИАЛИЗАЦИЯ: Установка переменной
    // 🛑 Добавляем системное сообщение в консоль (теперь переменная гарантированно есть)
    if (currentLevelData.levelVariable && pythonVariables.hasOwnProperty(currentLevelData.levelVariable)) { 
        // Если переменная уровня определена (например, stone_temp, number, D), выводим ее в консоль
        const varValue = pythonVariables[currentLevelData.levelVariable];
    } 
    
    // 💡 ОБНОВЛЯЕМ КОНСОЛЬ ТОЛЬКО ОДИН РАЗ
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    
    resetGameExecutionState(); 

    updateSidebars(currentLevelData);
    updateReferenceContent()
    resetAnimations();
    startAnimationLoop();
    updateExperienceDisplay();
    drawGame(); 
}

stoneSprite.onload = function() { 
    console.log("Stone sprite loaded");
    drawGame(); 
};

sourceSprite.onload = function() { 
    console.log("Source sprite loaded");
    drawGame(); 
};

function getEntityAnimation(entityId) {
    if (!entityAnimations.has(entityId)) {
        const match = entityId.match(/^(direction_stone|essence)_(\d+)$/);
        if (match) {
            const entityType = match[1] === 'direction_stone' ? 'stone' : 'source';
            const entityIndex = parseInt(match[2]);
            entityAnimations.set(entityId, new EntityAnimation(entityType, entityIndex));
        }
    }
    return entityAnimations.get(entityId);
}

// --- ЛОГИКА ДВИЖЕНИЯ ---

function checkCollision(x, y, entity) {
    // Проверка, находится ли игрок на том же блоке, что и сущность
    const gridSize = PLAYER_SIZE;
    return (
        Math.floor(x / gridSize) === Math.floor(entity.x / gridSize) &&
        Math.floor(y / gridSize) === Math.floor(entity.y / gridSize)
    );
}
let stoneInteractionAttempts = 0;

function resetStoneInteractionAttempts() {
    stoneInteractionAttempts = 0;
}

function handleTargetInteraction(code) {
    if (!currentLevelData) return false;
    // Очищаем сообщение, если оно было об Абракадабре, но игрок теперь ввел код.
    // Логика приветствия теперь в handlePrintForEntity
    
    // Проверка, что игрок не произнес слово, но ожидает ответа
    if (lastPrintedResult === null) {
        const targetEntity = currentLevelData.entities.find(e => e.type === 'target');
        if (targetEntity && checkCollision(playerX, playerY, targetEntity)) {
             messageElement.textContent = "Камень ждет твоего кода с print().";
        }
    }

    return false;
}

function drawDirectionArrow() {
    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    let text = '▶'; 
    if (direction === 'вверх') text = '▲';
    else if (direction === 'вниз') text = '▼';
    else if (direction === 'влево') text = '◀';
    
    ctx.fillText(text, playerX + PLAYER_SIZE + 5, playerY + PLAYER_SIZE / 2 + 5);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    const levelData = currentLevelData;
    ctx.textAlign = 'center';
    
    // =========================================================================
    // 🛑 НАЧАЛО БЛОКА: Настройки и вспомогательные функции для текста
    // =========================================================================

    const PADDING_X = 10; // Отступ по горизонтали
    const PADDING_Y = 6;  // Отступ по вертикали
    const RADIUS = 5;     // Радиус закругления
    
    // Вспомогательная функция для рисования закругленного прямоугольника
    function drawRoundedRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }


    function drawTextWithBackground(text, x, y, fontStyle) {
        ctx.font = fontStyle; 
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        
        const FONT_SIZE_MATCH = fontStyle.match(/(\d+)px/);
        const FONT_SIZE = FONT_SIZE_MATCH ? parseInt(FONT_SIZE_MATCH[1], 10) : 12;

        const textHeight = FONT_SIZE * 1.2; 
        
        // Поправочный коэффициент для компенсации смещения базовой линии
        const VERTICAL_CORRECTION = FONT_SIZE * 0.2; 

        // 1. РАСЧЕТ ПОЗИЦИИ ФОНА
        const bgWidth = textWidth + PADDING_X * 2;
        const bgHeight = textHeight + PADDING_Y * 2;

        const bgX = x - bgWidth / 2;
        // Скорректированная позиция, чтобы центрировать текст вертикально внутри рамки
        const bgY = y - textHeight - PADDING_Y + VERTICAL_CORRECTION; 
        
        // 2. Отрисовка Фона (Белый, ПОЛУПРОЗРАЧНЫЙ, с тенью)
        
        // Настройка тени
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; // Полупрозрачный черный
        ctx.shadowBlur = 3;                    // Размытие
        ctx.shadowOffsetX = -1;                 // Сдвиг влево (left)
        ctx.shadowOffsetY = 2;                  // Сдвиг вниз (bottom)
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; 
        drawRoundedRect(bgX, bgY, bgWidth, bgHeight, RADIUS);

        // ВАЖНО: Сброс тени, чтобы она не применялась к тексту и другим элементам
        ctx.shadowColor = 'transparent'; 
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 3. Отрисовка Текста (Черный, жирный)
        ctx.fillStyle = 'black'; 
        ctx.fillText(text, x, y); 
    }
    // =========================================================================
    // 🛑 КОНЕЦ БЛОКА: Вспомогательные функции
    // =========================================================================


    if (levelData) {
        levelData.entities.forEach((entity, index) => {
            
            // --- DRAWING SOURCE (Эссенция) с анимацией ---
            if (entity.type === 'source') {
                const entityId = `${entity.name_en}_${index}`;
                
                if (sourceSprite.complete) {
                    const animation = getEntityAnimation(entityId);
                    const currentFrame = animation.getCurrentFrame();
                    const sx = currentFrame * FRAME_WIDTH;
                    
                    ctx.drawImage(
                        sourceSprite, 
                        sx, 0, FRAME_WIDTH, FRAME_HEIGHT,
                        entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE
                    );
                } else if (sourceImage.complete) {
                    ctx.drawImage(sourceImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                } else {
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                }
            } 
            
            // --- DRAWING TARGET/STONE с анимацией и PORTALS статично ---
            else if (entity.name_en === 'direction_stone' || entity.type === 'passage') {
                
                // 1. Highlight the entity if player is on it
                if (checkCollision(playerX, playerY, entity)) {
                    ctx.strokeStyle = '#2ecc71';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                }
                
                // 2. Highlight the correct passage AFTER the stone is activated
                if (entity.type === 'passage' && levelPhase === 'stone_activated' && entity.index === requiredPassageIndex) {
                    ctx.strokeStyle = '#3498db';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(entity.x + 5, entity.y + 5, PLAYER_SIZE - 10, PLAYER_SIZE - 10);
                }

                if (entity.type === 'passage') {
                    // Порталы статичные
                    if (passageImage.complete) {
                        ctx.drawImage(passageImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                    }
                }
                else if (entity.name_en === 'direction_stone') {
                    // Камень с анимацией
                    const entityId = `${entity.name_en}_${index}`;
                    
                    if (stoneSprite.complete) {
                        const animation = getEntityAnimation(entityId);
                        const currentFrame = animation.getCurrentFrame();
                        const sx = currentFrame * FRAME_WIDTH;
                        
                        ctx.drawImage(
                            stoneSprite, 
                            sx, 0, FRAME_WIDTH, FRAME_HEIGHT,
                            entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE
                        );
                    } else if (stoneImage.complete) {
                        ctx.drawImage(stoneImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                    }
                }
                
                // =========================================================================
                // 🛑 БЛОК: 4. Draw text (Направляющий камень и Порталы)
                // =========================================================================

                if (entity.name_en === 'direction_stone') {
                    const centerX = entity.x + PLAYER_SIZE / 2;
                    
                    // Draw name
                    drawTextWithBackground(
                        entity.name_ru, 
                        centerX, 
                        entity.y - 25, // Подняли выше
                        'bold 13px "Century Gothic", sans-serif' 
                    );
                    
                } else if (entity.type === 'passage') {
                    const centerX = entity.x + PLAYER_SIZE / 2;
                    // Draw Portal index/name
                    drawTextWithBackground(
                        entity.name_ru, 
                        centerX, 
                        entity.y - 15, // Оригинальная Y-координата
                        'bold 15px "Century Gothic", sans-serif' 
                    );
                }
            }
            
            // =========================================================================
            // 🛑 ИСПРАВЛЕННЫЙ БЛОК: Draw text for Sources
            // =========================================================================
            if (entity.type === 'source') {
                const centerX = entity.x + PLAYER_SIZE / 2;
                const name_ru = entity.name_ru;
                const name_en = `(${entity.name_en})`;

                // 1. Русский текст (entity.name_ru) - САМЫЙ ВЕРХНИЙ
                drawTextWithBackground(
                    name_ru, 
                    centerX, 
                    entity.y - 50, // 🛑 ИЗМЕНЕНИЕ: Подняли значительно выше
                    'bold 13px "Century Gothic", sans-serif' 
                );

                // 2. Английский текст (entity.name_en) - ПОД РУССКИМ ТЕКСТОМ
                drawTextWithBackground(
                    name_en, 
                    centerX, 
                    entity.y - 15, // 🛑 ИЗМЕНЕНИЕ: Подняли, чтобы разместить под русским текстом
                    'bold 13px "Century Gothic", sans-serif' // Используем тот же шрифт/размер
                );
            }
            // =========================================================================
            
        });
    }

    if (playerImage.complete) {
        ctx.drawImage(playerImage, playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    }

    drawDirectionArrow();
}

function fakeMoveInput(steps) {
    if (isNaN(steps) || steps <= 0) {
        messageElement.textContent = "Ошибка: Количество шагов должно быть положительным числом.";
        return false;
    }
    
    let newX = playerX;
    let newY = playerY;
    const distance = steps * STEP_SIZE;

    if (direction === 'вправо') newX += distance;
    else if (direction === 'влево') newX -= distance;
    else if (direction === 'вверх') newY -= distance;
    else if (direction === 'вниз') newY += distance;

    const canvasWidth = canvas.width - PLAYER_SIZE;
    const canvasHeight = canvas.height - PLAYER_SIZE;

    // Проверка границ
    if (newX < 0 || newX > canvasWidth || newY < 0 || newY > canvasHeight) {
        messageElement.textContent = "Ошибка! Движение выходит за пределы поля.";
        return false;
    }

    playerX = newX;
    playerY = newY;
    messageElement.textContent = `Передвинулись на ${steps} шаг(а) в направлении ${direction}.`;
    drawGame(); 
    return true;
}

function fakeTurnInput(newDirection) {
    newDirection = newDirection.toLowerCase().trim();
    if (!['вправо', 'влево', 'вверх', 'вниз'].includes(newDirection)) {
        messageElement.textContent = "Ошибка: Некорректное направление. Ожидается: вправо, влево, вверх, вниз.";
        return false;
    }
    direction = newDirection;
    messageElement.textContent = `Повернулись в направлении ${direction}.`;
    drawGame(); 
    return true;
}

// --- СТАНДАРТНЫЕ ФУНКЦИИ ОБРАБОТКИ КОДА ---

function handleTeacherMode() { 
    if (prompt("Введите пароль учителя:") === TEACHER_PASSWORD) {
        const maxLevel = PART_3_LEVELS.length;
        const levelPrompt = `Введите номер уровня (1 - ${maxLevel}) для Занятия ${currentPart} или 'menu' для возврата в главное меню:`;
        let target = prompt(levelPrompt);

        if (!target) {
            messageElement.textContent = "Режим учителя отменен.";
            return true; 
        }

        target = target.toLowerCase().trim();

        if (target === 'menu') {
            showIntroScreen();
            return true; 
        }

        const targetLevelIndex = parseInt(target) - 1; 

        if (!isNaN(targetLevelIndex) && targetLevelIndex >= 0 && targetLevelIndex < maxLevel) {
            startGame(targetLevelIndex);
            messageElement.textContent = `Переход на уровень ${PART_3_LEVELS[targetLevelIndex].id} успешно выполнен.`;
        } else {
            messageElement.textContent = `Ошибка: Некорректный номер уровня. Доступны: 1-${maxLevel}.`;
        }
    } else {
        messageElement.textContent = "Неверный пароль учителя.";
    }
    return true; 
} 

function getEntityData(name_en) {
    const entity = currentLevelData.entities.find(e => e.name_en === name_en);
    if (!entity) return null;
    
    // В уровне 3.2 сущность Essence не дает переменную для IF, только приветствие.
    if (currentLevelData.id === '3.1' && entity.name_en === 'essence') {
        // Мы используем print('Спросить') для получения приветствия, 
        // поэтому getEntityData для Essence остается неиспользуемым.
        return null; 
    }
    
    // В других случаях, если сущность-источник, она может давать значение (например, в 3.3)
    if (entity.type === 'source' && entity.value !== null) {
        return null; 
    }
    return null;
}

// 🛑 ЛОГИКА ВЗАИМОДЕЙСТВИЯ (с проверкой IF)
function handlePrintForEntity(line) {
    const match = line.match(/^print\s*\((.+?)\s*\)$/);
    if (!match) {
        return true; 
    }
    
    let content = match[1].trim();
    
    // 1. Проверка на строковое значение (магическое слово/кодовое слово)
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        lastPrintedResult = content.slice(1, -1);
        consoleOutput += `[Консоль] ${lastPrintedResult}\n`; // Выводим в консоль
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        
        // --- TWO-PHASE WIN CHECK ---
        
        const targetEntity = currentLevelData.entities.find(e => e.name_en === 'direction_stone');
        const essenceEntity = currentLevelData.entities.find(e => e.name_en === 'essence'); // Для 3.2
        const isCollidingWithStone = targetEntity && checkCollision(playerX, playerY, targetEntity);
        const isCollidingWithEssence = essenceEntity && checkCollision(playerX, playerY, essenceEntity);
        
        const requiredGreetingWord = currentLevelData.requiredGreeting; // Приветственное слово для Камня
        
        // A. ESSENCE GREETING CHECK (Level 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8 only)
        if (currentLevelData.id !== '3.1' && isCollidingWithEssence && lastPrintedResult === 'Спросить') {
            consoleOutput += `[ЭССЕНЦИЯ]: Приветственное слово: '${requiredGreetingWord}'\n`; 
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            messageElement.textContent = `Эссенция назвала Приветственное Слово: "${requiredGreetingWord}". Используй его, чтобы активировать Камень Направления.`;
            return true;
        }

        // B. STONE GREETING CHECK: If not unlocked and prints the required greeting
        // Проверяем либо 'Абракадабра' (3.1), либо слово от Эссенции (3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8)
        if (isCollidingWithStone && lastPrintedResult === requiredGreetingWord && !targetUnlocked) {
            targetUnlocked = true;
            consoleOutput += "[КАМЕНЬ]: Кадабра\n"; 
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            messageElement.textContent = "Камень ответил! Теперь введите ваш код с `if` для выбора Прохода.";
            return true; 
        } else if (isCollidingWithStone && lastPrintedResult !== requiredGreetingWord && !targetUnlocked) {
             messageElement.textContent = `Неверное приветственное слово: "${lastPrintedResult}". Камень остался нем. Если уровень не 3.1, Приветственное Слово нужно узнать у Эссенции.`;
             return true;
        }
        
        // C. STONE ACTIVATION CHECK (Phase 1): If unlocked and prints the correct Magic Word (from if/elif/else)
        if (isCollidingWithStone && targetUnlocked && levelPhase === 'initial') {
            
            // Сравниваем с Магическим Словом (Fireball/Freeze/Shout и т.д.)
            if (lastPrintedResult === currentLevelData.correctCodeword) {
                
                // 🛑 CRITICAL CHECK 1: Enforce IF USAGE
                if (!currentExecutionFlags.isConditional) {
                     messageElement.textContent = `Победа не засчитана! Ты произнес правильное слово ("${currentLevelData.correctCodeword}"), но должен был использовать условный оператор (if/elif/else), чтобы его выбрать. Код остановлен.`;
                     stoneInteractionAttempts++;
                     return false; // Stop execution
                }
                
                // 🛑 CRITICAL CHECK 2: Enforce VARIABLE USAGE
                if (currentLevelData.levelVariable && !currentExecutionFlags.usedLevelVariable) {
                    messageElement.textContent = `Победа не засчитана! Ты произнес правильное слово, но должен был использовать переменную ${currentLevelData.levelVariable} в условии. Код остановлен.`;
                    stoneInteractionAttempts++;
                    return false; // Stop execution
                }
                
                // --- SUCCESS ---
                levelPhase = 'stone_activated';
                // 🛑 Используем СЛУЧАЙНОЕ КОДОВОЕ СЛОВО для Прохода
                requiredCodeword = currentLevelData.passageCodeword; 
                requiredPassageIndex = currentLevelData.correctPassageIndex;
                
                // 🛑 ВАЖНЫЙ ОТВЕТ КАМНЯ
                const stoneResponse = `Успех! Камень указал тебе на Проход ${requiredPassageIndex}. Кодовое Слово: "${requiredCodeword}". Теперь иди к Проходу и произнеси его.`;
                consoleOutput += `[КАМЕНЬ]: ${stoneResponse}\n`;
                outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
                stoneInteractionAttempts++;
                messageElement.textContent = stoneResponse;
                drawGame(); 
            } else {
                if (lastPrintedResult === 'Error') {
                     messageElement.textContent = `Ошибка логики! Ты произнес слово "Error". Проверь, правильно ли ты использовал условия.`;
                } else {
                    messageElement.textContent = `Неверное магическое слово: "${lastPrintedResult}". Камень остался нем. Попробуй изменить условие.`;
                }
            }
            return true;
        }

        // D. PASSAGE CHECK (Phase 2): Interacting with a Passage (Portal)
        const currentPortal = currentLevelData.entities.find(e => 
            e.type === 'passage' && checkCollision(playerX, playerY, e)
        );
        
        if (currentPortal) {
            if (levelPhase !== 'stone_activated') {
                messageElement.textContent = `Сначала нужно активировать Камень Направления, чтобы узнать, какой Проход верный.`;
                return true;
            }
            
            if (currentPortal.index === requiredPassageIndex) {
                if (lastPrintedResult === requiredCodeword) { // Сравниваем с новым requiredCodeword
                    messageElement.textContent = `Победа! Ты прошел через Проход ${requiredPassageIndex} с правильным Кодовым Словом!`;
                    setTimeout(() => showWinModal(false), 1000);
                } else {
                    messageElement.textContent = `Ты на правильном Проходе, но произнес не то Кодовое Слово. Кодовое Слово: "${requiredCodeword}". Попробуй еще раз.`;
                }
            } else {
                messageElement.textContent = `Это не тот Проход, на который указал Камень Направления. Попробуй найти Проход ${requiredPassageIndex}.`;
            }
            return true;
        }


        // Fallback if not on Stone or Portal
        if (lastPrintedResult !== requiredGreetingWord && lastPrintedResult !== 'Спросить' && !isCollidingWithStone && !isCollidingWithEssence) {
             messageElement.textContent = `Магическое слово "${lastPrintedResult}" произнесено впустую. Нужно подойти к Камню Направления или к Проходу.`;
        }
        return true;

    } else {
        // Это не строковое значение, просто выводим в консоль
        let value;
        try {
            // Используем корректную регулярку для игнорирования строковых литералов в print
            value = eval(content.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]+)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;
                
                if (pythonVariables.hasOwnProperty(variableName)) {
                    const varValue = pythonVariables[variableName];
                    return typeof varValue === 'string' ? `'${varValue}'` : varValue;
                }
                throw new Error(`Переменная ${variableName} не определена.`);
            }));
            
        } catch (error) {
            consoleOutput += `[Ошибка: print] ${error.message}\n`;
            outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
            messageElement.textContent = `Ошибка в print(): ${error.message}`;
            return false;
        }

        consoleOutput += `[Консоль] ${value}\n`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        lastPrintedResult = value;
        return true;
    }
}


function handleAssignment(line) {
    const parts = line.split('=').map(p => p.trim());
    if (parts.length !== 2) return false;

    const varName = parts[0];
    let expression = parts[1];

    if (!/^[a-zA-Z_]\w*$/.test(varName)) {
        messageElement.textContent = `Ошибка присвоения: Некорректное имя переменной: ${varName}`;
        return false;
    }
    
    // 1. Попытка собрать данные от сущности (x = entity_name_en)
    const entityValue = getEntityData(expression);
    if (entityValue !== null) {
        // Проверка на столкновение с сущностью-источником
        const sourceEntity = currentLevelData.entities.find(e => e.name_en === expression);
        if (sourceEntity && !checkCollision(playerX, playerY, sourceEntity)) {
            messageElement.textContent = `Ошибка! Чтобы получить значение ${expression}, нужно подойти к Источнику.`;
            return false;
        }
        
        pythonVariables[varName] = entityValue;
        consoleOutput += `[Консоль] ${varName} = ${typeof entityValue === 'string' ? `'${entityValue}'` : entityValue}\n`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        messageElement.textContent = `Переменной ${varName} присвоено значение ${typeof entityValue === 'string' ? `'${entityValue}'` : entityValue} от сущности.`;
        return true;
    }

    // 2. Обычное присвоение (x = 5, x = 'string', x = y + 1)
    let value;
    try {
        // Используем корректную регулярку для игнорирования строковых литералов в присвоении
        value = eval(expression.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]+)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
            if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
            if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;

            if (pythonVariables.hasOwnProperty(variableName)) {
                 const varValue = pythonVariables[variableName];
                 return typeof varValue === 'string' ? `'${varValue}'` : varValue;
            }
            return variableName; 
        }));
    } catch (error) {
        messageElement.textContent = `Ошибка присвоения: Некорректное выражение: ${expression}`;
        return false;
    }

    pythonVariables[varName] = value;
    consoleOutput += `[Консоль] ${varName} = ${typeof value === 'string' ? `'${value}'` : value}\n`;
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    messageElement.textContent = `Переменной ${varName} присвоено значение.`;
    return true;
}

// 🛑 evaluateCondition
function evaluateCondition(conditionText) {
        
    const jsCondition = conditionText.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]+)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
        if (stringLiteralSingle !== undefined) {
            return `'${stringLiteralSingle}'`;
        }
        if (stringLiteralDouble !== undefined) {
            return `'${stringLiteralDouble}'`;
        }
        
        if (pythonVariables.hasOwnProperty(variableName)) {
            // 🛑 УНИВЕРСАЛЬНОЕ ИСПРАВЛЕНИЕ:
            // Если используется любая переменная из игрового состояния, устанавливаем флаг.
            currentExecutionFlags.usedLevelVariable = true;
            console.log(`[EVAL_COND] Flag set: usedLevelVariable=true (переменная: ${variableName} использована)`);
            
            const varValue = pythonVariables[variableName];
            return typeof varValue === 'string' ? `'${varValue}'` : varValue; 
        }
        
        throw new Error(`Переменная ${variableName} не определена.`);
    });


    try {
        const evaluated = eval(jsCondition.replace(/and/g, '&&').replace(/or/g, '||').replace(/True/g, 'true').replace(/False/g, 'false'));
        return !!evaluated; 
    } catch (e) {
        // 🛑 ЭТА ОШИБКА ВИДНА В КОНСОЛИ
        consoleOutput += `[Ошибка условия] Не удалось вычислить условие: ${conditionText}. Ошибка: ${e.message}\n`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        messageElement.textContent = `Ошибка в условии: ${e.message}`;
        throw new Error("Condition Error"); // Эта ошибка прерывает выполнение в executeCode
    }
}

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (для контекста, предполагается, что они объявлены выше)
// let isSkippingBlock = false;
// let currentBlockIndentation = 0;
// let ifConditionMetInBlock = false; 

// 🛑 СБРОС (с флагами IF)
function resetGameExecutionState() {
    isSkippingBlock = false;
    currentBlockIndentation = 0;
    ifConditionMetInBlock = false; // Глобальный флаг, отслеживающий выполнение IF/ELIF
    // 🛑 Сброс флагов проверки IF
    currentExecutionFlags.isConditional = false;
    currentExecutionFlags.usedLevelVariable = false;
}

// --- ОСНОВНАЯ ЛОГИКА ВЫПОЛНЕНИЯ КОДА (executeCode) ---

window.executeCode = function() { 
    const code = codeInput.value;
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    // Инициализация стека состояния потока управления
    let controlFlowStack = [{ indentation: 0, conditionMet: false, isSkipping: false }];
    
    if (lines[0] && lines[0].toLowerCase() === 'go') {
        return handleTeacherMode();
    }
    
    lastPrintedResult = null; 
    printedExpression = null; 
    resetGameExecutionState(); 
    consoleOutput += "\n--- Выполнение кода ---\n";
    console.log("--- START EXECUTION ---");

    for (let i = 0; i < lines.length; i++) {
        
        const lineWithIndentation = lines[i];
        const normalizedLine = lineWithIndentation.replace(/\u00a0/g, ' '); 
        let lineIndentation = 0;
        let line = normalizedLine;
        
        while (line.startsWith(' ')) {
            lineIndentation++;
            line = line.substring(1);
        }
        
        const trimmedLine = line.trim();

        console.log(`\n[READ ${i+1}/${lines.length}] Indent: ${lineIndentation}, CurrentBlock: ${currentBlockIndentation}, StackDepth: ${controlFlowStack.length}, Line: ${trimmedLine}`);
        
        const isControlFlowOperator = trimmedLine.startsWith('elif ') || trimmedLine.startsWith('else:') || trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(');

        // --- 1. Обработка ввода (input) ---
        if (trimmedLine.includes('move = int(input())')) {
            const steps = prompt("move = int(input()): Введите количество шагов:");
            if (!fakeMoveInput(parseInt(steps))) return;
            console.log(`[INPUT] move=${steps} processed.`);
            continue;
        } else if (trimmedLine.includes('turn = input()')) {
            const newDirection = prompt("turn = input(): Введите направление (вправо, влево, вверх, вниз):");
            if (!fakeTurnInput(newDirection)) return;
            console.log(`[INPUT] turn=${newDirection} processed.`);
            continue;
        }
        
        // --- 2. Логика выхода из блока (IF/ELIF/ELSE) ---
        if (lineIndentation < currentBlockIndentation) {
            console.log(`[BLOCK_EXIT_START] Indent (${lineIndentation}) < CurrentBlock (${currentBlockIndentation}). Checking stack collapse.`);
            
            // Если мы наткнулись на elif/else на том же уровне, мы не выходим из родительского блока.
            // Это предотвращает срабатывание вложенных elif/else, если отступ совпадает.
            if (isControlFlowOperator && lineIndentation === controlFlowStack[controlFlowStack.length - 1].indentation) {
                console.log(`[BLOCK_EXIT] Same-level control flow (${trimmedLine}). Skip stack pop.`);
            } else {
                // Стандартный выход из блока (сворачивание стека)
                let pops = 0;
                while (controlFlowStack.length > 1 && lineIndentation <= controlFlowStack[controlFlowStack.length - 1].indentation) {
                    controlFlowStack.pop(); 
                    pops++;
                }
                console.log(`[BLOCK_EXIT] Collapsed stack. Popped ${pops} levels. StackDepth: ${controlFlowStack.length}`);
                
                const parentBlock = controlFlowStack[controlFlowStack.length - 1];
                
                isSkippingBlock = parentBlock.isSkipping; 
                ifConditionMetInBlock = parentBlock.conditionMet;
                
                currentBlockIndentation = 0;
                if (controlFlowStack.length > 1) { 
                    currentBlockIndentation = controlFlowStack[controlFlowStack.length - 1].indentation + 4;
                } else {
                    currentBlockIndentation = 0;
                }
                console.log(`[BLOCK_EXIT] New state: isSkippingBlock=${isSkippingBlock}, CurrentBlock=${currentBlockIndentation}`);
            }
        }

        // --- 3. Обработка условных операторов (IF/ELIF/ELSE) ---
        const isElif = trimmedLine.startsWith('elif ') || trimmedLine.startsWith('elif(');
        const isIf = trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(');
        const isElse = trimmedLine.startsWith('else:'); 

        if (isIf || isElif || isElse) {
            
            if (!trimmedLine.endsWith(':')) {
                messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Ожидается двоеточие (:) в конце оператора.`;
                return;
            }

            const currentLevel = controlFlowStack[controlFlowStack.length - 1];
            const parentSkipping = currentLevel.isSkipping;
            const isNewNestedBlock = lineIndentation > currentLevel.indentation;

            // 🛑 ИСПРАВЛЕНИЕ: Новая логика для определения skipping status контейнера
            // Для вложенных (Line 2, 7): currentLevel.isSkipping является skip-статусом родителя.
            // Для сиблингов (Line 4, 6, 9): skip-статус контейнера - это элемент в стеке ДО текущей цепочки.
            const containerSkipping = isNewNestedBlock 
                ? currentLevel.isSkipping 
                : (controlFlowStack.length > 1 ? controlFlowStack[controlFlowStack.length - 2].isSkipping : false);


            console.log(`[COND_DEBUG] Start block. ifConditionMetInBlock: ${ifConditionMetInBlock}, Stack Met: ${currentLevel.conditionMet}, isNewNestedBlock: ${isNewNestedBlock}, ParentSkipping: ${parentSkipping}`);
            
            let shouldExecuteBlock = false;
            let conditionText = '';
            
            // Проверка на принудительный пропуск из-за внешнего проваленного блока (Inherited Skip: Line 2, Line 4)
            if (containerSkipping && lineIndentation > 0) { 
                shouldExecuteBlock = false;
                console.log(`[COND_DEBUG] Block skipped due to containerSkipping.`);
            } else if (isIf) { // Обработка IF
                conditionText = trimmedLine.replace(/^(if)\s*\(*/, '').replace(/\)*:$/, '').trim(); 
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    // Обновление глобального флага
                    ifConditionMetInBlock = shouldExecuteBlock;
                    console.log(`[COND_DEBUG] IF result: ${shouldExecuteBlock}`);
                } catch (e) { return; }
            } else if (isElif) { // Обработка ELIF
                // Используем глобальный флаг для проверки предыдущего условия
                if (!ifConditionMetInBlock) {    
                    conditionText = trimmedLine.replace(/^(elif)\s*\(*/, '').replace(/\)*:$/, '').trim(); 
                    try {
                        const conditionResult = evaluateCondition(conditionText);
                        shouldExecuteBlock = conditionResult;
                        // Обновление глобального флага
                        if (shouldExecuteBlock) {
                            ifConditionMetInBlock = true;
                        }
                        console.log(`[COND_DEBUG] ELIF result: ${shouldExecuteBlock}, New met: ${ifConditionMetInBlock}`);
                    } catch (e) { return; }
                } else {
                    shouldExecuteBlock = false; 
                    console.log(`[COND_DEBUG] ELIF skipped because ifConditionMetInBlock=true`);
                }
            } else if (isElse) { // Обработка ELSE
                // Используем глобальный флаг для проверки предыдущего условия
                console.log(`[COND_DEBUG] ELSE Check: !ifConditionMetInBlock = ${!ifConditionMetInBlock}`);
                shouldExecuteBlock = !ifConditionMetInBlock; 
                // Обновление глобального флага: True, если ELSE сработал.
                if (shouldExecuteBlock) {
                    ifConditionMetInBlock = true;
                }
                console.log(`[COND_DEBUG] ELSE End. Execute: ${shouldExecuteBlock}, ifConditionMetInBlock: ${ifConditionMetInBlock}`);
            }

            // ОБНОВЛЕНИЕ СОСТОЯНИЯ
            // Правильно вычисляем isSkippingBlock
            if (!isNewNestedBlock) {
                // НЕ вложенный блок (elif/else): isSkippingBlock = !shouldExecuteBlock
                isSkippingBlock = !shouldExecuteBlock;
                console.log(`[COND_DEBUG] NOT Nested: Skip=${isSkippingBlock}`);
            } else {
                // Вложенный if: skip = containerSkipping ИЛИ !execute.
                // 🛑 Используем skip-статус родителя в стеке (currentLevel.isSkipping)
                isSkippingBlock = currentLevel.isSkipping || !shouldExecuteBlock;
                console.log(`[COND_DEBUG] Nested: Skip=${isSkippingBlock}`);
            }

            currentBlockIndentation = lineIndentation + 4;    

            // 🛑 ДИАГНОСТИКА
            console.log(`[COND_DEBUG] Final: isSkippingBlock=${isSkippingBlock}, currentBlockIndentation=${currentBlockIndentation}`);

            // ОБНОВЛЕНИЕ СТЕКА СОСТОЯНИЙ
            const newBlockState = {
                indentation: lineIndentation,
                conditionMet: ifConditionMetInBlock, // Записываем в стек актуальный результат цепочки
                isSkipping: isSkippingBlock 
            };

            console.log(`[COND] ${trimmedLine} -> Execute: ${shouldExecuteBlock}, Skip: ${isSkippingBlock}, Met: ${newBlockState.conditionMet} (Stack Update)`);
            
            // Если это команда на том же уровне (elif/else), мы заменяем старый элемент
            if (!isNewNestedBlock) {
                controlFlowStack[controlFlowStack.length - 1] = newBlockState;
            } else {
                // Если это вложенный if, мы добавляем новый элемент
                controlFlowStack.push(newBlockState);
                console.log(`[COND] Stack PUSH: New Depth ${controlFlowStack.length}`);
                // При входе во вложенный IF мы сбрасываем ifConditionMetInBlock, 
                // чтобы внутренняя цепочка ELIF/ELSE работала правильно
                ifConditionMetInBlock = shouldExecuteBlock; 
                console.log(`[COND] Reset ifConditionMetInBlock for nested block to: ${ifConditionMetInBlock}`);
            }
            
            continue;    
        }
        
        // --- 4. Проверка пропуска блока и отступов ---
        if (currentBlockIndentation > 0 && lineIndentation !== currentBlockIndentation) {
            messageElement.textContent = `Ошибка вложенности на строке ${i+1}: Ожидается ${currentBlockIndentation} пробелов, найдено ${lineIndentation}.`;
            return;
        }

        if (isSkippingBlock) {
            console.log(`[SKIP] Line skipped (isSkippingBlock=true)`);
            if (lineIndentation === currentBlockIndentation) {
                continue;
            }
        }
        
        // --- 5. Обработка команд (только если не пропускаем) ---
        currentExecutionFlags.isConditional = (lineIndentation === currentBlockIndentation && currentBlockIndentation > 0);

        if (trimmedLine.startsWith('print')) {    
            const match = trimmedLine.match(/^print\s*\((.+?)\s*\)$/); 
            if (match) {
                if (printedExpression === null) { printedExpression = match[1].trim(); }
            } else {
                messageElement.textContent = `Ошибка синтаксиса: Некорректный формат print(). Ожидается: print(выражение).`;
                return;
            }
            if (!handlePrintForEntity(trimmedLine)) return;
            console.log('EXECUTED: ' + trimmedLine); 
            
        } else if (trimmedLine.includes('=')) {
            if (!handleAssignment(trimmedLine)) return;
            console.log('EXECUTED: ' + trimmedLine); 
            
        } else {
            messageElement.textContent = `Ошибка синтаксиса! Неизвестная команда: "<b>${trimmedLine}</b>"`;
            console.error(`[ERROR STOP] Unknown command on line ${i+1}: ${trimmedLine}`);
            return;
        }
    }
    
    handleTargetInteraction(code);
    console.log("--- FINISHED EXECUTION ---"); 
    
    messageElement.textContent = "Код успешно выполнен. Проверьте консоль и положение.";
    drawGame(); 
}
// --- СПРАВОЧНИК ДЛЯ ЗАНЯТИЯ 3 ---

const REFERENCE_DATA = {
    3: {  // Занятие 3
        title: "Справочник: Занятие 3 - Условные операторы",
        content: `
            <h3>🎮 Движение и Взаимодействие</h3>
            <p><code>move = int(input())</code> - движение на N шагов</p>
            <p><code>turn = input()</code> - поворот (вправо, влево, вверх, вниз)</p>
            <p><code>print("Спросить")</code> - получить Приветственное Слово от Эссенции</p>
            
            <h3>🧠 Условные операторы</h3>
            <p><strong>if:</strong> Проверяет первое условие</p>
            <p><strong>elif:</strong> Проверяет дополнительные условия (если предыдущие false)</p>
            <p><strong>else:</strong> Выполняется, если все условия false</p>
            
            <h3>⚖️ Операторы сравнения</h3>
            <ul>
                <li><code>==</code> - равно</li>
                <li><code>!=</code> - не равно</li>
                <li><code>></code> - больше</li>
                <li><code><</code> - меньше</li>
                <li><code>>=</code> - больше или равно</li>
                <li><code><=</code> - меньше или равно</li>
            </ul>
            
            <h3>🔗 Логические операторы</h3>
            <ul>
                <li><code>and</code> - И (оба условия true)</li>
                <li><code>or</code> - ИЛИ (хотя бы одно true)</li>
                <li><code>not</code> - НЕ (инверсия)</li>
            </ul>
            
            
            <h3>📝 Примечания</h3>
            <p>• Всегда ставьте двоеточие (:) после условий</p>
            <p>• Используйте отступы (4 пробела) для кода внутри блоков</p>
            <p>• Переменные состояния доступны сразу (stone_temp, number, energy_a и т.д.)</p>
        `
    }
};

// Функция обновления справочника
function updateReferenceContent() {
    if (REFERENCE_DATA[currentPart]) {
        document.getElementById('reference-title').textContent = REFERENCE_DATA[currentPart].title;
        document.getElementById('reference-text').innerHTML = REFERENCE_DATA[currentPart].content;
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


// --- Запуск игры при загрузке страницы ---
lessonTitle.textContent = 'Курс "Основы Python"';
showIntroScreen();

// Обновите обработчик DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // 🆕 ИСПРАВЛЕНО: Загружаем опыт из данных ученика
    const studentData = JSON.parse(localStorage.getItem('currentStudent'));
    if (studentData) {
        // Если у ученика уже есть опыт в данных, используем его
        if (studentData.experience !== undefined) {
            totalExperience = studentData.experience;
            console.log('Опыт загружен из данных ученика (Урок 3):', totalExperience);
        }
        
        // 🆕 Убеждаемся, что есть переменные для хранения пройденных уровней ДЛЯ ЭТОГО УЧЕНИКА
        const studentIdentifier = getStudentIdentifier();
        const partKey = '3.0';
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        
        if (!localStorage.getItem(completedKey)) {
            localStorage.setItem(completedKey, '[]');
        }
    }
    
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.onclick = window.hideIntroAndStart; 
    }
    
    // 🆕 Обновляем отображение опыта
    updateExperienceDisplay();
});
