function getStudentIdentifier() {
    const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');
    if (studentData && studentData.lastName && studentData.firstName && studentData.grade && studentData.classLetter && studentData.subgroup) {
        return `${studentData.lastName}_${studentData.firstName}_${studentData.grade}${studentData.classLetter}_${studentData.subgroup}`;
    }
    return 'anonymous';
}


const LESSON_NUMBER = 2;

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
        
        // 🔧 ФОРМАТ КАК В УРОКЕ 1: "2.0" (урок.часть)
        const partKey = `2.0`;
        
        // 🆕 Обновляем текущие данные ученика
        studentData.currentPart = partKey; // Сохраняем как строку "2.0"
        studentData.currentLevel = currentLevel;
        studentData.lastLogin = new Date().toISOString();
        
        // 🆕 ВАЖНО: Берем опыт уже обновленный в calculateExperience()
        // НЕ добавляем earnedExp снова, он уже добавлен к totalExperience
        const currentStudentExp = totalExperience; // Используем текущий опыт
        
        // 🆕 Обновляем опыт в данных ученика
        studentData.experience = currentStudentExp;
        localStorage.setItem('currentStudent', JSON.stringify(studentData));
        
        // 🆕 Формируем ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА (как в уроке 1)
        const studentIdentifier = getStudentIdentifier();
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
        
        const levelKey = `${partKey}.${currentLevel + 1}`;
        
        // 🆕 Добавляем уровень в пройденные, если еще не добавлен
        if (!completedLevels.includes(levelKey) && earnedExp > 0) {
            completedLevels.push(levelKey);
            localStorage.setItem(completedKey, JSON.stringify(completedLevels));
        }
        
        // 🆕 ВАЖНО: Формируем правильный ключ уровня (как в уроке 1)
        const levelKeyForSheet = `${partKey}.${currentLevel + 1}`;
        
        // Формируем данные для отправки - ТАКИЕ ЖЕ КАК В game-lesson1.js
        const dataToSend = {
            action: 'save', // Всегда 'save' как в уроке 1
            password: 'teacher123',
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            classLetter: studentData.classLetter,
            subgroup: studentData.subgroup,
            currentPart: partKey,           // "2.0"
            currentLevel: currentLevel + 1, // +1 для человекочитаемого формата        
            earnedExp: earnedExp,              
            totalExperience: currentStudentExp,
            lessonNumber: 2,       
            partNumber: 0,                 // Часть урока 2 всегда 0
            levelKey: levelKeyForSheet,    // "2.0.1", "2.0.2" и т.д.              
            lastLogin: studentData.lastLogin
        };

        console.log('Отправляю данные на сервер:', dataToSend);
        
        // 🆕 ИСПРАВЛЕНИЕ: Используем тот же URL, что и в lesson1
        fetch('https://script.google.com/macros/s/AKfycbzxAsVN4tNt0d6Uvm--n_vlypPDnflxEQpZ_IvMhEOOzq6KjBlMItvhdWQtB6pAMEJH/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        }).then(() => {
            console.log('Данные отправлены на сервер');
        }).catch(error => {
            console.log('Ошибка отправки:', error);
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
                console.log('Опыт загружен из данных ученика:', totalExperience);
            }

            // 🆕 ИСПРАВЛЕНИЕ: Проверяем формат как в game-lesson1.js
            const savedPart = studentData.currentPart;
            
            // Проверяем разные форматы savedPart
            if (savedPart === '2.0' || savedPart === '2') {
                // Если сохранен Урок 2
                if (studentData.currentLevel !== undefined) {
                    console.log('Загружен уровень', studentData.currentLevel, 'для урока 2');
                    return {
                        success: true,
                        currentPart: 2,
                        currentLevel: studentData.currentLevel
                    };
                }
            } else if (typeof savedPart === 'string' && savedPart.startsWith('1.')) {
                // Если сохранен Урок 1, начинаем Урок 2 с 0
                console.log('Обнаружен Урок 1. Начинаем Урок 2 с 0.');
            } else {
                console.log('Урок не совпадает или нет сохраненного уровня. Начинаем с 0.');
            }
        }

        return {
            success: true,
            currentPart: 2,
            currentLevel: 0
        };

    } catch (error) {
        console.log('Ошибка при загрузке прогресса:', error);
        return {
            success: true,
            currentPart: 2,
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

// 🛑 ИСПРАВЛЕНО: Ссылки на элементы, которые вы оставили в game-main
const lessonTitle = document.getElementById('lesson-title');
const lessonSubtitle = document.getElementById('lesson-subtitle');
const lessonText = document.getElementById('lesson-text');

// 🛑 ИСПРАВЛЕНО: Ссылки на переименованные элементы вводного экрана
const introTitle = document.getElementById('intro-lesson-title');
const introSubtitle = document.getElementById('intro-lesson-subtitle');
const introText = document.getElementById('intro-lesson-text');


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
background.src = '../images/game-bg.png';
background.onload = function() {
    console.log("Фоновое изображение загружено.");
};

// Статические изображения
const targetImage = new Image();
targetImage.src = '../images/target-item.png';
targetImage.onload = function() {
    console.log("Изображение цели загружено.");
};


const playerImage = new Image();
playerImage.src = '../images/player-main.png';
playerImage.onload = function() {
    console.log("Изображение игрока загружено.");
};

// Спрайт-лист для анимации source (16 кадров)
const sourceSprite = new Image();
sourceSprite.src = '../images/source-sprite.png'; // 🆕 Спрайт для источника

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

// Константы анимации (добавьте в начало файла с другими константами)
const SOURCE_TOTAL_FRAMES = 4;       // Источник: 16 кадров
const FRAME_WIDTH = 1098;
const FRAME_HEIGHT = 1098;
const FRAME_INTERVAL = 170;
const MIN_PAUSE_DURATION = 5000;
const MAX_PAUSE_DURATION = 10000;
const ANIMATION_CYCLES = 2;

// Класс для управления анимацией сущности (только для source)
class EntityAnimation {
    constructor(entityIndex) {
        this.totalFrames = SOURCE_TOTAL_FRAMES;
        this.currentFrame = 0;
        this.state = 'idle';
        this.timer = 0;
        this.cyclesCompleted = 0;
        this.isPlaying = false;
        
        this.nextPauseDuration = this.getRandomPauseDuration();
        this.idleTimer = Math.random() * 5000 + (entityIndex * 3000); // Разные задержки
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

// Функция для получения анимации source
function getEntityAnimation(entityId) {
    if (!entityAnimations.has(entityId)) {
        const match = entityId.match(/^source_(\d+)$/);
        if (match) {
            const entityIndex = parseInt(match[1]);
            entityAnimations.set(entityId, new EntityAnimation(entityIndex));
        }
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

// Функция для сброса анимаций
function resetAnimations() {
    entityAnimations.clear();
    
    if (currentLevelData && currentLevelData.entities) {
        currentLevelData.entities.forEach((entity, index) => {
            // Создаем анимацию только для source
            if (entity.type === 'source') {
                const entityId = `source_${index}`;
                entityAnimations.set(entityId, new EntityAnimation(index));
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

// Обработчик загрузки спрайта
sourceSprite.onload = function() { 
    console.log("Source sprite loaded");
    drawGame(); 
};

// --- Параметры Игры и Уровней ---
let currentPart = 2; // Указываем, что это Занятие 2
let currentLevel = 0; 
const PLAYER_SIZE = 70;
const STEP_SIZE = 70; // 🛑 ИСПРАВЛЕНО: Шаг движения равен размеру блока (50px)
const TEACHER_PASSWORD = 'python'; // 🔑 Пароль учителя

// Переменные для эмуляции Python
let pythonVariables = {};
let consoleOutput = ""; 


// Переменные состояния Игрока
let playerX;
let playerY;
let direction;

// Новые переменные для Занятия 2 (фиксированные значения)
let currentLevelData = null; // Для хранения данных текущего уровня
let lastPrintedResult = null; // Хранит результат последнего print() для проверки победы
// ===============================
// СИСТЕМА ОПЫТА (добавлено в начало)
// ===============================

let totalExperience = 0;
let levelStartTime = null;
let levelAttempts = 0;

// Функция для обновления отображения опыта
// Функция для обновления отображения опыта
function updateExperienceDisplay() {
    const expElement = document.getElementById('experience-display');
    if (!expElement) {
        // Создаем элемент, если его нет
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

// Функция для расчета опыта при завершении уровня (ОБНОВЛЕНА)
function calculateExperience() {
    // Используем функцию getStudentIdentifier для уникальности ученика
    let studentIdentifier = getStudentIdentifier();
    
    // 🆕 Ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА (как в уроке 1)
    const partKey = '2.0';
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
    
    console.log("=== РАСЧЕТ ОПЫТА ===");
    console.log(`Попыток взаимодействия с Итоговой Сущностью: ${levelAttempts}`);
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
    
    // 🆕 Обновляем общий опыт (ТОЛЬКО ЗДЕСЬ!)
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
// --- Вспомогательные функции для рандомизации ---

/**
 * Возвращает случайное целое число между min (включительно) и max (включительно).
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Генерирует случайную позицию, выровненную по сетке (50x50), избегая столкновений.
 * ИСПРАВЛЕНИЕ: Теперь генерирует позиции, отступая на 1 блок от всех границ.
 */
function generateRandomPosition(existingPositions = []) {
    const GRID_SIZE = PLAYER_SIZE; 
    const PADDING = 1; 
    
    let newX, newY, attempts = 0;
    let isCollision = true;

    while (isCollision && attempts < 100) {
        // Общее количество блоков по ширине и высоте (напр., 600/50=12, 400/50=8)
        const totalGridX = Math.floor(canvas.width / GRID_SIZE); 
        const totalGridY = Math.floor(canvas.height / GRID_SIZE);
        
        // Диапазон индексов, которые можно использовать, исключая 0 и (totalGrid - 1).
        // Минимальный индекс: 1 (второй блок).
        const minGridIndex = 1; 
        // Максимальный индекс: totalGrid - 2 (предпоследний блок).
        const maxGridX_Index = totalGridX - 2; 
        const maxGridY_Index = totalGridY - 2; 

        // Проверка, есть ли хотя бы один блок для генерации (т.е. 1 <= maxGridIndex)
        if (maxGridX_Index < minGridIndex || maxGridY_Index < minGridIndex) {
            // Фолбэк: если поле слишком маленькое, генерируем как раньше, включая границы.
            const fallbackMaxX = Math.floor((canvas.width - PLAYER_SIZE) / GRID_SIZE);
            const fallbackMaxY = Math.floor((canvas.height - PLAYER_SIZE) / GRID_SIZE);
            newX = getRandomInt(0, fallbackMaxX) * GRID_SIZE; 
            newY = getRandomInt(0, fallbackMaxY) * GRID_SIZE;
            console.warn("Поле слишком маленькое для отступа от границ. Использована генерация на границах.");
        } else {
            // Безопасная генерация вдали от границ
            newX = getRandomInt(minGridIndex, maxGridX_Index) * GRID_SIZE; 
            newY = getRandomInt(minGridIndex, maxGridY_Index) * GRID_SIZE;
        }

        // --- Логика предотвращения столкновений ---
        isCollision = existingPositions.some(pos => {
            const minDistance = GRID_SIZE * (PADDING + 1);
            // Проверка, что расстояние между блоками (по координатам сетки) больше 1 блока.
            return Math.abs(newX - pos.x) < minDistance && Math.abs(newY - pos.y) < minDistance;
        });

        if (existingPositions.length === 0) {
            isCollision = false; 
        }
        // --- Конец Логики предотвращения столкновений ---

        attempts++;
    }
    
    return { x: newX, y: newY };
}


/**
 * Расставляет сущности и игрока в случайные места.
 */
function setupRandomPositions(levelData) {
    const occupiedPositions = [];

    // 1. Расставляем сущности
    levelData.entities.forEach(entity => {
        const newPos = generateRandomPosition(occupiedPositions);
        entity.x = newPos.x;
        entity.y = newPos.y;
        occupiedPositions.push(newPos);
    });

    // 2. Расставляем игрока (playerX, playerY)
    const playerPos = generateRandomPosition(occupiedPositions);
    playerX = playerPos.x;
    playerY = playerPos.y;
}


// --- Вспомогательная функция для создания структуры сущности ---
function createEntity(name_ru, name_en, type, x, y, value = null) {
    return { name_ru, name_en, type, x: 0, y: 0, value };
}

// --- Вспомогательная функция для генерации подсказок по операциям ---
function getOpHint(ops) {
    // 🛑 ИСПРАВЛЕНО: Это общие инструкции, которые всегда отображаются
    let base = `
        <p><b>Движение:</b> <code>move = int(input())</code></p>
        <p><b>Поворот:</b> <code>turn = input()</code></p>
        <p><b>Сбор данных:</b></p>
        <p>Подойдите к сущности-источнику (зеленый огонек) и используйте:</p>
        <p><code>print("Привет, что ты знаешь [Имя]")</code></p>
        <p>Обязательно присвойте значение переменной: <code>ancient_spirit = 5</code></p>
        <p><b>Передача ответа:</b></p>
        <p>Подойдите к сущности-цели (магический алтарь) и используйте:</p>
        <p><code>print(result)</code></p>
    `;
    return base;
}

// --- Вспомогательная функция для генерации подсказок по операторам ---
function getTaskHint(ops) {
    let hint = '';
    if (ops.length > 0) {
        hint += `
            <p><b>Новые операторы:</b></p>
            <ul>
        `;
        ops.forEach(op => {
            hint += `<li>${op}</li>`;
        });
        hint += `</ul>`;
    }
    return hint;
}

// -------------------------------------------------------------------------------------------------
// Урок 2: Взаимодействие, int(input()) и Вычисления 
// -------------------------------------------------------------------------------------------------

const PART_2_LEVELS = [
    { 
        id: '2.1', 
        name: 'Передача данных', 
        requiredValue: 5, 
        description: "Подойди к <b>Древнему Духу</b>, узнай его число и сохрани в переменную. Затем пройди к <b>Алтарю Инициации</b> и передай это число.",
        operators: ['<code>result = a</code>'],
        entities: [
            createEntity('Древний Дух', 'ancient_spirit', 'source', 0, 0, 5), 
            createEntity('Алтарь Инициации', 'initiation_altar', 'target', 0, 0),
        ]
    }, 
    { 
        id: '2.2', 
        name: 'Сложение Мощностей', 
        requiredValue: 17, 
        description: "Подойди к <b>Духу Воздуха</b> и <b>Духу Земли</b>, узнай значений их мощностей, сложи и передай результат <b>Хранителю Ворот</b>.",
        operators: ['<code>+</code> для сложения (Пример: <code>result = a + b</code>)'],
        entities: [
            createEntity('Дух Воздуха', 'air_spirit', 'source', 0, 0, 10),
            createEntity('Дух Земли', 'earth_spirit', 'source', 0, 0, 7),
            createEntity('Хранитель Ворот', 'gate_keeper', 'target', 0, 0),
        ]
    }, 
    { 
        id: '2.3', 
        name: 'Вычитание Защиты', 
        requiredValue: 13, 
        description: "Подойди к <b>Защитной Сфере</b> и <b>Духу Времени</b>, узнай, на сколько уменьшилась защита (используя вычитание), и передай это значение <b>Артефакту Защиты</b>.",
        operators: ['<code>-</code> для вычитания (Пример: <code>result = a - b</code>)'],
        entities: [
            createEntity('Защитная Сфера', 'defense_sphere', 'source', 0, 0, 25),
            createEntity('Дух Времени', 'time_spirit', 'source', 0, 0, 12),
            createEntity('Артефакт Защиты', 'defense_artifact', 'target', 0, 0),
        ]
    },
    { 
        id: '2.4', 
        name: 'Умножение Потока', 
        requiredValue: 24, 
        description: "Возьми энергию от <b>Источника Силы</b> и усиль её с помощью <b>Камня Умножения</b>, затем направь усиленный поток в <b>Кристалл-Усилитель</b>.",
        operators: ['<code>*</code> для умножения (Пример: <code>result = a * b</code>)'],
        entities: [
            createEntity('Источник Силы', 'base_power', 'source', 0, 0, 6),
            createEntity('Камень Умножения', 'multiplier', 'source', 0, 0, 4),
            createEntity('Кристалл-Усилитель', 'amplifier_crystal', 'target', 0, 0),
        ]
    },
    { 
        id: '2.5', 
        name: 'Целочисленное Деление', 
        requiredValue: 5, 
        description: "Мана из <b>Источника Жизни</b> должна быть поровну распределена между <b>Энергетическими Каналами</b>. Вычисли, сколько энергии получит каждый канал (целое число), и активируй <b>Распределитель Сил</b>.",
        operators: ['<code>//</code> для целочисленного деления (Пример: <code>result = a // b</code>)'],
        entities: [
            createEntity('Источник Жизни', 'total_mana', 'source', 0, 0, 45),
            createEntity('Энергетические Каналы', 'channels', 'source', 0, 0, 8),
            createEntity('Распределитель Сил', 'power_distributor', 'target', 0, 0),
        ]
    },
    { 
        id: '2.6', 
        name: 'Магический Остаток', 
        requiredValue: 7, 
        description: "После распределения <b>Сокровищ Древних</b> между <b>Хранителями Знаний</b>, определи магический остаток и помести его на <b>Весы Баланса</b>.",
        operators: ['<code>%</code> для остатка от деления (Пример: <code>result = a % b</code>)'],
        entities: [
            createEntity('Сокровища Древних', 'total_coins', 'source', 0, 0, 70),
            createEntity('Хранители Знаний', 'keepers', 'source', 0, 0, 9),
            createEntity('Весы Баланса', 'balance_scales', 'target', 0, 0),
        ]
    },
    { 
        id: '2.7', 
        name: 'Арка Экспоненты', 
        requiredValue: 81, 
        description: "Возьми базовое заклинание из <b>Свитка Мощи</b> и примени к нему <b>Уровень Потенциала</b>, затем направь возросшую энергию в <b>Арку Экспоненты</b>.",
        operators: ['<code>**</code> для возведения в степень (Пример: <code>result = a ** b</code>)'],
        entities: [
            createEntity('Свиток Мощи', 'base_power', 'source', 0, 0, 3),
            createEntity('Уровень Потенциала', 'level', 'source', 0, 0, 4),
            createEntity('Арку Экспоненты', 'exponent_arc', 'target', 0, 0),
        ]
    },
    { 
        id: '2.8', 
        name: 'Комбинированный Кристалл', 
        requiredValue: 26, 
        description: "Объедини базовую силу <b>Камня Основ</b> с мудростью <b>Духа Прозрения</b>, затем усиль результат с помощью <b>Артефакта Умножения</b>. Передай синтезированную энергию <b>Комбинированному Кристаллу</b>. (Помни о порядке операций!)",
        operators: ['<code>()</code> для изменения порядка операций'],
        entities: [
            createEntity('Камень Основ', 'base_power', 'source', 0, 0, 5),
            createEntity('Дух Прозрения', 'wisdom_spirit', 'source', 0, 0, 8),
            createEntity('Артефакт Умножения', 'multiplier', 'source', 0, 0, 2),
            createEntity('Комбинированный Кристалл', 'combined_crystal', 'target', 0, 0),
        ]
    },
    { 
        id: '2.9', 
        name: 'Двойной Кристалл', 
        requiredValue: [16, 4], 
        description: "Драгоценные <b>Камни Силы</b> должны быть распределены между <b>Алтарями Стихий</b>. Определи, сколько камней достанется каждому алтарю (целочисленное деление) и какой остаток сохранится (остаток от деления), затем активируй <b>Двойной Кристалл</b> обеими величинами. (Нужно: <code>print(res1, res2)</code>).", 
        operators: ['<code>//</code>, <code>%</code>, и <code>print(res1, res2)</code>'],
        entities: [
            createEntity('Камни Силы', 'total_gems', 'source', 0, 0, 100),
            createEntity('Алтари Стихий', 'altars', 'source', 0, 0, 6),
            createEntity('Двойной Кристалл', 'double_crystal', 'target', 0, 0),
        ]
    },
    { 
        id: '2.10', 
        name: 'Великий Кристалл', 
        requiredValue: 5, 
        description: "Собери знания от всех шести артефактов: возьми основу от <b>Камня Истоков</b> (5), добавь мудрость от трёх <b>Духов Просветления</b> (по 2), усиль результат <b>Артефактом Усиления</b> (3) и найди магический остаток для <b>Сверх-Каналов</b> (7). Передай финальный магический остаток <b>Великому Кристаллу</b>.", 
        operators: ['Комплексная задача: <code>+, *, %, ()</code>'],
        entities: [
            createEntity('Камень Истоков', 'base', 'source', 0, 0, 5),
            createEntity('Дух Просветления', 'wisdom1', 'source', 0, 0, 2),
            createEntity('Дух Просветления', 'wisdom2', 'source', 0, 0, 2),
            createEntity('Дух Просветления', 'wisdom3', 'source', 0, 0, 2),
            createEntity('Артефакт Усиления', 'multiplier', 'source', 0, 0, 3),
            createEntity('Сверх-Каналы', 'channels', 'source', 0, 0, 7),
            createEntity('Великий Кристалл', 'great_crystal', 'target', 0, 0),
        ]
    } 
]; 

/**
 * Генерирует случайные значения для сущностей-источников и пересчитывает требуемый результат.
 */
function setupDynamicLevel(levelData) {
    // Карта для хранения сгенерированных значений
    const entityValues = {};

    // 1. Генерируем случайные значения для источников
    levelData.entities.forEach(entity => {
        if (entity.type === 'source') {
            let value;
            let min = 3, max = 10; // Значения по умолчанию

            // Определение диапазонов в зависимости от уровня (логика оставлена для рандомизации значений)
            switch (levelData.id) {
                case '2.2': 
                    min = 5; max = 15;
                    break;
                case '2.3': // Вычитание
                    if (entity.name_en === 'defense_sphere') { min = 15; max = 30; } 
                    if (entity.name_en === 'time_spirit') { min = 5; max = 14; } 
                    break;
                case '2.4': // Умножение
                    min = 3; max = 8;
                    break;
                case '2.5': // Целочисленное деление
                    if (entity.name_en === 'total_mana') { min = 30; max = 60; }
                    if (entity.name_en === 'channels') { min = 5; max = 12; }
                    break;
                case '2.6': // Остаток от деления
                    if (entity.name_en === 'total_coins') { min = 50; max = 100; }
                    if (entity.name_en === 'keepers') { min = 5; max = 15; }
                    break;
                case '2.7': // Возведение в степень
                    min = 2; max = 4; 
                    break;
                case '2.8': // Комбинированный
                    if (entity.name_en === 'multiplier') { min = 2; max = 4; }
                    else { min = 3; max = 10; }
                    break;
                case '2.9': // Двойной Кристалл (Деление и Остаток)
                    if (entity.name_en === 'total_gems') { min = 80; max = 150; }
                    if (entity.name_en === 'altars') { min = 5; max = 15; }
                    break;
                case '2.10': // Комплексный
                    min = 2; max = 7;
                    if (entity.name_en === 'channels') { min = 5; max = 10; } // Модуль деления
                    break;
            }

            value = getRandomInt(min, max);
            entity.value = value;
            entityValues[entity.name_en] = value;
        }
    });

    // 2. Корректировка и пересчет requiredValue
    const V = entityValues; 
    let newRequiredResult;

    switch (levelData.id) {
        case '2.1':
            newRequiredResult = V.ancient_spirit;
            break;
        case '2.2':
            newRequiredResult = V.air_spirit + V.earth_spirit;
            break;
        case '2.3':
            let defenseSphere = V.defense_sphere;
            let timeSpirit = V.time_spirit;
            if (defenseSphere < timeSpirit) {
                [defenseSphere, timeSpirit] = [timeSpirit, defenseSphere];
                levelData.entities.find(e => e.name_en === 'defense_sphere').value = defenseSphere;
                levelData.entities.find(e => e.name_en === 'time_spirit').value = timeSpirit;
            }
            if (defenseSphere === timeSpirit) {
                 timeSpirit = getRandomInt(5, defenseSphere - 1);
                 levelData.entities.find(e => e.name_en === 'time_spirit').value = timeSpirit;
            }
            newRequiredResult = defenseSphere - timeSpirit;
            break;
        case '2.4':
            newRequiredResult = V.base_power * V.multiplier;
            break;
        case '2.5':
            while (Math.floor(V.total_mana / V.channels) < 2) {
                V.total_mana = getRandomInt(30, 60);
                levelData.entities.find(e => e.name_en === 'total_mana').value = V.total_mana;
            }
            newRequiredResult = Math.floor(V.total_mana / V.channels);
            break;
        case '2.6':
            newRequiredResult = V.total_coins % V.keepers;
            break;
        case '2.7':
            newRequiredResult = Math.pow(V.base_power, V.level);
            break;
        case '2.8':
            newRequiredResult = (V.base_power + V.wisdom_spirit) * V.multiplier;
            break;
        case '2.9':
            while (Math.floor(V.total_gems / V.altars) < 5) {
                V.total_gems = getRandomInt(80, 150);
                levelData.entities.find(e => e.name_en === 'total_gems').value = V.total_gems;
            }
            newRequiredResult = [Math.floor(V.total_gems / V.altars), V.total_gems % V.altars];
            break;
        case '2.10':
            newRequiredResult = ((V.base + V.wisdom1 + V.wisdom2 + V.wisdom3) * V.multiplier) % V.channels;
            break;
        default:
            newRequiredResult = levelData.requiredValue;
            break;
    }

    levelData.requiredValue = newRequiredResult;
}


// -------------------------------------------------------------------------------------------------
// ОБЩАЯ ЛОГИКА
// -------------------------------------------------------------------------------------------------

/**
 * 🛑 ИСПРАВЛЕНО: Обновленная функция для корректного разделения контента по сайдбарам.
 */
function updateSidebars(levelData) {
    // --- ЛЕВЫЙ САЙДБАР (Инструкции) ---
    instructionSidebar.style.display = 'block';
    // Заполняем общие инструкции (getOpHint не зависит от уровня, но может содержать подсказки по операторам)
    instructionContent.innerHTML = getOpHint(levelData.operators);


    // --- ПРАВЫЙ САЙДБАР (Задание) ---
    taskSidebar.style.display = 'block';
    
    
    let taskHtml = `
        <p style="margin-top: 0;"><b>Задание:</b></p>
        <p>${levelData.description}</p>
        ${getTaskHint(levelData.operators)}
    `;
    taskContent.innerHTML = taskHtml;
}

function showIntroScreen() {
    introScreen.style.display = 'flex';
    gameContainer.style.opacity = '0'; 
    taskSidebar.style.display = 'none'; 
    instructionSidebar.style.display = 'none'; 
    
    lessonSubtitle.textContent = 'Занятие 2';
    lessonText.innerHTML = ` // ← Теперь lessonText определен
        Теперь вы будете использовать <code>move = int(input())</code> для движения (вводя число шагов) и <code>print()</code> для <b>взаимодействия</b> с сущностями.<br>
        Вам нужно получить значения от одних сущностей, выполнить над ними <b>арифметические операции</b> и передать результат другим сущностям.<br><br>
        <strong>Твоя задача:</strong> Используй <code>move/turn</code> для достижения цели и <code>print()</code> для сбора данных и передачи ответа.
    `;
    document.getElementById('start-game-btn').textContent = 'Начать Занятие 2';
}

// 🛑 ОБЪЯВЛЕНИЕ ГЛОБАЛЬНОЙ ФУНКЦИИ (Fixes the button issue by ensuring it's available)
window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1'; 
    
    canvas.style.display = 'block'; 
    outputDisplay.style.display = 'block'; 
    
    gameMainTitle.textContent = 'Занятие 2';
    codeInput.placeholder = "move = int(input()), turn = input(), print(...) или go (для учителя)"; 
    
    // 🆕 Загружаем сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        currentPart = savedProgress.currentPart || 2;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен:', { currentPart, currentLevel, totalExperience });
    }
    
    // 🆕 Инициализируем опыт при загрузке
    updateExperienceDisplay();
    
    startGame(currentLevel);
    // 🆕 Сохраняем факт начала сессии без опыта
    ssaveProgressToGoogleSheets('save', 0);
}

// Обновите функцию showWinModal
function showWinModal(isPartComplete = false, earnedExp = 0) {
    if (isPartComplete) {
        winModal.querySelector('#modal-title').textContent = "Занятие 2 пройдено!";
        winModal.querySelector('#modal-text').innerHTML = `Ты отлично справился с линейными алгоритмами! <br> Готов к следующему уроку: <strong>Условные операторы</strong>?<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`;
    } else {
        winModal.querySelector('#modal-title').textContent = "Уровень пройден!";
        winModal.querySelector('#modal-text').innerHTML = `Правильно! Переходим к следующей задаче.<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
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
    
    if (currentLevel + 1 < PART_2_LEVELS.length) {
        currentLevel++;
        // 🆕 Сохраняем прогресс при переходе на следующий уровень
        await saveProgressToGoogleSheets('save', 0);
        startGame(currentLevel);
    } else {
        // Занятие 2 завершено
        // 🆕 Сохраняем прогресс при завершении занятия
        await saveProgressToGoogleSheets('save', 0);
        showIntroScreen(); 
    }
    updateReferenceContent();
}

window.restartLevel = function() { // Сделано глобальным
    winModal.style.display = 'none';
    startGame(currentLevel);
}

// --- Инициализация / Запуск Уровня ---

function startGame(levelIndex) {
    startLevelTracking();
    if (levelIndex < 0 || levelIndex >= PART_2_LEVELS.length) {
        messageElement.textContent = `Ошибка: Уровень ${levelIndex} не существует. Запущено Занятие 2.1.`;
        levelIndex = 0;
    }
    currentLevel = levelIndex;
    
    currentLevelData = JSON.parse(JSON.stringify(PART_2_LEVELS[levelIndex])); 
    
    // ШАГ 1: Рандомизация значений и пересчет результата
    setupDynamicLevel(currentLevelData);

    // ШАГ 2: Рандомизация позиций (Требование 2)
    setupRandomPositions(currentLevelData);


    // Сброс состояния
    direction = 'вправо';
    pythonVariables = {};
    lastPrintedResult = null;
    consoleOutput = "--- Сброс консоли ---\n";
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    codeInput.value = '';

    messageElement.textContent = `Уровень ${currentLevelData.id}. Введите код.`;
    
    // 🛑 ИСПРАВЛЕНО: Обновляем оба сайдбара
    updateSidebars(currentLevelData);
    updateExperienceDisplay();
    updateReferenceContent();
    resetAnimations();
    startAnimationLoop();

    drawGame();
}

// --- ДИСПЛЕЙ И ДВИЖЕНИЕ ---


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

    const PADDING_X = 10;
    const PADDING_Y = 6;
    const RADIUS = 5;
    
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
        const FONT_SIZE = FONT_SIZE_MATCH ?
        parseInt(FONT_SIZE_MATCH[1], 10) : 12;

        const textHeight = FONT_SIZE * 1.2;
        const VERTICAL_CORRECTION = FONT_SIZE * 0.2;
        
        // 1. РАСЧЕТ ПОЗИЦИИ ФОНА
        const bgWidth = textWidth + PADDING_X * 2;
        const bgHeight = textHeight + PADDING_Y * 2;

        const bgX = x - bgWidth / 2;
        const bgY = y - textHeight - PADDING_Y + VERTICAL_CORRECTION;
        
        // 2. Отрисовка Фона (Белый, ПОЛУПРОЗРАЧНЫЙ, с тенью)
        
        // Настройка тени
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = -1;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawRoundedRect(bgX, bgY, bgWidth, bgHeight, RADIUS);

        // ВАЖНО: Сброс тени
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 3. Отрисовка Текста (Черный)
        ctx.fillStyle = 'black';
        ctx.fillText(text, x, y);
    }
    // =========================================================================
    // 🛑 КОНЕЦ БЛОКА: Вспомогательные функции
    // =========================================================================

    // Отрисовка всех сущностей
    if (levelData && levelData.entities) {
        levelData.entities.forEach((entity, index) => {
            // --- 1. Определение типа сущности и отрисовка ---
            if (entity.type === 'source') {
                // Рисуем source с анимацией
                const entityId = `source_${index}`;
                
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
                    // Fallback на статичное изображение
                    ctx.drawImage(
                        sourceImage, 
                        entity.x,
                        entity.y, 
                        PLAYER_SIZE, 
                        PLAYER_SIZE
                    );
                } else {
                    // Fallback на цветной квадрат
                    ctx.fillStyle = '#f1c40f';
                    ctx.fillRect(entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                }
                
            } else if (entity.type === 'target') {
                // Рисуем target статичным
                if (checkCollision(playerX, playerY, entity)) {
                    borderColor = '#2ecc71';
                    ctx.lineWidth = 4;
                } else {
                    ctx.lineWidth = 1;
                }

                // Рисуем изображение Target
                if (targetImage.complete) {
                    ctx.drawImage(
                        targetImage, 
                        entity.x, 
                        entity.y,
                        PLAYER_SIZE,
                        PLAYER_SIZE
                    );
                }
            }

            // --- 3. Отрисовка текста (Надписи над сущностью) ---
            const centerX = entity.x + PLAYER_SIZE / 2;
            
            if (entity.type === 'source') {
                const name_ru = entity.name_ru;
                const name_en = `(${entity.name_en})`; 
                
                // 1. Русский текст (entity.name_ru)
                drawTextWithBackground( 
                    name_ru, 
                    centerX, 
                    entity.y - 35,
                    'bold 13px "Century Gothic", sans-serif'
                ); 

                // 2. Английский/Переменная (entity.name_en)
                drawTextWithBackground(
                    name_en, 
                    centerX, 
                    entity.y - 5,
                    '13px "Century Gothic", sans-serif'
                );
                
            } else if (entity.type === 'target') {
                drawTextWithBackground(
                    entity.name_ru, 
                    centerX, 
                    entity.y - 5,
                    'bold 13px "Century Gothic", sans-serif'
                );
            }
        });
    }
    
    // Draw Player
    if (playerImage.complete) {
        ctx.drawImage(
            playerImage, 
            playerX, 
            playerY, 
            PLAYER_SIZE,
            PLAYER_SIZE
        );
    } else {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    }

    drawDirectionArrow();

    // Текст "Направление"
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.font = '16px "Century Gothic", sans-serif';
    ctx.fillText(`Направление: ${direction}`, 10, 20);
}

function drawDirectionArrow() {
    ctx.fillStyle = '#FFD700'; 
    ctx.beginPath();
    
    // Изначальные координаты центра игрока
    let x = playerX + PLAYER_SIZE / 2; 
    let y = playerY + PLAYER_SIZE / 2;
    
    // 🟢 ИСПРАВЛЕНО: Увеличиваем смещение. 
    // Теперь стрелка смещена, например, на 10px левее и 10px ниже от центра.
    x -= 8; 
    y += 14; 
    
    switch (direction) {
        case 'вправо': 
            ctx.moveTo(x + 15, y); 
            ctx.lineTo(x + 5, y - 10); 
            ctx.lineTo(x + 5, y + 10); 
            break;
        case 'влево': 
            ctx.moveTo(x - 15, y); 
            ctx.lineTo(x - 5, y - 10); 
            ctx.lineTo(x - 5, y + 10); 
            break;
        case 'вверх': 
            ctx.moveTo(x, y - 15); 
            ctx.lineTo(x - 10, y - 5); 
            ctx.lineTo(x + 10, y - 5); 
            break;
        case 'вниз': 
            ctx.moveTo(x, y + 15); 
            ctx.lineTo(x - 10, y + 5); 
            ctx.lineTo(x + 10, y + 5); 
            break;
    }
    ctx.closePath(); 
    ctx.fill();
}


function checkCollision(x, y, block) {
    if (!block) return false;

    // Используем строгую проверку столкновения по сетке (x, y)
    return x === block.x && y === block.y;
}

function fakeMoveInput(steps) {
    if (isNaN(steps)) { messageElement.textContent = `Ошибка! Значение '${steps}' не является числом.`; return false; }
    
    let actualSteps = steps * STEP_SIZE; 
    let newX = playerX; 
    let newY = playerY;
    
    switch (direction) {
        case 'вправо': newX += actualSteps; break; 
        case 'влево': newX -= actualSteps; break;
        case 'вверх': newY -= actualSteps; break; 
        case 'вниз': newY += actualSteps; break;
    }
    
    // Проверка границ (0 до CANVAS_SIZE - PLAYER_SIZE)
    newX = Math.min(Math.max(newX, 0), canvas.width - PLAYER_SIZE);
    newY = Math.min(Math.max(newY, 0), canvas.height - PLAYER_SIZE);
    
    playerX = newX; 
    playerY = newY;
    
    drawGame(); 
    return true;
}

function fakeTurnInput(newDir) {
    const validDirections = ['вправо', 'влево', 'вверх', 'вниз'];
    const normalizedDir = newDir ? newDir.toLowerCase().trim() : '';
    if (validDirections.includes(normalizedDir)) {
        direction = normalizedDir; 
        drawGame();
        return true;
    } else {
        messageElement.textContent = `Ошибка! Некорректное направление '${newDir}'. Используйте: вправо, влево, вверх, вниз.`;
        return false;
    }
}


// --- ЛОГИКА INPUT/PRINT/ВЫРАЖЕНИЙ ---

/**
 * Исправленная функция для точной эмуляции Python-операторов (// и **).
 */
function evaluatePythonExpression(expression, variables) {
    let evaluatedExpression = expression.replace(/(\w+)/g, (match) => {
        if (variables.hasOwnProperty(match)) {
            if (typeof variables[match] === 'number') {
                return variables[match];
            }
            return `'${variables[match]}'`;
        }
        return match;
    });

    // 1. Обработка ** (возведение в степень)
    evaluatedExpression = evaluatedExpression.replace(/(\S+)\s*\*\*\s*(\S+)/g, 'Math.pow($1, $2)');

    // 2. Обработка // (целочисленное деление)
    evaluatedExpression = evaluatedExpression.replace(/(\S+)\s*\/\/\s*(\S+)/g, 'Math.floor($1 / $2)');

    try {
        const result = eval(evaluatedExpression);
        if (typeof result === 'number' && result % 1 === 0) {
             return Math.round(result);
        }
        return result;
    } catch (e) {
        return expression; 
    }
}


function emulatePrint(line) {
    const printMatch = line.match(/print\s*\(([^)]*)\)/);
    if (!printMatch) return { success: false };

    const argsStr = printMatch[1].trim();
    // Разбиваем аргументы, игнорируя запятые внутри кавычек
    const parts = argsStr.split(/,\s*(?=(?:(?:[^"']*["']){2})*[^"']*$)/); 
    
    let sep = ' '; let end = '\n'; 
    const outputItems = [];
    const evaluatedResults = []; 

    for (let part of parts) {
        part = part.trim();
        if (part.startsWith('sep=') || part.startsWith('end=')) {
            continue;
        } else if (part.length > 0) {
            let evaluated;
            try {
                if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
                    evaluated = part.slice(1, -1);
                    outputItems.push(evaluated);
                } else {
                    evaluated = evaluatePythonExpression(part, pythonVariables);
                    outputItems.push(evaluated);
                    
                    if (typeof evaluated === 'number') {
                        evaluatedResults.push(evaluated);
                    } else if (typeof evaluated === 'string' && !isNaN(parseFloat(evaluated))) {
                        evaluatedResults.push(parseFloat(evaluated));
                    }
                }
            } catch (e) {
                outputItems.push(part);
            }
        }
    }

    const outputString = outputItems.join(sep) + end;
    
    return { success: true, text: outputString, evaluatedOutput: evaluatedResults };
}

/**
 * Обрабатывает строку с присвоением (например: a = 10 или b = c + 5).
 * Также обрабатывает присвоение с вызовом input(): var = int(input())
 * @param {string} line Строка кода.
 * @returns {boolean} true, если присвоение выполнено успешно, иначе false.
 */
function handleAssignment(line) {
    const parts = line.split('=').map(p => p.trim());
    
    if (parts.length < 2) {
        messageElement.textContent = `Ошибка синтаксиса: Некорректное присвоение. Ожидается: переменная = выражение.`;
        return false;
    }

    const varName = parts[0];
    const expression = parts.slice(1).join('=').trim(); 

    // 1. Обработка присвоения с input()
    const inputMatch = expression.match(/^int\s*\(\s*input\s*\(\s*["']?(.+?)["']?\s*\)\s*\)$/);
    if (inputMatch) {
        const promptText = inputMatch[1] || `Введите значение для переменной '${varName}':`;
        const userInput = prompt(promptText);

        if (userInput === null || userInput.trim() === "") {
            messageElement.textContent = `Ошибка: Операция input() отменена.`;
            return false;
        }
        
        const numberValue = parseInt(userInput);
        if (isNaN(numberValue)) {
            messageElement.textContent = `Ошибка: Ожидалось целое число, получено '${userInput}'.`;
            return false;
        }
        
        pythonVariables[varName] = numberValue;
        
        // 🛑 ИСПРАВЛЕНИЕ: Обновление консоли и сообщения об успехе для input()
        consoleOutput += `> ${promptText} ${numberValue} (ввод)\n`;
        messageElement.textContent = `Успех! Переменной '<b>${varName}</b>' присвоено значение <b>${numberValue}</b> (ввод).`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');

        return true;
    }

    // 2. Обработка обычного присвоения (вычисление выражения)
    let value;
    try {
        // Здесь предполагается наличие функции evaluatePythonExpression
        value = evaluatePythonExpression(expression, pythonVariables); 
    } catch (e) {
        messageElement.textContent = `Ошибка: Невозможно вычислить выражение '<b>${expression}</b>'. Проверьте, что все переменные объявлены и синтаксис верен.`;
        return false;
    }

    pythonVariables[varName] = value;

    // 🛑 ИСПРАВЛЕНИЕ: Обновление сообщения об успехе для обычного присвоения
    messageElement.textContent = `Успех! Переменной '<b>${varName}</b>' присвоено значение <b>${value}</b>.`;

    // 🛑 ИСПРАВЛЕНИЕ: Вывод в консоль факта присвоения
    consoleOutput += `> Переменная '${varName}' = ${value} (вычислено)\n`;
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');

    // Перерисовка игры, если это нужно для отображения состояния
    if (typeof drawGame === 'function') {
        drawGame(); 
    }

    return true;
}

/**
 * Обрабатывает print() у блока переменной.
 */
function handlePrintForEntity(line) {
    const printResult = emulatePrint(line);
    if (!printResult.success) {
        messageElement.textContent = `Ошибка синтаксиса print() в строке: ${line}`;
        return false;
    }
    
    const targetEntity = currentLevelData.entities.find(e => checkCollision(playerX, playerY, e));

    if (!targetEntity) {
        // Просто выводим результат в консоль (если это не взаимодействие)
        consoleOutput += printResult.text;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        messageElement.textContent = "Команда print() выполнена. Ты ни с чем не взаимодействуешь.";
        return true; 
    }
    
    // --- ПРОВЕРКА ВЗАИМОДЕЙСТВИЯ ---

    // 1. Если это сущность-источник (Source)
    if (targetEntity.type === 'source') {
        
        const printText = printResult.text.toLowerCase();
        const requiredNamePart = targetEntity.name_ru.toLowerCase(); 
        
        const hasGreeting = printText.includes("привет") || printText.includes("приве") || printText.includes("знаешь");
        const hasCorrectName = printText.includes(requiredNamePart);

        if (hasGreeting && hasCorrectName) {
            
            consoleOutput += printResult.text; 
            consoleOutput += `Сущность '${targetEntity.name_ru}' показала свое число: ${targetEntity.value}\n`; 
            
            // Сообщение теперь просто инструктирует, но не проверяет присвоение
            messageElement.textContent = `Успех! Сущность '${targetEntity.name_en}' показала свое значение (${targetEntity.value}). Теперь самостоятельно присвой его переменной: '${targetEntity.name_en} = ${targetEntity.value}'`;
            
        } else {
            messageElement.textContent = `Ошибка: Чтобы получить данные от сущности-источника, используй: print("Привет, что ты знаешь ${targetEntity.name_ru}"). Убедитесь, что вы написали полное имя сущности!`;
            return false;
        }
    }
    
    // 2. Если это сущность-цель (Target / CHECK-блок)
    else if (targetEntity.type === 'target') {
        levelAttempts++;
        console.log(`[Опыт] Попытка взаимодействия с Итоговой Сущностью №${levelAttempts}`);
        
        lastPrintedResult = printResult.evaluatedOutput.length > 0 ? printResult.evaluatedOutput : null;
        
        if (lastPrintedResult === null) {
            messageElement.textContent = `Ошибка: Проверь, что присвоил все переменные! Чтобы передать значение, используй: print(result).`;
            return false;
        }
        
        // Извлекаем имя переменной из print()
        const match = line.match(/^print\s*\(([^,]+?)\s*(?:,.*)?\)$/);
        let printedVarName = null;
        if (match) {
            printedVarName = match[1].trim(); 
        }

        consoleOutput += `>>> print(...) вывел: ${printResult.evaluatedOutput.join(', ')}\n`;
        
        // Вызываем checkWinPart2Combined, которая теперь содержит проверку всех source-переменных
        const isWin = checkWinPart2Combined(false, printedVarName); 
        
        // 🛑 ИЗМЕНЕНИЕ: Всегда возвращаем false для цели, чтобы прервать выполнение кода
        // Если победа - модальное окно уже показано
        // Если ошибка - сообщение уже установлено
        return false;
    }
    
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    return true;
}

/**
 * Проверяет, находится ли игрок на целевом блоке текущего уровня.
 * Сравнивает пиксельные координаты игрока с пиксельными координатами цели.
 * @returns {boolean} true, если позиция игрока совпадает с targetBlock.
 */
function checkIfPlayerOnTargetBlock() {
    console.log('--- ПРОВЕРКА ЦЕЛИ ---');
    console.log('Игрок (px):', playerX, playerY);
    console.log('Цель (сетка):', currentLevelData.targetBlock.x, currentLevelData.targetBlock.y);
    console.log('Цель (px):', targetX_pixel, targetY_pixel);
    if (!currentLevelData || !currentLevelData.targetBlock) {
        return false; // Защитная проверка, хотя в checkWinPart2Combined она тоже есть
    }

    const targetX_grid = currentLevelData.targetBlock.x;
    const targetY_grid = currentLevelData.targetBlock.y;
    
    // Переводим координаты сетки (x, y) в пиксели
    const targetX_pixel = targetX_grid * STEP_SIZE;
    const targetY_pixel = targetY_grid * STEP_SIZE;

    // Сравниваем пиксельные координаты игрока с пиксельными координатами цели
    // playerX/Y - это верхний левый угол игрока
    return playerX === targetX_pixel && playerY === targetY_pixel;
}

/**
 * Проверяет победу для Занятия 2 (Print-Based Win).
 * Включает проверку, что все переменные-источники были присвоены правильными значениями.
 * @param {boolean} preCheck Если true, это предварительная проверка.
 * @param {string | null} printedExpression Имя переменной, напечатанной в print() (например, 'result').
 * @returns {boolean} true, если все условия победы выполнены, иначе false.
 */
function checkWinPart2Combined(preCheck = false, printedExpression = null) {
    if (preCheck) return false;

    // --- 0. Инициализация и Проверка основных данных ---
    if (!currentLevelData || currentLevelData.requiredValue === undefined) {
         messageElement.textContent = `Ошибка: Не определены данные уровня или требуемое значение.`;
         return false;
    }
    
    const targetBlock = currentLevelData.targetBlock;
    const requiredValue = currentLevelData.requiredValue; 
    const requiredPrintedVarName = 'result'; 
    
    // Определяем все переменные, которые ДОЛЖНЫ быть присвоены (все source-сущности)
    const requiredSourceEntities = currentLevelData.entities.filter(e => e.type === 'source');
    
    // --- 1. ПРОВЕРКА ПОЗИЦИИ ---
    if (targetBlock) {
        if (!checkIfPlayerOnTargetBlock()) {
            messageElement.textContent = `Ошибка! Ты должен стоять на целевом блоке (${targetBlock.name_ru}).`; 
            return false;
        }
    } 

    // 🛑 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: ПРОВЕРКА ПРИСВОЕННЫХ ПЕРЕМЕННЫХ ИСТОЧНИКА
    for (const entity of requiredSourceEntities) {
        const varName = entity.name_en;
        const requiredVal = entity.value;
        const assignedVal = pythonVariables[varName]; // Значение, присвоенное игроком
        
        // 1. Проверяем, что переменная вообще присвоена
        if (assignedVal === undefined) {
            messageElement.textContent = `Ошибка! Перед передачей результата, необходимо присвоить переменную '${varName}'после взаимодействия с '${entity.name_ru}'.`;
            return false;
        }
        
        // 2. Проверяем, что присвоенное значение совпадает с требуемым (конвертируем в число для надежности)
        if (Number(assignedVal) !== Number(requiredVal)) {
            messageElement.textContent = `Ошибка! Переменная '${varName}' присвоена неверно. Проверь свое присвоение!`;
            return false;
        }
    }
    
    // --- 2. ПРОВЕРКА PRINT-ВЫРАЖЕНИЯ ---
    if (printedExpression !== requiredPrintedVarName) {
        const blockName = targetBlock ? targetBlock.name_ru : 'целевой точке'; 
        messageElement.textContent = `Ошибка! Ты на ${blockName}. Для победы требуется команда: print(result).`;
        return false;
    }

    // --- 3. ПРОВЕРКА НАПЕЧАТАННОГО ЗНАЧЕНИЯ ---
    const printedValue = lastPrintedResult && lastPrintedResult.length > 0 ? lastPrintedResult[0] : null;
    
    // Обработка сложных случаев (2.9)
    const printedNum = Array.isArray(lastPrintedResult) ? lastPrintedResult.map(Number) : [Number(printedValue)];
    const requiredNum = Array.isArray(requiredValue) ? requiredValue.map(Number) : [Number(requiredValue)];
    
    const blockName = targetBlock ? targetBlock.name_ru : 'целевой точке';
    
    let isValueCorrect = true;
    if (printedNum.length !== requiredNum.length) {
        isValueCorrect = false;
    } else {
        for (let i = 0; i < printedNum.length; i++) {
            if (printedNum[i] !== requiredNum[i]) {
                isValueCorrect = false;
                break;
            }
        }
    }

    if (!isValueCorrect) {
         const requiredText = Array.isArray(requiredValue) ? requiredValue.join(', ') : requiredValue;
         const printedText = Array.isArray(printedValue) ? printedValue.join(', ') : printedValue;
         
         messageElement.textContent = `Ошибка! Ты на ${blockName}. Напечатанное значение не равно требуемому. Проверь формулу!`;
         return false;
    }

    // --- 4. ПОБЕДА! ---
    messageElement.textContent = `Успех! Ты на ${blockName}. Вывод: ${Array.isArray(printedValue) ? printedValue.join(', ') : printedValue}.`;
    if (typeof showWinModal === 'function') {
	const earnedExp = calculateExperience(); // 🆕 Рассчитываем опыт
        showWinModal(false, earnedExp); // 🆕 Передаем опыт
    }
    return true;
}

/**
 * Скрывает вступительный экран и показывает игровой контейнер.
 * Вызывается по нажатию кнопки "Начать Занятие 2".
 */
function hideIntroAndStart() {
    // 1. Скрываем Intro Screen
    if (introScreen) {
        introScreen.style.display = 'none';
    }

    // 2. Показываем Game Container
    if (gameContainer) {
        // ЭТО ОТМЕНЯЕТ style="opacity: 0;" в index.html
        gameContainer.style.opacity = '1'; 
        gameContainer.style.pointerEvents = 'auto'; 
    }
    
    // 3. Начинаем игру с первого уровня
    startGame(0);
}



// Определяем эту переменную вне функции executeCode, чтобы она была доступна,
// или как минимум объявляем ее в начале executeCode.
let printedExpression = null; 

function executeCode() {
    const code = codeInput.value;
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines[0] && lines[0].toLowerCase() === 'go') {
        return handleTeacherMode();
    }
    
    // 🛑 КРИТИЧЕСКИЙ СБРОС (должен быть в начале executeCode)
    lastPrintedResult = null; 
    printedExpression = null; 
    consoleOutput += "\n--- Выполнение кода ---\n";

    for (const line of lines) {
       if (line.includes('move = int(input())')) {
            const steps = prompt("move = int(input()): Введите количество шагов:");
            if (!fakeMoveInput(parseInt(steps))) return;
        } else if (line.includes('move = input()')) { 
            messageElement.textContent = `Ошибка! Используйте только 'move = int(input())' для ввода числовых шагов.`;
            return;
        } else if (line.includes('turn = input()')) {
            const direction = prompt("turn = input(): Введите направление (вправо, влево, вверх, вниз):");
            if (!fakeTurnInput(direction)) return;
        }
            
        // 🛑 ИСПРАВЛЕННЫЙ БЛОК ДЛЯ print() 🛑
         else if (line.startsWith('print')) { 
            
            const match = line.match(/^print\s*\((.+?)\s*\)$/); 
            
            if (match) {
                // Сохраняем ТОЛЬКО первое напечатанное выражение для проверки победы
                if (printedExpression === null) {
                    printedExpression = match[1].trim(); 
                }
            } else {
                messageElement.textContent = `Ошибка синтаксиса: Некорректный формат print(). Ожидается: print(выражение).`;
                return;
            }

            // Вызываем handlePrintForEntity, чтобы ОНА установила lastPrintedResult
            if (!handlePrintForEntity(line)) return;
            
        // --- Обработка присвоения переменной (a = 5) ---
        } else if (line.includes('=')) {
            if (!handleAssignment(line)) return;
        } else {
            messageElement.textContent = `Ошибка синтаксиса! Неизвестная команда: "<b>${line}</b>"`;
            return;
        }
    }

    messageElement.textContent = "Код успешно выполнен. Проверьте консоль и положение.";
}

// --- ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ---
function handleTeacherMode() {
    const password = prompt("Введите пароль для перехода:");
    if (password !== TEACHER_PASSWORD) {
        messageElement.textContent = "Неверный пароль учителя. Выполнение кода продолжено.";
        return true; 
    }

    const maxLevel = PART_2_LEVELS.length;
    const levelPrompt = `Введите номер уровня (1 - ${maxLevel}) для Занятия 2 или 'menu' для возврата в главное меню:`;
    let target = prompt(levelPrompt);

    if (!target) {
        messageElement.textContent = "Режим учителя отменен.";
        return true; 
    }

    target = target.toLowerCase().trim();

    if (target === 'menu') {
        messageElement.textContent = "Возврат в меню не реализован в этом фрагменте.";
        return true; 
    }

    const targetLevelIndex = parseInt(target) - 1; 

    if (!isNaN(targetLevelIndex) && targetLevelIndex >= 0 && targetLevelIndex < maxLevel) {
        startGame(targetLevelIndex);
        messageElement.textContent = `Переход на уровень ${PART_2_LEVELS[targetLevelIndex].id} успешно выполнен.`;
    } else {
        messageElement.textContent = `Ошибка: Некорректный номер уровня. Доступны: 1-${maxLevel}.`;
    }
    return true; 
}

// --- СПРАВОЧНИК ДЛЯ ЗАНЯТИЯ 2 ---

const REFERENCE_DATA = {
    2: {  // Занятие 2
        title: "Справочник: Занятие 2",
        content: `
            <h3>📥 Ввод данных</h3>
            <p><code>int(input())</code> - ввод целого числа</p>
            
            <h3>🚶 Движение</h3>
            <p><code>move = int(input())</code> - движение на N шагов</p>
            <p><code>turn = input()</code> - поворот (вправо, влево, вверх, вниз)</p>
            
            <h3>📤 Взаимодействие</h3>
            <p><code>print("Привет, что ты знаешь [Имя]")</code> - получить данные от источника</p>
            <p><code>print(переменная)</code> - передать данные цели</p>
            
            <h3>🧮 Арифметика</h3>
            <ul>
                <li><code>+</code> - сложение</li>
                <li><code>-</code> - вычитание</li>
                <li><code>*</code> - умножение</li>
                <li><code>//</code> - целочисленное деление</li>
                <li><code>%</code> - остаток от деления</li>
                <li><code>**</code> - возведение в степень</li>
            </ul>
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
            console.log('Опыт загружен из данных ученика:', totalExperience);
        }
        
        // 🆕 Убеждаемся, что есть переменные для хранения пройденных уровней ДЛЯ ЭТОГО УЧЕНИКА
        const studentIdentifier = getStudentIdentifier();
        const partKey = '2.0';
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        
        if (!localStorage.getItem(completedKey)) {
            localStorage.setItem(completedKey, '[]');
        }
    }
    
    // Получаем кнопку по ID, как она указана в index.html
    const startGameBtn = document.getElementById('start-game-btn');
    
    // Если кнопка найдена, привязываем к ней функцию
    if (startGameBtn) {
        startGameBtn.onclick = hideIntroAndStart;
    }
    
    // Инициализируем справочник при загрузке
    updateReferenceContent();
    
    // 🆕 Обновляем отображение опыта
    updateExperienceDisplay();
});
