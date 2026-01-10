const LESSON_NUMBER = 4;

// Добавить эту функцию в начало (перед системой сохранения)
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
        
        // 🔧 ФОРМАТ КАК В УРОКЕ 1: "4.0" (урок.часть)
        const partKey = `4.0`;
        
        // 🆕 Обновляем текущие данные ученика
        studentData.currentPart = partKey; // Сохраняем как строку "4.0"
        studentData.currentLevel = currentLevel;
        studentData.lastLogin = new Date().toISOString();
        
        // 🆕 ВАЖНО: Берем опыт уже обновленный в calculateExperience()
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
        if (!completedLevels.includes(levelKey) && earnedExp > 1) {
            completedLevels.push(levelKey);
            localStorage.setItem(completedKey, JSON.stringify(completedLevels));
        }
        
        // 🆕 ВАЖНО: Формируем правильный ключ уровня (как в уроке 1)
        const levelKeyForSheet = `${partKey}.${currentLevel + 1}`;
        
        // Формируем данные для отправки - ТАКИЕ ЖЕ КАК В game-2.js
        const dataToSend = {
            action: 'save', // Всегда 'save' как в уроке 1
            password: 'teacher123',
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            classLetter: studentData.classLetter,
            subgroup: studentData.subgroup,
            currentPart: partKey,           // "4.0"
            currentLevel: currentLevel + 1, // +1 для человекочитаемого формата        
            earnedExp: earnedExp,              
            totalExperience: currentStudentExp,
            lessonNumber: 4,       
            partNumber: 0,                 // Часть урока 4 всегда 0
            levelKey: levelKeyForSheet,    // "4.0.1", "4.0.2" и т.д.              
            lastLogin: studentData.lastLogin
        };

        console.log('Отправляю данные на сервер:', dataToSend);
        
        // 🆕 ИСПРАВЛЕНИЕ: Используем тот же URL, что и в game-2.js
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

            // 🆕 ИСПРАВЛЕНИЕ: Проверяем формат как в game-2.js
            const savedPart = studentData.currentPart;
            
            // Проверяем разные форматы savedPart
            if (savedPart === '4.0' || savedPart === '4') {
                // Если сохранен Урок 4
                if (studentData.currentLevel !== undefined) {
                    console.log('Загружен уровень', studentData.currentLevel, 'для урока 4');
                    return {
                        success: true,
                        currentPart: 4,
                        currentLevel: studentData.currentLevel
                    };
                }
            } else if (typeof savedPart === 'string' && savedPart.startsWith('1.')) {
                // Если сохранен Урок 1, начинаем Урок 4 с 0
                console.log('Обнаружен Урок 1. Начинаем Урок 4 с 0.');
            } else if (typeof savedPart === 'string' && savedPart.startsWith('2.')) {
                // Если сохранен Урок 2, начинаем Урок 4 с 0
                console.log('Обнаружен Урок 2. Начинаем Урок 4 с 0.');
            } else if (typeof savedPart === 'string' && savedPart.startsWith('3.')) {
                // Если сохранен Урок 3, начинаем Урок 4 с 0
                console.log('Обнаружен Урок 3. Начинаем Урок 4 с 0.');
            } else {
                console.log('Урок не совпадает или нет сохраненного уровня. Начинаем с 0.');
            }
        }

        return {
            success: true,
            currentPart: 4,
            currentLevel: 0
        };

    } catch (error) {
        console.log('Ошибка при загрузке прогресса:', error);
        return {
            success: true,
            currentPart: 4,
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
background.src = '../images4/game-bg.png'; // 🛑 ИЗМЕНЕНО: images3 -> images4
background.onload = function() {
    drawGame(); 
};


const terminalImage = new Image();
terminalImage.src = '../images4/terminal-data.png'; // 🛑 ИЗМЕНЕНО (Используется для Терминала и Бортового Компьютера)
terminalImage.onload = function() { drawGame(); };

const stoneImage = new Image();
stoneImage.src = '../images4/stone.png'; // 🛑 ИЗМЕНЕНО (Используется для Терминала и Бортового Компьютера)
stoneImage.onload = function() { drawGame(); };

const sourceImage = new Image();
sourceImage.src = '../images4/source-item.png'; // 🛑 ИЗМЕНЕНО (Используется для Менеджера Паролей)
sourceImage.onload = function() { drawGame(); };

const playerImage = new Image();
playerImage.src = '../images4/player-main.png'; // 🛑 ИЗМЕНЕНО
playerImage.onload = function() { drawGame(); };


// Спрайт-листы для анимации (4 кадра, каждый 1098x1098)
const terminalSprite = new Image();
terminalSprite.src = '../images4/terminal-sprite.png'; // Спрайт-лист для терминала

const stoneSprite = new Image();
stoneSprite.src = '../images4/stone-sprite.png'; // Спрайт-лист для бортового компьютера

const sourceSprite = new Image();
sourceSprite.src = '../images4/source-sprite.png'; // Спрайт-лист для менеджера паролей

// Константы анимации
const TOTAL_FRAMES = 8;
const FRAME_WIDTH = 1098;
const FRAME_HEIGHT = 1098;
const FRAME_INTERVAL = 170; // между кадрами при анимации
const MIN_PAUSE_DURATION = 5000; // 10 секунд минимальная пауза
const MAX_PAUSE_DURATION = 10000; // 15 секунд максимальная пауза
const ANIMATION_CYCLES = 2;

const TERMINAL_TOTAL_FRAMES = 8;      // Терминал: 4 кадра
const STONE_TOTAL_FRAMES = 12;        // Бортовой компьютер: 16 кадров
const SOURCE_TOTAL_FRAMES = 13; 


// 🛑 НОВЫЙ КЛАСС: Создаем разные анимации для разных типов сущностей
class EntityAnimation {
    constructor(entityType) {
        this.entityType = entityType; // 'terminal', 'stone', 'source'
        
        // Устанавливаем разное количество кадров в зависимости от типа сущности
        switch(entityType) {
            case 'terminal':
                this.totalFrames = TERMINAL_TOTAL_FRAMES;
                break;
            case 'stone':
                this.totalFrames = STONE_TOTAL_FRAMES;
                break;
            case 'source':
                this.totalFrames = SOURCE_TOTAL_FRAMES;
                break;
            default:
                this.totalFrames = TERMINAL_TOTAL_FRAMES;
        }
        
        this.currentFrame = 0;
        this.state = 'idle';
        this.timer = 0;
        this.animationProgress = 0;
        this.cyclesCompleted = 0;
        this.isPlaying = false;
        
        // Случайное начальное время паузы для каждой сущности
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
            
            // Если время паузы истекло, начинаем анимацию
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
            // Проверяем, нужно ли сменить кадр
            if (this.timer >= FRAME_INTERVAL) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.timer = 0;
                
                // Если дошли до последнего кадра, увеличиваем счетчик циклов
                if (this.currentFrame === 0) {
                    this.cyclesCompleted++;
                    
                    
                    // Если проиграли все циклы, переходим в состояние паузы
                    if (this.cyclesCompleted >= ANIMATION_CYCLES) {
                        this.state = 'idle';
                        this.isPlaying = false;
                        this.nextPauseDuration = this.getRandomPauseDuration();
                        this.idleTimer = this.nextPauseDuration;
                        
                    }
                }
            }
            
            // Обновляем прогресс анимации (0-1)
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
    
    // Метод для отладки
    getDebugInfo() {
        return {
            type: this.entityType,
            state: this.state,
            frame: `${this.currentFrame}/${this.totalFrames-1}`,
            cycles: `${this.cyclesCompleted}/${ANIMATION_CYCLES}`,
            idleTimer: Math.round(this.idleTimer),
            isPlaying: this.isPlaying
        };
    }
}

// Глобальные переменные для анимации
let lastUpdateTime = 0;
let entityAnimations = new Map(); // Хранит анимации для каждой сущности
let debugMode = false; // Режим отладки анимаций

// Функция для получения или создания анимации для сущности
function getEntityAnimation(entityId) {
    if (!entityAnimations.has(entityId)) {
        entityAnimations.set(entityId, new EntityAnimation());
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
    
    // Ограничиваем deltaTime, чтобы избежать больших скачков
    const clampedDeltaTime = Math.min(deltaTime, 100);
    
    // Обновляем все анимации
    entityAnimations.forEach(animation => {
        animation.update(clampedDeltaTime);
    });
    
    return true;
}

// Функция для отрисовки отладочной информации
function drawDebugInfo() {
    if (!debugMode) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 150);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    let y = 30;
    ctx.fillText('Анимации сущностей:', 15, y);
    y += 20;
    
    let index = 0;
    entityAnimations.forEach((animation, entityId) => {
        const info = animation.getDebugInfo();
        ctx.fillText(`${entityId}: ${info.state} (фр: ${info.frame}, цикл: ${info.cycles})`, 15, y + (index * 15));
        index++;
    });
}

// --- Параметры Игры и Уровней ---
let currentPart = 4; // 🛑 ИЗМЕНЕНО: 3 -> 4
let currentLevel = 0; 
const PLAYER_SIZE = 70;
const STEP_SIZE = 70; 
const TEACHER_PASSWORD = 'python'; 

// Заменяем массив THEORETICAL_QUESTIONS на следующий:
const THEORETICAL_QUESTIONS = [
    {
        question: "Что делает оператор '//' в Python?",
        answers: [
            "Обычное деление",
            "Целочисленное деление", 
            "Возведение в степень",
            "Остаток от деления"
        ],
        correct: 1
    },
    {
        question: "Что делает оператор '%' в Python?",
        answers: [
            "Остаток от деления",
            "Целочисленное деление",
            "Умножение",
            "Возведение в степень"
        ],
        correct: 0
    },
    {
        question: "Что делает оператор '**' в Python?",
        answers: [
            "Умножение",
            "Возведение в степень",
            "Деление",
            "Сложение"
        ],
        correct: 1
    },
    {
        question: "Как получить ввод от пользователя в Python?",
        answers: [
            "input()",
            "read()",
            "get()",
            "scan()"
        ],
        correct: 0
    },
    {
        question: "Как вывести что-то в консоль в Python?",
        answers: [
            "echo()",
            "print()",
            "output()",
            "write()"
        ],
        correct: 1
    },
    {
        question: "Как объявить условный оператор в Python?",
        answers: [
            "if условие:",
            "when условие:",
            "case условие:",
            "check условие:"
        ],
        correct: 0
    },
    {
        question: "Как обозначается 'иначе если' в Python?",
        answers: [
            "elseif",
            "elif",
            "elsif",
            "else if"
        ],
        correct: 1
    },
    {
        question: "Как обозначается 'иначе' в Python?",
        answers: [
            "other:",
            "else:",
            "otherwise:",
            "default:"
        ],
        correct: 1
    },
    {
        question: "Как создать переменную в Python?",
        answers: [
            "var x = 5",
            "x = 5",
            "let x = 5",
            "set x = 5"
        ],
        correct: 1
    },
    {
        question: "Что такое 'str()' в Python?",
        answers: [
            "Функция для создания строки",
            "Тип данных 'строка'",
            "Ключевое слово",
            "Модуль для работы с текстом"
        ],
        correct: 0
    },
    {
        question: "Что означает 'int()' в Python?",
        answers: [
            "Преобразование к целому числу",
            "Создание интервала",
            "Проверка типа",
            "Инициализация переменной"
        ],
        correct: 0
    },
    {
        question: "Какой оператор используется для сравнения 'не равно'?",
        answers: [
            "!=",
            "<>",
            "!",
            "=/="
        ],
        correct: 0
    },
    {
        question: "Что делает оператор '=='?",
        answers: [
            "Присваивание",
            "Сравнение на равенство",
            "Сравнение на больше",
            "Сравнение на меньше"
        ],
        correct: 1
    },
    {
        question: "Какой оператор используется для присваивания?",
        answers: [
            "==",
            "=",
            ":=",
            "=>"
        ],
        correct: 1
    },
    {
        question: "Что такое 'input()' по умолчанию возвращает?",
        answers: [
            "Целое число",
            "Дробное число",
            "Строку",
            "Булево значение"
        ],
        correct: 2
    },
    {
        question: "Как преобразовать строку в целое число?",
        answers: [
            "str_to_int()",
            "int()",
            "parseInt()",
            "convert_int()"
        ],
        correct: 1
    },
    {
        question: "Какой тип данных возвращает операция 5 / 2?",
        answers: [
            "int",
            "float",
            "string",
            "bool"
        ],
        correct: 1
    },
    {
        question: "Какой тип данных возвращает операция 5 // 2?",
        answers: [
            "int",
            "float",
            "string",
            "bool"
        ],
        correct: 0
    },
    {
        question: "Что такое 'True' и 'False' в Python?",
        answers: [
            "Строки",
            "Числа",
            "Логические значения (bool)",
            "Специальные функции"
        ],
        correct: 2
    },
    {
        question: "Как обозначается 'больше или равно' в Python?",
        answers: [
            ">=",
            "=>",
            ">=",
            ">="
        ],
        correct: 0
    },
    {
        question: "Что такое 'None' в Python?",
        answers: [
            "Пустая строка",
            "Нулевое значение",
            "Отсутствие значения",
            "Ложное значение"
        ],
        correct: 2
    },
    {
        question: "Что делает оператор 'and' в условии?",
        answers: [
            "Логическое И",
            "Логическое ИЛИ",
            "Логическое НЕ",
            "Добавление условия"
        ],
        correct: 0
    },
    {
        question: "Что делает оператор 'or' в условии?",
        answers: [
            "Логическое И",
            "Логическое ИЛИ",
            "Логическое НЕ",
            "Альтернативное условие"
        ],
        correct: 1
    },
    {
        question: "Что делает оператор 'not' в условии?",
        answers: [
            "Логическое И",
            "Логическое ИЛИ",
            "Логическое НЕ",
            "Инверсия условия"
        ],
        correct: 2
    },
    {
        question: "Как правильно записать условие 'x больше 5 и меньше 10'?",
        answers: [
            "x > 5 and x < 10",
            "x > 5 && x < 10",
            "5 < x < 10",
            "x > 5 or x < 10"
        ],
        correct: 0
    },
    {
        question: "Что выведет код: print(5 + 3 * 2)?",
        answers: [
            "16",
            "11",
            "10",
            "13"
        ],
        correct: 1
    },
    {
        question: "Что выведет код: print(2 ** 3)?",
        answers: [
            "6",
            "8",
            "9",
            "5"
        ],
        correct: 1
    },
    {
        question: "Что выведет код: print(10 % 3)?",
        answers: [
            "3",
            "1",
            "0",
            "3.33"
        ],
        correct: 1
    },
    {
        question: "Что выведет код: print(7 // 2)?",
        answers: [
            "3.5",
            "3",
            "4",
            "3.0"
        ],
        correct: 1
    },
    {
        question: "Как правильно оформить многострочный комментарий в Python?",
        answers: [
            "/* комментарий */",
            "# комментарий",
            "''' комментарий '''",
            "<!-- комментарий -->"
        ],
        correct: 2
    }
];

// Добавить после объявления переменных для вопросов
function getRandomQuestion() {
    // Выбираем случайный вопрос, отличный от предыдущего
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * THEORETICAL_QUESTIONS.length);
    } while (newIndex === currentQuestionIndex && THEORETICAL_QUESTIONS.length > 1);
    
    currentQuestionIndex = newIndex;
    return THEORETICAL_QUESTIONS[newIndex];
}

function showQuestionModal() {
    const question = getRandomQuestion();
    questionAttempts = 0;
    isQuestionModalOpen = true;
    
    // Заполняем модальное окно
    document.getElementById('question-text').textContent = question.question;
    const answersContainer = document.getElementById('question-answers');
    answersContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = `${index + 1}. ${answer}`;
        button.dataset.index = index;
        button.onclick = () => handleAnswer(index, question.correct);
        answersContainer.appendChild(button);
    });
    
    // Скрываем фидбэк и кнопку "Вернуться к уровню"
    document.getElementById('question-feedback').style.display = 'none';
    document.getElementById('return-to-level-btn').style.display = 'none';
    
    // Показываем модальное окно
    document.getElementById('question-modal').style.display = 'flex';
}

function handleAnswer(selectedIndex, correctIndex) {
    questionAttempts++;
    
    const answersContainer = document.getElementById('question-answers');
    const feedbackElement = document.getElementById('question-feedback');
    const returnButton = document.getElementById('return-to-level-btn');
    
    // Отключаем все кнопки
    Array.from(answersContainer.children).forEach(button => {
        button.disabled = true;
        if (parseInt(button.dataset.index) === correctIndex) {
            button.classList.add('correct');
        } else if (parseInt(button.dataset.index) === selectedIndex) {
            button.classList.add('incorrect');
        }
    });
    
    if (selectedIndex === correctIndex) {
        // Правильный ответ
        if (questionAttempts === 1) {
            // Первая попытка - +1 опыт
            totalExperience += 1;
            questionExperienceAwarded = true;
            feedbackElement.textContent = `✅ Правильно! +1 опыт за быстрый ответ!`;
            feedbackElement.className = 'success';
            console.log(`[Опыт] +1 за правильный ответ с первой попытки`);
			saveProgressToGoogleSheets('save', 1);
        } else {
            feedbackElement.textContent = `✅ Правильно! Ответ найден с ${questionAttempts} попытки.`;
            feedbackElement.className = 'success';
        }
        
        feedbackElement.style.display = 'block';
        returnButton.style.display = 'block'; // Показываем кнопку "Вернуться к уровню"
        
    } else {
        // Неправильный ответ
        if (questionAttempts < 3) {
            feedbackElement.textContent = `❌ Попробуй еще раз, ты пока не прошел поверку (попытка ${questionAttempts}/3)`;
            feedbackElement.className = 'error';
            feedbackElement.style.display = 'block';
            returnButton.style.display = 'none'; // Не показываем кнопку
            
            // Через 1.5 секунды показываем новый вопрос
            setTimeout(() => {
                // Показываем новый вопрос
                const newQuestion = getRandomQuestion();
                document.getElementById('question-text').textContent = newQuestion.question;
                
                // Обновляем кнопки ответов
                answersContainer.innerHTML = '';
                newQuestion.answers.forEach((answer, index) => {
                    const button = document.createElement('button');
                    button.textContent = `${index + 1}. ${answer}`;
                    button.dataset.index = index;
                    button.onclick = () => handleAnswer(index, newQuestion.correct);
                    answersContainer.appendChild(button);
                });
                
                feedbackElement.style.display = 'none';
            }, 1500);
            
        } else {
            // Третья неправильная попытка
            totalExperience -= 1; // Вычитаем 1 (может быть отрицательным)
            feedbackElement.textContent = `❌ В следующий раз будь внимательнее, у тебя точно получится. -1 опыт.`;
            feedbackElement.className = 'error';
            feedbackElement.style.display = 'block';
            returnButton.style.display = 'block'; // Показываем кнопку "Вернуться к уровню"
			saveProgressToGoogleSheets('save', -1);
        }
    }
    
    updateExperienceDisplay();
}

function closeQuestionModal() {
    document.getElementById('question-modal').style.display = 'none';
    isQuestionModalOpen = false;
    currentQuestionIndex = -1;
}

function givePassword() {
    passwordCheckPassed = true;
    const greeting = currentLevelData.requiredGreeting;
    
    consoleOutput += `\n> Менеджер Паролей: Приветственное слово для Бортового Компьютера: ${greeting}\n`;
    if (questionExperienceAwarded) {
        consoleOutput += `> Менеджер Паролей: Отличные знания! +1 опыт!\n`;
        questionExperienceAwarded = false;
    }
    
    updateOutputDisplay();
    messageElement.textContent = `Менеджер дал тебе Приветственное Слово: ${greeting}. Иди к Бортовому Компьютеру.`;
}

// Переменные для отслеживания состояния проверки
let currentQuestionIndex = -1;
let questionAttempts = 0;
let isQuestionModalOpen = false;
let passwordCheckPassed = false;
let questionExperienceAwarded = false;

// Переменные для эмуляции Python
let pythonVariables = {
    'n': 1,
    'str': function(x) { return String(x); }};
let consoleOutput = ""; 
let isSkippingBlock = false; // Для if/elif/else
let currentBlockIndentation = 0; // Для if/elif/else
let ifConditionMetInBlock = false; // Для if/elif/else
window.consoleOutputBuffer = "";

// Переменные состояния Игрока
let playerX = 0;
let playerY = 0;
let direction = 'вправо';

// Новые переменные для Занятия 4
let currentLevelData = null; 
let lastPrintedResult = null; 
let printedExpression = null; 
let targetUnlocked = false; 

// 🛑 Глобальное состояние для двухфазной победы
let levelPhase = 'initial'; // 'initial', 'target_greeted'

function str(value) {
    return String(value);
}
window.String = String;

// 🛑 НОВОЕ: Флаги для проверки if/переменных
let currentExecutionFlags = {
    isConditional: false, // Была ли команда вызвана внутри сработавшего if/elif/else
    usedLevelVariable: false // Была ли переменная уровня использована в if/elif
};

let wasWhileLoopExecuted = false;

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
// Функция для расчета опыта при завершении уровня
function calculateExperience() {
    // Используем функцию getStudentIdentifier для уникальности ученика
    let studentIdentifier = getStudentIdentifier();
    
    // 🆕 Ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА (как в уроке 1)
    const partKey = '4.0';
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
    console.log(`Попыток взаимодействия с Фараоном: ${levelAttempts}`);
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

// 🛑 СПИСОК ПРИВЕТСТВИЙ ОТ ЭССЕНЦИИ (Менеджера Паролей)
const ESSENCE_GREETINGS = [
    'СердцеГравитона',
    'ПространствоШов', 
    'ЗвездоПульс',
    'ЩитоТень',
    'КвантоЗеркало',
    'ТвердьНуль',
    'БезмолвиеЗвезд',
    'СветДалёкий',
    'ГлазТуманности',
    'РождениеСверхновой',
    'ВихрьГалактик',
    'ТканьМетавселенной'
];


// --- Вспомогательная функция для создания структуры сущности ---
function createEntity(name_ru, name_en, type, x, y, value = null, index = null) { 
    return { name_ru, name_en, type, x: 0, y: 0, value, index }; 
}

// --- Вспомогательная функция для генерации подсказок по операторам ---
function getOpHint(ops) {
    let operatorsHtml = ops.map(op => `<code>${op.replace(/<.?code>/g, '')}</code>`).join(' ');

    let base = `
        <p><b>Движение:</b> <code>move = int(input())</code>, <code>turn = input()</code></p>
        <p><strong>Доступные операторы:</strong> ${operatorsHtml}</p>
        <p>Для взаимодействия с сущностями используйте <code>print("Слово")</code></p>
        <pre style="background: #2c3e50; color: white; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 5px;">
print("Слово/Код")
</pre>
        <p><b>Взаимодействие (Три сущности):</b></p>
        <p>1. <b>Терминал:</b> Подойдите и скажите <code>print("Проверка данных")</code>, чтобы получить данные уровня или названия переменных.</p>
        <p>2. <b>Менеджер Паролей:</b> Подойдите и скажите <code>print("Спросить")</code>, чтобы получить Приветственное Слово.</p>
    `;
    return base;
}


// --- Вспомогательная функция для генерации подсказок по операторам ---
function getTaskHint(levelData) {
    let hint = `<p><b>Бортовой Компьютер:</b> Подойдите, далее разблокируйте его (<code>print("Пароль")</code>) и последним <code>print()</code> введите правильный код (результат вычислений).</p>`;
    if (levelData.id === '4.6') {
        hint += `<p><b>Подсказка для уровня 4.6:</b> Используй цикл while чтобы вывести каждый этап перевода, посмотри получившийся результат и выведи его отдельным принтом, не стирая остальной программы.</p>`;
    }
    
    return hint;
}

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: НОД (Алгоритм Евклида) ---
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

// -------------------------------------------------------------------------------------------------
// Урок 4: ВЫЧИСЛЕНИЯ (PART_4_LEVELS)
// -------------------------------------------------------------------------------------------------

const PART_4_LEVELS = [
    // 🛑 Уровень 4.1: "Активация системных модулей" (ОБНОВЛЕН)
    {
        id: '4.1',
        name: 'Прямая Последовательность',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null, // Будет последовательность чисел через \n
        magicWords: { 'activated': 'Value' }, 
        description: "Терминал выдал две переменные. Твоя задача — использовать <b>цикл <code>while</code></b> для вывода в консоль всех чисел последовательно от начала до конца (включительно), каждое число с новой строки.",
        operators: ['<code>print()</code>', '<code>while</code>'],
        levelVariable: ['terminal_start', 'terminal_finish'],
        levelVariableRange: [[5, 15], [45, 55]],
        requiredGreeting: null, 
        checkMode: 'sequence', // 🆕 НОВЫЙ ФЛАГ: проверка последовательности
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // 🟢 Уровень 4.2: "Обратная Последовательность" (ОБНОВЛЕН)
    {
        id: '4.2',
        name: 'Обратная Последовательность',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null, // Будет последовательность чисел через \n
        magicWords: { 'activated': 'Value' },
        description: "Терминал выдал две переменные. Твоя задача — использовать <b>цикл <code>while</code></b> для вывода в консоль всех чисел в обратном порядке от конца до начала (включительно), каждое число с новой строки.",
        operators: ['<code>print()</code>', '<code>while</code>'],
        levelVariable: ['terminal_start', 'terminal_finish'],
        levelVariableRange: [[5, 15], [45, 55]],
        requiredGreeting: null,
        checkMode: 'sequence', // 🆕 НОВЫЙ ФЛАГ: проверка последовательности
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.3: "Калибровка энергетических ячеек"
    {
        id: '4.3',
        name: 'Расчет энергетического барьера',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Системы жизнеобепечения нуждаются в стабилизации. Для этого необходимо найти максимально возможный энергетический барьер – наибольшую целую степень двойки, которая не превышает показателя нестабильности N (полученного от терминала). Вы должны вывести найденную степень двойки. Операция возведения в степень запрещена!",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: 'terminal_data',
        levelVariableRange: [15, 100], 
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.4: "Восстановление данных"
    {
        id: '4.4',
        name: 'Восстановление данных',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "При сканировании астероидного поля был поврежден блок данных с координатами. Размер блока (количество цифр в числе) определяет сложность его восстановления. Определите размер поврежденного блока, полученного с терминала навигации.",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: 'terminal_lose_data',
        levelVariableRange: [100, 100000],
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.5: "Алгоритм Евклида - синхронизация частот"
    {
        id: '4.5',
        name: 'Алгоритм Евклида - синхронизация частот',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Два ключевых генератора корабля работают на разных частотах. Для их синхронизации необходимо найти Наибольший Общий Делитель (НОД) их текущих частот. Значения частот считываются с терминала инженерного отсека.",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: ['terminal_evklid1', 'terminal_evklid2'], 
        levelVariableRange: [[100, 1500], [100, 1500]],
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.6: "Двоичный кодировщик координат"
    {
        id: '4.6',
        name: 'Двоичный кодировщик координат',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Для безопасного прохода через нейтронную звезду бортовому компьютеру требуется передать координаты в двоичном формате. Терминал звездной карты выдал десятичные координаты сектора. Переведите их в двоичную систему счисления.",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: 'terminal_binary',
        levelVariableRange: [1, 255],
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.7: "Фильтрация сигналов"
    {
        id: '4.7',
        name: 'Фильтрация сигналов',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "На корабль поступают тысячи сигналов. Для установления контакта необходимо отфильтровать только стабильные (четные) сигналы в заданном диапазоне и посчитать их сумму. Терминал связи определяет верхнюю границу диапазона N.",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: 'terminal_filtred_signal',
        levelVariableRange: [20, 40],
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
        ]
    },

    // Уровень 4.8: "Поиск стабильных частот"
    {
        id: '4.8',
        name: 'Поиск стабильных частот',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Бортовые сенсоры зафиксировали серию квантовых колебаний. Необходимо найти среди них те, что одновременно кратны базовым циклам стабилизации (3 и 5), и суммировать их энергию. Сигналы последовательно поступают с терминала. Конец потока помечен нулевым значением.",
        operators: ['<code>print()</code>', '<code>move</code>', '<code>turn</code>'],
        levelVariable: 'terminal_stable', 
        levelVariableRange: [50, 150],
        requiredGreeting: null,
        entities: [
            createEntity('Терминал', 'terminal', 'terminal', 0, 0),
            createEntity('Менеджер Паролей', 'password_manager', 'source', 0, 0, null),
            createEntity('Бортовой Компьютер', 'onboard_computer', 'target', 0, 0),
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
    
    // Установка Приветственного Слова Менеджера Паролей
    const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
    levelData.requiredGreeting = greetingWord;

    let terminalDataValue;
    let correctResult;
    let isListOrTuple = false;

   switch (levelData.id) {
        case '4.1': 
        case '4.2': { 
            const rangeStart = levelData.levelVariableRange[0];
            const rangeFinish = levelData.levelVariableRange[1];

            const terminalStart = getRandomInt(rangeStart[0], rangeStart[1]);
            const terminalFinish = getRandomInt(rangeFinish[0], rangeFinish[1]);
            
            pythonVariables['terminal_start'] = terminalStart;
            pythonVariables['terminal_finish'] = terminalFinish;

            // 🆕 Формируем последовательность чисел через \n вместо суммы
            let sequence = '';
            if (levelData.id === '4.1') {
                // Прямая последовательность
                for (let i = terminalStart; i <= terminalFinish; i++) {
                    sequence += i;
                    if (i < terminalFinish) sequence += '\n';
                }
            } else if (levelData.id === '4.2') {
                // Обратная последовательность
                for (let i = terminalFinish; i >= terminalStart; i--) {
                    sequence += i;
                    if (i > terminalStart) sequence += '\n';
                }
            }
            
            terminalDataValue = null;
            correctResult = sequence; // Используем последовательность вместо суммы
            
            levelData.displayTerminalData = `terminal_start: ${terminalStart}, terminal_finish: ${terminalFinish}`;
            levelData.levelVariable = null;
            
            break;
        }
        case '4.3': { 
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let N = terminalDataValue;
            pythonVariables['terminal_data'] = terminalDataValue;
            let powerOfTwo = 1;
            while (powerOfTwo * 2 <= N) {
                powerOfTwo *= 2;
            }
            correctResult = powerOfTwo;
            break;
        }
        case '4.4': { 
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            // Number of digits: String(number).length
            pythonVariables['terminal_lose_data'] = terminalDataValue;
            correctResult = String(terminalDataValue).length;
            break;
        }
        case '4.5': { 
    		const range1 = levelData.levelVariableRange[0];
    		const range2 = levelData.levelVariableRange[1];
    
    		const a = getRandomInt(range1[0], range1[1]);
    		const b = getRandomInt(range2[0], range2[1]);
    
    		pythonVariables['terminal_evklid1'] = a;
    		pythonVariables['terminal_evklid2'] = b;
    		terminalDataValue = [a, b]; // Важно: устанавливаем значение
    
    		console.log(`[SETUP 4.5] terminal_evklid1 = ${a}, terminal_evklid2 = ${b}`);
    		correctResult = gcd(a, b);
    
    		levelData.displayTerminalData = `terminal_evklid1: ${a}, terminal_evklid2: ${b}`;
    		break;
	}
        case '4.6': { 
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            // Binary string: number.toString(2)
            pythonVariables['terminal_binary'] = terminalDataValue;
            correctResult = terminalDataValue.toString(2);
            break;
        }
        case '4.7': { 
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            pythonVariables['terminal_filtred_signal'] = terminalDataValue;
	    let sum = 0;
            for (let i = 2; i <= terminalDataValue; i += 2) {
                sum += i;
            }
            correctResult = sum;
            break;
        }
        case '4.8': { 
    		terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            pythonVariables['terminal_stable'] = terminalDataValue;
	    let sum = 0;
            for (let i = 15; i <= terminalDataValue; i += 15) {
                sum += i;
            }
            correctResult = sum;
            break;
	}
    }
    
    // Сохранение значений в levelData
    levelData.levelVariableValue = terminalDataValue;
    levelData.correctCodeword = String(correctResult); // Правильный ответ всегда строка


    // Гарантируем, что список сущностей содержит только три необходимые сущности
    const existingEntities = levelData.entities.filter(e => e.type !== 'passage');
    levelData.entities = existingEntities; 
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
    lessonSubtitle.textContent = 'Занятие 4: While'; 
    lessonText.innerHTML = `
        Ты вошел в центральный отсек корабля. Для запуска систем требуется выполнить ряд вычислений на основе данных, полученных с разных терминалов.<br><br>
        <strong>Вычисления</strong> в Python используются для обработки числовых данных. Тебе нужно будет самостоятельно рассчитать правильный код, используя цикл While.<br>
        <strong>Твоя задача:</strong> Получить данные с <b>Терминала</b>, узнать Приветственное Слово у <b>Менеджера Паролей</b>, рассчитать нужный код и ввести его в <b>Бортовой Компьютер</b> после приветствия!
    `; 
    document.getElementById('start-game-btn').textContent = 'Начать Занятие 4'; 
}

window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    canvas.style.display = 'block';
    outputDisplay.style.display = 'block';
    gameMainTitle.textContent = `Занятие ${currentPart}`;
    codeInput.placeholder = "print(...), move = int(input()), turn = input(), while";
    
    // 🆕 Загружаем сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        currentPart = savedProgress.currentPart || 4;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен:', { currentPart, currentLevel, totalExperience });
    }
    
    // 🆕 Инициализируем опыт при загрузке
    updateExperienceDisplay();
    
    startGame(currentLevel);
    
    // 🆕 Сохраняем факт начала сессии без опыта
    saveProgressToGoogleSheets('save', 0);
}

function showWinModal(isPartComplete = false) {
    // 🆕 Рассчитываем опыт ТОЛЬКО при победе на уровне, а не при завершении занятия
    const earnedExp = !isPartComplete ? calculateExperience() : 0;
    
    const expMessage = isPartComplete 
        ? `<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`
        : `<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
    
    if (winModal.querySelector('#modal-text')) {
        winModal.querySelector('#modal-text').innerHTML += expMessage;
    }
    if (isPartComplete) {
        winModal.querySelector('#modal-title').textContent = "Занятие 4 пройдено!"; 
        winModal.querySelector('#modal-text').innerHTML = `Ты отлично справился с вычислениями! <br> Готов к следующему уроку?`; 
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


window.nextLevel = async function() {
    winModal.style.display = 'none';
    if (currentLevel + 1 < PART_4_LEVELS.length) { 
        currentLevel++;
        // 🆕 Сохраняем прогресс при переходе на следующий уровень без опыта
        await saveProgressToGoogleSheets('save', 0);
        startGame(currentLevel);
    } else {
        // Занятие 4 завершено
        showWinModal(true); 
    }
    updateReferenceContent();
}

window.restartLevel = function() {
    winModal.style.display = 'none';
    startGame(currentLevel);
}

// Обновляем функцию startGame для включения анимаций
// Обновляем функцию startGame для включения анимаций
function startGame(levelIndex) {
    startLevelTracking();

    // Сброс состояния проверки знаний
    passwordCheckPassed = false;
    currentQuestionIndex = -1;
    questionAttempts = 0;
    isQuestionModalOpen = false;
    questionExperienceAwarded = false;

    if (levelIndex < 0 || levelIndex >= PART_4_LEVELS.length) { 
        messageElement.textContent = `Ошибка: Уровень ${levelIndex} не существует. Запущено Занятие 4.1.`; 
        levelIndex = 0;
    }
    currentLevel = levelIndex;
    const levelSource = PART_4_LEVELS[levelIndex]; 
    if (!levelSource) {
        messageElement.textContent = "Ошибка загрузки уровня. Проверьте PART_4_LEVELS."; 
        return;
    }
    
    // 🛑 Сброс ВСЕХ переменных для нового уровня
    pythonVariables = {}; 
    currentLevelData = JSON.parse(JSON.stringify(levelSource));
    setupDynamicLevel(currentLevelData);
    setupRandomPositions(currentLevelData);

    // Сброс состояния
    direction = 'вправо';
    lastPrintedResult = null;
    printedExpression = null;
    consoleOutput = "--- Сброс консоли ---\n";
    targetUnlocked = false; 
    codeInput.value = '';
    messageElement.textContent = `Уровень ${currentLevelData.id}. Введите код.`;

    // Сброс состояния для двухфазной победы
    levelPhase = 'initial';
    wasWhileLoopExecuted = false;
    window.wasWhileLoopExecuted = false; 

    // ОБНОВЛЯЕМ КОНСОЛЬ
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    resetGameExecutionState();
    updateSidebars(currentLevelData);
    
    // Сбрасываем и перезапускаем анимации
    resetAnimations();
    startAnimationLoop();
    updateReferenceContent();
    updateExperienceDisplay();
    drawGame();
}


// Также обновляем обработчики загрузки изображений:
background.onload = function() {
    drawGame(); 
};

terminalSprite.onload = function() { 
    console.log("Terminal sprite loaded");
    drawGame(); 
};

stoneSprite.onload = function() { 
    console.log("Stone sprite loaded");
    drawGame(); 
};

sourceSprite.onload = function() { 
    console.log("Source sprite loaded");
    drawGame(); 
};

playerImage.onload = function() { 
    console.log("Player image loaded");
    drawGame(); 
};

// Запускаем игровой цикл при загрузке
window.addEventListener('load', () => {
    startAnimationLoop();
});

// Функция для отладки анимаций
window.debugAnimations = function() {
    debugMode = !debugMode;
    console.log('Режим отладки анимаций:', debugMode ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН');
    
    entityAnimations.forEach((animation, entityId) => {
        console.log(`${entityId}:`, animation.getDebugInfo());
    });
};

// Функция для принудительного запуска анимации всех сущностей (для тестирования)
window.forceAnimation = function() {
    entityAnimations.forEach((animation, entityId) => {
        animation.state = 'playing';
        animation.currentFrame = 0;
        animation.timer = 0;
        animation.cyclesCompleted = 0;
        animation.isPlaying = true;
        animation.idleTimer = 0;
    });
    console.log('Анимации всех сущностей принудительно запущены');
};

// --- ЛОГИКА ДВИЖЕНИЯ ---
function checkCollision(x, y, entity) {
    // Проверка, находится ли игрок на том же блоке, что и сущность
    const gridSize = PLAYER_SIZE;
    return (
        Math.floor(x / gridSize) === Math.floor(entity.x / gridSize) &&
        Math.floor(y / gridSize) === Math.floor(entity.y / gridSize)
    );
}

// 🛑 НОВАЯ ФУНКЦИЯ ДЛЯ ФИНАЛЬНОЙ ПРОВЕРКИ БОРТОВОГО КОМПЬЮТЕРА
function handleTargetInteraction() {
    const targetEntity = currentLevelData.entities.find(e => e.name_en === 'onboard_computer');
    
    if (!targetEntity || !checkCollision(playerX, playerY, targetEntity)) {
        return;
    }
    levelAttempts++;
    console.log(`[Опыт] Попытка взаимодействия с Фараоном №${levelAttempts}`);
    
    const allOutputLines = window.consoleOutputBuffer.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const firstOutputLine = allOutputLines.length > 0 ? allOutputLines[0] : '';
    
    const requiredGreeting = currentLevelData.requiredGreeting;
    if (levelPhase === 'initial') {
        if (firstOutputLine.includes(requiredGreeting)) { 
            levelPhase = 'target_greeted';
            consoleOutput += `\n> Бортовой Компьютер: Пароль принят! Обработка дальнейших команд...\n`;
            messageElement.textContent = "Бортовой Компьютер: Пароль принят! Обработка дальнейших команд...";
        } else {
            messageElement.textContent = `Бортовой Компьютер ждет Пароль. (Получено: "${firstOutputLine}")`; 
            updateOutputDisplay();
            return;
        }
    }
    
    const requiredCodeword = currentLevelData.correctCodeword;
    if (levelPhase === 'target_greeted') {
        
        if (!window.wasWhileLoopExecuted) {
            messageElement.textContent = "Ты ни разу не использовал while, поэтому компьютер не засчитывает победу.";
            consoleOutput += `\n> Бортовой Компьютер: Ты ни разу не использовал while, поэтому компьютер не засчитывает победу.\n`;
            updateOutputDisplay();
            return;
        }
        
        // 🆕 ОСОБАЯ ПРОВЕРКА ДЛЯ УРОВНЕЙ С ПОСЛЕДОВАТЕЛЬНОСТЬЮ
        if (currentLevelData.checkMode === 'sequence') {
            // Берем все строки вывода после приветствия
            const sequenceOutput = allOutputLines.slice(1).join('\n');
            
            console.log(`[SEQUENCE CHECK] Player output:\n${sequenceOutput}`);
            console.log(`[SEQUENCE CHECK] Expected:\n${requiredCodeword}`);
            
            if (sequenceOutput === requiredCodeword) { 
                consoleOutput += `\n> Бортовой Компьютер: Последовательность верна! Доступ разрешен. УРА!\n`;
                messageElement.textContent = "Бортовой Компьютер: Последовательность верна! Уровень пройден!";
                showWinModal(false);
            } else {
                messageElement.textContent = `Неверная последовательность. Ожидается:\n${requiredCodeword}\nПолучено:\n${sequenceOutput}`;
                consoleOutput += `\n> Бортовой Компьютер: Последовательность неверна. Проверь вывод.\n`;
            }
            updateOutputDisplay();
        } else {
            // Старая логика проверки для остальных уровней
            const allOutput = window.consoleOutputBuffer;
            const numberMatch = allOutput.match(/(\-?\d+(\.\d+)?)\s*$/);
            let finalNumberOutput = '';
            
            if (numberMatch) {
                finalNumberOutput = numberMatch[1];
            }
            
            if (finalNumberOutput === requiredCodeword) { 
                consoleOutput += `\n> Бортовой Компьютер: Доступ разрешен. УРА!\n`;
                messageElement.textContent = "Бортовой Компьютер: Доступ разрешен. Уровень пройден!";
                showWinModal(false);
            } else {
                messageElement.textContent = `Неверный код (${finalNumberOutput}). Ожидается:\n${requiredCodeword}`;
            }
            updateOutputDisplay();
        }
    }
}

// 🛑 ИСПРАВЛЕННАЯ ГЛАВНАЯ ФУНКЦИЯ ВЗАИМОДЕЙСТВИЯ (handlePrintForEntity)
// 🛑 ИСПРАВЛЕННАЯ ГЛАВНАЯ ФУНКЦИЯ ВЗАИМОДЕЙСТВИЯ (handlePrintForEntity)
function handlePrintForEntity(line) {
    const match = line.match(/^print\s*\((.+?)\s*\)$/);
    if (!match) return true;

    let content = match[1].trim();
    let printedText;

    // --- 1. ВЫЧИСЛЕНИЕ ЗНАЧЕНИЯ ---
    const isSimpleString = (content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"));

    if (isSimpleString) {
        printedText = content.slice(1, -1);
    } else {
        try {
            // ... (логика вычисления value) ... // Логика вычисления остается прежней
            const jsContent = content.replace(/\s*,\s*/g, ' + ');
            let value = eval(jsContent.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;
                if (pythonVariables.hasOwnProperty(variableName)) {
                    const varValue = pythonVariables[variableName];
                    return typeof varValue === 'string' ? `' ${varValue}'` : ` ${varValue}`;
                }
                throw new Error(`Переменная ${variableName} не определена.`);
            }));
            if (typeof value === 'string') {
                value = value.trimStart();
            }
            printedText = value; 
        } catch (error) {
            console.log(`[ERROR IN PRINT EVALUATION] ${error.message}`);
            consoleOutput += `[Ошибка: print] ${error.message}\n`;
            updateOutputDisplay();
            messageElement.textContent = `Ошибка в print(): ${error.message}`;
            return false; // Ошибка вычисления - это единственное, что должно прерывать код
        }
    }
    
    lastPrintedResult = printedText;
    consoleOutput += `[Консоль] ${printedText}\n`;
    updateOutputDisplay();
    
    // 🛑 СБОР ВСЕГО ВЫВОДА В БУФЕР ДЛЯ ФИНАЛЬНОЙ ПРОВЕРКИ КОМПЬЮТЕРА
    window.consoleOutputBuffer += String(printedText) + "\n"; 
    
    const normalizedPrintedText = String(printedText).toLowerCase().trim();
    console.log(`[DEBUG] Normalized Print Text for Interaction: "${normalizedPrintedText}"`);


    // --- 2. ИНТЕРАКЦИЯ С ТЕРМИНАЛОМ ---
    const terminalEntity = currentLevelData.entities.find(e => e.name_en === 'terminal');
    if (terminalEntity && checkCollision(playerX, playerY, terminalEntity)) {
        if (normalizedPrintedText === 'проверка данных') {
            const variableSource = currentLevelData.levelVariable;
            const levelId = currentLevelData.id;
            if (levelId === '4.1' || levelId === '4.2') {
                // 🛑 ВЫВОД В КОНСОЛЬ Терминала: Переменные только что загружены
                consoleOutput += `\n> Терминал: Данные получены. Переменные загружены:\n> terminal_start, terminal_finish\n`; 
                updateOutputDisplay();
                messageElement.textContent = `Данные с терминала загружены.`; 
            } else if (levelId === '4.5') {
                // 🛑 ВЫВОД В КОНСОЛЬ Терминала: Переменные только что загружены
                consoleOutput += `\n> Терминал: Данные получены. Переменные загружены:\n> terminal_evklid1, terminal_evklid2\n`; 
                updateOutputDisplay();
                messageElement.textContent = `Данные с терминала загружены.`; 
            } else {
                 // 🛑 ВЫВОД В КОНСОЛЬ Терминала: Переменные уже загружены
                 consoleOutput += `\n> Терминал: Данные уже загружены:\n> ${variableSource}\n`; 
                 updateOutputDisplay();
                 messageElement.textContent = `Данные с терминала уже загружены.`; 
            }
            return true;
        } else {
            messageElement.textContent = `Терминал ждет команду "Проверка данных".`;
            return false; // Неудача взаимодействия должна останавливать код
        }
    }

    // --- 3. ИНТЕРАКЦИЯ С МЕНЕДЖЕРОМ ПАРОЛЕЙ (SOURCE) ---
    const sourceEntity = currentLevelData.entities.find(e => e.name_en === 'password_manager');
    if (sourceEntity && checkCollision(playerX, playerY, sourceEntity)) {
        if (normalizedPrintedText === 'спросить') {
            if (passwordCheckPassed) {
                messageElement.textContent = "Менеджер Паролей: Я уже дал тебе пароль.";
                return true;
            }
        
            // Показываем проверку знаний
            showQuestionModal();
            return true; // Останавливаем выполнение кода до ответа на вопрос
        } else {
            messageElement.textContent = "Менеджер Паролей ждет, что ты спросишь его: 'Спросить'.";
            return false;
        }
    }

    // 🛑 4. БОРТОВОЙ КОМПЬЮТЕР: НИКАКОГО ВЗАИМОДЕЙСТВИЯ ЗДЕСЬ. 
    // ВСЕ ПРОВЕРКИ ПЕРЕНЕСЕНЫ В handleTargetInteraction, КОТОРАЯ СМОТРИТ НА consoleOutputBuffer.

    // Если был print, но взаимодействия с сущностями не было, мы продолжаем выполнение.
    return true;
}


function updateOutputDisplay() {
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
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

// Обновленная функция отрисовки с анимацией
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
    
    const levelData = currentLevelData;
    ctx.textAlign = 'center';

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
        
        const bgWidth = textWidth + PADDING_X * 2;
        const bgHeight = textHeight + PADDING_Y * 2;
        const bgX = x - bgWidth / 2;
        const bgY = y - textHeight - PADDING_Y + VERTICAL_CORRECTION;
        
        // Настройка тени
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = -1;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawRoundedRect(bgX, bgY, bgWidth, bgHeight, RADIUS);

        // Сброс тени
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Отрисовка текста
        ctx.fillStyle = 'black';
        ctx.fillText(text, x, y);
    }

    if (levelData) {
        levelData.entities.forEach((entity, index) => {
            let sprite = null;
            let isSpriteLoaded = false;

            // Выбираем соответствующий спрайт-лист для сущности
            if (entity.name_en === 'onboard_computer') {
                sprite = stoneSprite;
                isSpriteLoaded = stoneSprite.complete;
            } else if (entity.name_en === 'password_manager') {
                sprite = sourceSprite;
                isSpriteLoaded = sourceSprite.complete;
            } else if (entity.name_en === 'terminal') {
                sprite = terminalSprite;
                isSpriteLoaded = terminalSprite.complete;
            }
            
            if (sprite && isSpriteLoaded) {
                // Получаем анимацию для этой сущности
                const entityId = `${entity.name_en}_${index}`;
                const animation = getEntityAnimation(entityId);
                const currentFrame = animation.getCurrentFrame();
                
                // Рисуем текущий кадр из спрайт-листа
                const sx = currentFrame * FRAME_WIDTH;
                const sy = 0;
                
                // Небольшая анимация "дыхания" во время паузы
                let scale = 1;
                let alpha = 1;
                if (!animation.isAnimating()) {
                    // Очень легкое мерцание во время паузы
                    const pulse = Math.sin(Date.now() / 3000) * 0.01;
                    scale = 1 + pulse;
                } else {
                    // Легкое свечение во время анимации
                    const glow = Math.sin(Date.now() / 300) * 0.05 + 0.95;
                    alpha = glow;
                }
                
                // Рассчитываем размер с учетом масштаба
                const scaledWidth = PLAYER_SIZE * scale;
                const scaledHeight = PLAYER_SIZE * scale;
                const offsetX = (PLAYER_SIZE - scaledWidth) / 2;
                const offsetY = (PLAYER_SIZE - scaledHeight) / 2;
                
                ctx.save();
                ctx.translate(entity.x + PLAYER_SIZE/2, entity.y + PLAYER_SIZE/2);
                ctx.scale(scale, scale);
                ctx.translate(-(entity.x + PLAYER_SIZE/2), -(entity.y + PLAYER_SIZE/2));
                
                // Устанавливаем прозрачность для эффекта свечения
                ctx.globalAlpha = alpha;
                
                ctx.drawImage(
                    sprite, 
                    sx, sy, FRAME_WIDTH, FRAME_HEIGHT,
                    entity.x + offsetX, entity.y + offsetY, scaledWidth, scaledHeight
                );
                
                ctx.restore();
                
                // Если нужно, рисуем индикатор анимации (для отладки)
                if (debugMode && animation.isAnimating()) {
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                    ctx.fillRect(entity.x, entity.y - 10, PLAYER_SIZE * animation.getAnimationProgress(), 3);
                }
            } else if (sprite) {
                // Если спрайт еще не загружен, показываем запасной цвет
                ctx.fillStyle = '#3498db';
                ctx.fillRect(entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
            }
            
            // Рисуем текст с фоном для сущности
            let nameTagText = entity.name_ru;
            const centerX = entity.x + PLAYER_SIZE / 2;

            // Основной текст (имя сущности)
            drawTextWithBackground(
                nameTagText,
                centerX,
                entity.y - 25,
                'bold 13px "Century Gothic", sans-serif'
            );

            // Дополнительная информация для терминала
            if (entity.name_en === 'terminal' && pythonVariables.hasOwnProperty('terminal_data')) {
                const secondaryText = `(${levelData.levelVariable})`;
                drawTextWithBackground(
                    secondaryText, 
                    centerX, 
                    entity.y - 5,
                    '12px Arial'
                );
            }
        });
    }

    // Рисуем игрока
    if (playerImage.complete) {
        ctx.drawImage(playerImage, playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
    }

    drawDirectionArrow();
    
    // Рисуем отладочную информацию
    drawDebugInfo();
}

// Функция для запуска цикла анимации
function startAnimationLoop() {
    function animate(currentTime) {
        // Обновляем анимации
        updateAnimations(currentTime);
        
        // Перерисовываем игру
        drawGame();
        
        // Запрашиваем следующий кадр
        requestAnimationFrame(animate);
    }
    
    // Сбрасываем таймеры
    lastUpdateTime = 0;
    requestAnimationFrame(animate);
}


function resetAnimations() {
    entityAnimations.clear();
    
    // Создаем новые анимации для текущих сущностей
    if (currentLevelData && currentLevelData.entities) {
        currentLevelData.entities.forEach((entity, index) => {
            // Определяем тип сущности для анимации
            let entityType;
            if (entity.name_en === 'onboard_computer') {
                entityType = 'stone'; // Бортовой компьютер (16 кадров)
            } else if (entity.name_en === 'password_manager') {
                entityType = 'source'; // Менеджер паролей (16 кадров)
            } else if (entity.name_en === 'terminal') {
                entityType = 'terminal'; // Терминал (4 кадра)
            } else {
                entityType = 'terminal'; // По умолчанию
            }
            
            // Создаем уникальный ID для сущности
            const entityId = `${entity.name_en}_${index}`;
            entityAnimations.set(entityId, new EntityAnimation(entityType));
            
            
        });
    }
}

// Функция для проверки состояния всех анимаций
window.checkAnimations = function() {
    console.log('=== СОСТОЯНИЕ АНИМАЦИЙ ===');
    entityAnimations.forEach((animation, entityId) => {
        const info = animation.getDebugInfo();
        console.log(`${entityId}:`);
        console.log(`  Тип: ${info.type}`);
        console.log(`  Состояние: ${info.state}`);
        console.log(`  Кадр: ${info.frame}`);
        console.log(`  Циклы: ${info.cycles}`);
        console.log(`  Таймер паузы: ${Math.round(info.idleTimer/1000)}s`);
        console.log(`  Играется: ${info.isPlaying}`);
        console.log('---');
    });
};


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
        const maxLevel = PART_4_LEVELS.length;
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
            messageElement.textContent = `Переход на уровень ${PART_4_LEVELS[targetLevelIndex].id} успешно выполнен.`;
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

function handleAssignment(line) {
    const parts = line.split('=').map(p => p.trim());
    if (parts.length !== 2) return false;

    const varName = parts[0];
    let expression = parts[1];

    if (!/^[a-zA-Z_]\w*$/.test(varName)) {
        messageElement.textContent = `Ошибка присвоения: Некорректное имя переменной: ${varName}`;
        return false;
    }
    
    // --- Поддержка целочисленного деления // ---
    // Заменяем // на ~~ для целочисленного деления
    expression = expression.replace(/(\w+|\d+)\s*\/\/\s*(\w+|\d+)/g, '~~($1 / $2)');
    expression = expression.replace(/\bstr\s*\(/g, 'str(');
    
    let value;
    try {
        // Проверяем, является ли выражение арифметическим (включая n = 1, где 1 - число)
        const isArithmeticOrNumber = /[+\-*/%]/.test(expression) || /^\d+(\.\d+)?$/.test(expression); 
        
        const evaluatedExpression = expression.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]\w*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
    	    if (variableName === 'str') {
                return 'str';
            }
            if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
            if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;

            if (pythonVariables.hasOwnProperty(variableName)) {
                const varValue = pythonVariables[variableName];
                
                // 🛑 ГАРАНТИЯ ЧИСЛА ПЕРЕД EVAL (для n = n + 1):
                if (isArithmeticOrNumber) {
                    const numericValue = Number(varValue);
                    if (!isNaN(numericValue)) {
                         return numericValue; 
                    }
                }
                
                // Иначе подставляем как строку (в кавычках) или другое нечисловое значение
                return typeof varValue === 'string' ? `'${varValue}'` : varValue;
            }
            
            // Если переменная не определена, и это не число или строка, выбрасываем ошибку (для обработки n = n + 1, если n не определено)
            if (isArithmeticOrNumber && !/^\d+(\.\d+)?$/.test(expression)) {
                 throw new Error(`Переменная "${variableName}" не определена.`);
            }
            
            // Это, вероятно, числовой или строковый литерал, который не был захвачен предыдущими regex-группами.
            return match; 
        });
        
        console.log(`[ASSIGN_DEBUG] Evaluating: eval("${evaluatedExpression}")`);
        value = eval(evaluatedExpression);
        	if (expression.includes('str(') || (expression.includes('+') && pythonVariables['binary'] !== undefined)) {
        	// Гарантируем, что результат будет строкой
        	value = String(value);
    	}

        // 🛑 ГАРАНТИЯ СОХРАНЕНИЯ ЧИСЛА:
        // Если это арифметическое выражение (или просто числовой литерал, как в n=1), 
        // и результат выглядит как число (даже если eval() вернул его как строку), сохраняем как число.
        if (isArithmeticOrNumber && !isNaN(Number(value)) && value !== '') {
             value = Number(value);
        }

    } catch (error) {
        messageElement.textContent = `Ошибка присвоения: Некорректное выражение: ${expression} (Подробности: ${error.message})`;
        return false;
    }

    // Присваиваем вычисленное значение
    pythonVariables[varName] = value;
    
    // 🛑 КРИТИЧЕСКИ ВАЖНЫЙ ЛОГ: Ищите эту строку, чтобы проверить инкремент!
    console.log(`[ASSIGN_DEBUG] Переменная ${varName} УСПЕШНО обновлена до: ${pythonVariables[varName]} (Type: ${typeof pythonVariables[varName]})`); 
    
    // Обновление UI
    const displayValue = typeof value === 'string' ? `'${value}'` : value;
    messageElement.textContent = `Переменной ${varName} присвоено значение.`;
    return true;
}

function evaluateCondition(conditionText) {
    // --- Поддержка целочисленного деления // в условиях ---
    let processedCondition = conditionText;
    processedCondition = processedCondition.replace(/(\w+|\d+)\s*\/\/\s*(\w+|\d+)/g, '~~($1 / $2)');
    // --- Поддержка str() в условиях ---
    processedCondition = processedCondition.replace(/\bstr\s*\(/g, 'str(');
    
    const jsCondition = processedCondition.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
        if (stringLiteralSingle !== undefined) {
            return `'${stringLiteralSingle}'`;
        }
        if (stringLiteralDouble !== undefined) {
            return `'${stringLiteralDouble}'`;
        }

        if (pythonVariables.hasOwnProperty(variableName)) {
            currentExecutionFlags.usedLevelVariable = true;
            console.log(`[EVAL_COND] Flag set: usedLevelVariable=true (переменная: ${variableName} использована)`);

            const varValue = pythonVariables[variableName];

            if (typeof varValue === 'number') {
                return varValue;
            }
            const numericValue = Number(varValue);
            if (!isNaN(numericValue) && varValue !== '') {
                return numericValue; 
            }

            return typeof varValue === 'string' ? `'${varValue}'` : varValue;
        }

        throw new Error(`Переменная ${variableName} не определена.`);
    });

    try {
        const conditionToEval = jsCondition
           .replace(/and/g, '&&')
           .replace(/or/g, '||')
           .replace(/True/g, 'true')
           .replace(/False/g, 'false');

        const evaluated = eval(conditionToEval);
        console.log(`[EVAL_DEBUG] Condition "${conditionText}" evaluated to JS: "${conditionToEval}". Result: ${!!evaluated}`);
        return !!evaluated;
    } catch (e) {
        consoleOutput += `[Ошибка условия] Не удалось вычислить условие: ${conditionText}. Ошибка: ${e.message}\n`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        messageElement.textContent = `Ошибка в условии: ${e.message}`;
        throw new Error("Condition Error");
    }
}

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ (предполагается, что они объявлены где-то еще)
let whileLoopStack = []; 
let isBreakingLoop = false;
let isContinuingLoop = false;
//... и другие глобальные переменные (handleTeacherMode, drawGame, messageElement, consoleOutput и т.д.)

function resetGameExecutionState() {
    isSkippingBlock = false;
    currentBlockIndentation = 0;
    ifConditionMetInBlock = false;
    currentExecutionFlags.isConditional = false;
    currentExecutionFlags.usedLevelVariable = false;
    isBreakingLoop = false;
    isContinuingLoop = false;
    whileLoopStack = []; 
}



window.executeCode = function() {
    const code = codeInput.value;
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    // Добавляем флаг, который показывает, что мы возвращаемся в тело цикла (пропуская его условие)
    let isReturningToLoopBody = false;
    let wasWhileLoopExecuted = window.wasWhileLoopExecuted || false;
    let controlFlowStack = [{ indentation: 0, conditionMet: false, isSkipping: false, type: 'root', startLineIndex: -1 }];
    if (lines[0] && lines[0].toLowerCase() === 'go') {
        return handleTeacherMode();
    }
    
    // Логика перезапуска (сохранена)
    let startIndex = 0;
    if (typeof window.executionIndex !== 'undefined') {
        if (typeof window.controlFlowStackSnapshot !== 'undefined') {
            controlFlowStack = window.controlFlowStackSnapshot;
        }
        if (typeof window.whileLoopStackSnapshot !== 'undefined') {
            whileLoopStack = window.whileLoopStackSnapshot;
        }
        if (typeof window.isReturningToLoopBodySnapshot !== 'undefined') { // ВОССТАНОВЛЕНИЕ ФЛАГА
            isReturningToLoopBody = window.isReturningToLoopBodySnapshot;
            window.isReturningToLoopBodySnapshot = undefined;
        }
        // 🛑 ИСПРАВЛЕНИЕ 2: Восстанавливаем флаг wasWhileLoopExecuted при перезапуске
        if (typeof window.wasWhileLoopExecutedSnapshot !== 'undefined') { 
            wasWhileLoopExecuted = window.wasWhileLoopExecutedSnapshot;
            window.wasWhileLoopExecutedSnapshot = undefined;
        }
        startIndex = window.executionIndex;
        window.executionIndex = undefined; 
        window.controlFlowStackSnapshot = undefined;
        window.whileLoopStackSnapshot = undefined;
        console.log(`[RESTART] Resuming execution from line ${startIndex + 1}. Stack depth: ${controlFlowStack.length}. ReturningToBody: ${isReturningToLoopBody}`);
    } else {
        lastPrintedResult = null;
        printedExpression = null;
        resetGameExecutionState();
        // 🛑 ИСПРАВЛЕНИЕ 3: Сброс флага при новом запуске
        window.wasWhileLoopExecuted = false; // Сброс глобального состояния
        wasWhileLoopExecuted = false; // Сброс локальной переменной
        // ----------------------------------------------------------------
        consoleOutput += "\n--- Выполнение кода ---\n";
        console.log("--- START EXECUTION ---");
        // 🛑 ИСПРАВЛЕНИЕ 1: Сброс буфера консоли при новом запуске
        window.consoleOutputBuffer = "";
    }
    
    const MAX_ITERATIONS = 10000;
    let totalIterations = 0;
    for (let i = startIndex; i < lines.length; i++) {
        
        totalIterations++;
        if (totalIterations > MAX_ITERATIONS) {
            messageElement.textContent = "Ошибка: Превышено максимальное количество итераций (вероятно, бесконечный цикл).";
            return;
        }

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
        
        const isControlFlowOperator = trimmedLine.startsWith('elif ') || trimmedLine.startsWith('else:') ||
            trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(') || trimmedLine.startsWith('while ');

        // --- 1. Обработка ввода (input) --- (сохранено)
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
        
        // --- 1.5. 🛑 Обработка команд цикла (break/continue)
        if (!isSkippingBlock) {
            if (trimmedLine === 'break') {
                if (whileLoopStack.length > 0) {
                    isBreakingLoop = true;
                    console.log('[LOOP] BREAK command encountered.');
                    continue; 
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'break' вне цикла.`;
                    return;
                }
            } else if (trimmedLine === 'continue') {
                if (whileLoopStack.length > 0) {
                    isContinuingLoop = true;
                    console.log('[LOOP] CONTINUE command encountered.');
                    continue; 
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'continue' вне цикла.`;
                    return;
                }
            }
        }
        
        // --- 2. Логика выхода из блока (IF/ELIF/ELSE/WHILE) ---
        
        // 🛑 Логика принудительного выхода (Needs Forced Exit)
        let needsForcedExit = false;
        if (whileLoopStack.length > 0) {
            const currentWhile = whileLoopStack[whileLoopStack.length - 1];
            //currentBlockIndentation уже установлен в 4, но мы его пересчитываем для надежности
            const currentBlockIndent = currentWhile.indentation + 4;
            const nextLineIndentation = (i < lines.length - 1) 
                                             ?
                                             lines[i+1].length - lines[i+1].trimLeft().length
                                             : -1;
            // Если текущая строка внутри блока, а следующая строка имеет меньший отступ (или это EOF)
            // ИЛИ если текущая строка - последняя в файле, и она была внутри блока
            if ((lineIndentation === currentBlockIndent && nextLineIndentation < currentBlockIndent) || (i === lines.length - 1 && lineIndentation === currentBlockIndent)) {
                needsForcedExit = true;
            }
        }
        
        // --- 🛑 ИСПРАВЛЕНИЕ (из Файла 2): Выполнение команды присвоения перед выходом из блока WHILE (если needsForcedExit == true) ---
        if (needsForcedExit && !isControlFlowOperator && !isSkippingBlock) {
            // Убедитесь, что мы выполняем команду, а не условный оператор
            if (trimmedLine.includes('=')) {
                // Выполняем логику  присвоения, которая уже работает (handleAssignment)
                if (!handleAssignment(trimmedLine)) return;
                console.log('[EXECUTED FIX] Assignment executed before loop check: ' + trimmedLine);
                // Теперь number1 обновлено, и следующая проверка [LOOP CHECK] будет корректной.
                continue;
            }
        }
        
        // 🛑 ГЛАВНОЕ УСЛОВИЕ ПЕРЕХОДА
        if (lineIndentation < currentBlockIndentation || isBreakingLoop || isContinuingLoop || needsForcedExit) {
            console.log(`[BLOCK_EXIT_START] Indent (${lineIndentation}) < CurrentBlock (${currentBlockIndentation}) OR Loop Control OR Forced Exit (${needsForcedExit}). Checking stack collapse.`);
            let pops = 0;
            let jumpedBack = false;

            // 🛑 ПЕРВЫМ ДЕЛОМ: Прыжок к началу цикла при isContinuingLoop
            if (isContinuingLoop && whileLoopStack.length > 0) {
                const currentWhile = whileLoopStack[whileLoopStack.length - 1];
                if (lineIndentation >= currentWhile.indentation) {
                    isContinuingLoop = false;
                    i = currentWhile.startLineIndex - 1; 
                    jumpedBack = true;
                    console.log(`[LOOP JUMP] CONTINUE: Jumping back to line ${currentWhile.startLineIndex + 1} (before while condition)`);
                    continue;
                }
            }

            const indentationCheck = (i === lines.length - 1 && !jumpedBack) ?
                -1 : lineIndentation;

            while (controlFlowStack.length > 1 && indentationCheck <= controlFlowStack[controlFlowStack.length - 1].indentation) {
                const poppedBlock = controlFlowStack[controlFlowStack.length - 1];
                let shouldCollapse = false;

                if (poppedBlock.type === 'while') {
                    const currentWhileState = whileLoopStack.length > 0 ?
                        whileLoopStack[whileLoopStack.length - 1] : null;

                    if (!currentWhileState) {
                         messageElement.textContent = "Внутренняя ошибка: Не удалось найти состояние активного цикла.";
                        return;
                    }

                    if (isBreakingLoop) { 
                        // СЛУЧАЙ 1: BREAK
                        isBreakingLoop = false;
                        shouldCollapse = true; // Выходим из цикла навсегда
                        
                    } else {
                        // СЛУЧАЙ 2: Обычный выход из блока (Needs Forced Exit ИЛИ Indentation Change)
           
                        let shouldRepeat = false;
                        try {
                            console.log(`[LOOP CHECK] Evaluating condition: ${currentWhileState.condition}`);
                            shouldRepeat = evaluateCondition(currentWhileState.condition);
                            console.log(`[LOOP END/REPEAT] WHILE condition check: ${shouldRepeat}.`);
                        } catch(e) { 
                            messageElement.textContent = `Ошибка в условии цикла WHILE: ${e.message}`;
                            return; 
                        }

                        if (shouldRepeat) {
                            // 🛑 ИСПРАВЛЕНИЕ: Прыгаем на ПЕРВУЮ строку ТЕЛА цикла (startLineIndex + 1), минуя сам while
                            i = currentWhileState.startLineIndex;
                            // Устанавливаем i на строку 'while'
                            isReturningToLoopBody = true;
                            // Устанавливаем флаг, чтобы пропустить проверку на следующем шаге
                            jumpedBack = true;
                            console.log(`[LOOP REPEAT JUMP] Jumping back to line ${currentWhileState.startLineIndex + 2} (startLineIndex+1)`);
                            break;
                        } else {
                            // Цикл завершен
                            shouldCollapse = true;
                        }
                    }
                    
                    if (shouldCollapse) {
                           // Удаляем блоки из обоих стеков
      
                           controlFlowStack.pop();
                           whileLoopStack.pop();
                           pops++;
                           console.log(`[LOOP END/BREAK] WHILE block finished/broken at indent ${poppedBlock.indentation}.`);
                           // Продолжаем проверку стека на наличие других блоков, которые нужно закрыть
                    }
                    
                } else {
                    // Это IF/ELIF/ELSE блок (старая логика ОК)
      
                   if (poppedBlock.indentation >= indentationCheck) {
                        controlFlowStack.pop();
                        pops++;
                    } else {
                        break;
                    }
                }
                
                if (jumpedBack) break;
                // Повторяем: Прерываем внешний while, если был прыжок

            }
            
            if (jumpedBack) continue;
            console.log(`[BLOCK_EXIT] Collapsed stack. Popped ${pops} levels. StackDepth: ${controlFlowStack.length}`);
            
            const parentBlock = controlFlowStack[controlFlowStack.length - 1];
            if (parentBlock.type !== 'if' && parentBlock.type !== 'while') {
                 ifConditionMetInBlock = false;
            } else {
                ifConditionMetInBlock = parentBlock.conditionMet;
            }
            isSkippingBlock = parentBlock.isSkipping;
            
            currentBlockIndentation = 0;
            if (controlFlowStack.length > 1) { 
                currentBlockIndentation = controlFlowStack[controlFlowStack.length - 1].indentation + 4;
            } else {
                currentBlockIndentation = 0;
            }
            console.log(`[BLOCK_EXIT] New state: isSkippingBlock=${isSkippingBlock}, CurrentBlock=${currentBlockIndentation}`);
        } 

        // --- 3. Обработка условных операторов (IF/ELIF/ELSE) и ЦИКЛОВ (WHILE) ---
        const isElif = trimmedLine.startsWith('elif ') ||
            trimmedLine.startsWith('elif(');
        const isIf = trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(');
        const isElse = trimmedLine.startsWith('else:');
        const isWhile = trimmedLine.startsWith('while ') || trimmedLine.startsWith('while(');
        
        if (isIf || isElif || isElse || isWhile) {
            
            if (!trimmedLine.endsWith(':')) {
           
                 messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Ожидается двоеточие (:) в конце оператора.`;
                return;
            }
            
            // 🛑 ИСПРАВЛЕНИЕ: Логика пропуска условия цикла
            if (isWhile && isReturningToLoopBody) {
         
                isReturningToLoopBody = false;
                shouldExecuteBlock = true; // Мы знаем, что нужно выполнить тело
                isSkippingBlock = false;
                currentBlockIndentation = lineIndentation + 4;
                console.log(`[LOOP JUMP BODY] Skipping WHILE condition check (line ${i+1}).
Executing body.`);
                
                const currentWhile = whileLoopStack[whileLoopStack.length - 1];
                const newBlockState = {
                    indentation: lineIndentation,
                    conditionMet: false,
                    isSkipping: false,
                    type: 'while',
     
                   startLineIndex: currentWhile.startLineIndex, 
                    condition: currentWhile.condition
                };
                // Переходим на первую строку тела (это произойдет, когда for(i++) увеличит i)
                controlFlowStack.push(newBlockState);
                continue;
            }
            // ----------------------------------------------------

            const currentLevel = controlFlowStack[controlFlowStack.length - 1];
            const isRootLevel = controlFlowStack.length === 1;
            const isNewNestedBlock = lineIndentation > currentLevel.indentation || (isRootLevel && lineIndentation === 0);
            const containerSkipping = isNewNestedBlock 
                ?
                currentLevel.isSkipping 
                : (controlFlowStack.length > 1 ? controlFlowStack[controlFlowStack.length - 2].isSkipping : false);
            console.log(`[COND_DEBUG] Start block. ifConditionMetInBlock: ${ifConditionMetInBlock}, Stack Met: ${currentLevel.conditionMet}, isNewNestedBlock: ${isNewNestedBlock}, containerSkipping: ${containerSkipping}`);
            
            let shouldExecuteBlock = false;
            let conditionText = '';
            let blockType = 'if';

            if (containerSkipping && lineIndentation > 0) { 
                shouldExecuteBlock = false;
                console.log(`[COND_DEBUG] Block skipped due to containerSkipping.`);
            } else if (isIf) { 
                conditionText = trimmedLine.replace(/^(if)\s*\(*/, '').replace(/\)*:$/, '').trim();
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    ifConditionMetInBlock = shouldExecuteBlock;
                    console.log(`[COND_DEBUG] IF result: ${shouldExecuteBlock}`);
                } catch (e) { return;
                }
                blockType = 'if';
            } else if (isElif) { 
                if (!ifConditionMetInBlock) {  
                    conditionText = trimmedLine.replace(/^(elif)\s*\(*/, '').replace(/\)*:$/, '').trim();
                    try {
                        const conditionResult = evaluateCondition(conditionText);
                        shouldExecuteBlock = conditionResult;
                        if (shouldExecuteBlock) {
                            ifConditionMetInBlock = true;
                        }
                        console.log(`[COND_DEBUG] ELIF result: ${shouldExecuteBlock}, New met: ${ifConditionMetInBlock}`);
                    } catch (e) { return; }
                } else {
                    shouldExecuteBlock = false;
                    console.log(`[COND_DEBUG] ELIF skipped because ifConditionMetInBlock=true`);
                }
                blockType = 'if';
            } else if (isElse) { 
                console.log(`[COND_DEBUG] ELSE Check: !ifConditionMetInBlock = ${!ifConditionMetInBlock}`);
                shouldExecuteBlock = !ifConditionMetInBlock; 
                if (shouldExecuteBlock) {
                    ifConditionMetInBlock = true;
                }
                console.log(`[COND_DEBUG] ELSE End. Execute: ${shouldExecuteBlock}, ifConditionMetInBlock: ${ifConditionMetInBlock}`);
                blockType = 'if';
            } else if (isWhile) { 
                conditionText = trimmedLine.replace(/^(while)\s*\(*/, '').replace(/\)*:$/, '').trim();
                blockType = 'while';
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    console.log(`[COND_DEBUG] WHILE result: ${shouldExecuteBlock}`);
                     // 🛑 УСТАНОВКА ФЛАГА ПРИ УСПЕШНОМ ВХОДЕ В ЦИКЛ
        	    if (shouldExecuteBlock) {
            		wasWhileLoopExecuted = true;
            		window.wasWhileLoopExecuted = true;
            		console.log('[WHILE ENTERED] Флаг wasWhileLoopExecuted установлен в true.');
        	    }
                    if (shouldExecuteBlock && isNewNestedBlock) { 
                        const newWhile = {
                            indentation: lineIndentation,
                            condition: conditionText,
    
                            startLineIndex: i 
                        };
                        whileLoopStack.push(newWhile);
                        console.log(`[LOOP START] PUSH WHILE to loop stack. Index: ${i}`);
                    } else if (shouldExecuteBlock && currentLevel.type === 'while' && currentLevel.indentation === lineIndentation) {
                        const topOfLoopStack = whileLoopStack[whileLoopStack.length - 1];
                        topOfLoopStack.startLineIndex = i; 
                        console.log(`[LOOP RE-ENTRY] Update WHILE start index to ${i}.`);
                    } else if (!shouldExecuteBlock && currentLevel.type === 'while' && currentLevel.indentation === lineIndentation) {
                         console.log(`[LOOP SKIP] WHILE condition failed. Skip block.`);
                    }

                } catch (e) { return;
                }
                ifConditionMetInBlock = false;
            }

            // ОБНОВЛЕНИЕ СОСТОЯНИЯ
            if (!isNewNestedBlock && blockType === 'if') {
                isSkippingBlock = !shouldExecuteBlock;
                console.log(`[COND_DEBUG] NOT Nested: Skip=${isSkippingBlock}`);
            } else {
                isSkippingBlock = containerSkipping ||
                    !shouldExecuteBlock;
                console.log(`[COND_DEBUG] Nested/While: Skip=${isSkippingBlock}`);
            }

            currentBlockIndentation = lineIndentation + 4;
            // ДИАГНОСТИКА
            console.log(`[COND_DEBUG] Final: isSkippingBlock=${isSkippingBlock}, currentBlockIndentation=${currentBlockIndentation}`);
            // ОБНОВЛЕНИЕ СТЕКА СОСТОЯНИЙ
            const newBlockState = {
                indentation: lineIndentation,
                conditionMet: blockType === 'if' ?
                    ifConditionMetInBlock : false,
                isSkipping: isSkippingBlock,
                type: blockType,
                startLineIndex: blockType === 'while' ?
                    i : -1, 
                condition: conditionText
            };
            console.log(`[COND] ${trimmedLine} -> Execute: ${shouldExecuteBlock}, Skip: ${isSkippingBlock}, Met: ${newBlockState.conditionMet} (Stack Update)`);
            if (isNewNestedBlock) {
                controlFlowStack.push(newBlockState);
                console.log(`[COND] Stack PUSH: New Depth ${controlFlowStack.length}`);
                ifConditionMetInBlock = shouldExecuteBlock; 
                console.log(`[COND] Reset ifConditionMetInBlock for nested block to: ${ifConditionMetInBlock}`);
            } else {
                controlFlowStack[controlFlowStack.length - 1] = newBlockState;
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
            continue;
        }
        
       // --- 5. Обработка команд ---
        currentExecutionFlags.isConditional = (lineIndentation === currentBlockIndentation && currentBlockIndentation > 0);
        // 🛑 НОВОЕ: ПРОВЕРКА УСПЕШНОГО ЗАПУСКА ЦИКЛА WHILE
	if (whileLoopStack.length > 0 && !wasWhileLoopExecuted) {
    		// Если есть активный цикл в стеке, значит while был использован
    		wasWhileLoopExecuted = true;
    		window.wasWhileLoopExecuted = true; // Синхронизируем с глобальным флагом
    		console.log('[WHILE SUCCESS] wasWhileLoopExecuted set to true.');
	}
        // ----------------------------------------------------
        console.log(`[PRE-EXEC] Executing command: ${trimmedLine}`);
        if (trimmedLine.startsWith('print')) {   
            const match = trimmedLine.match(/^print\s*\((.+?)\s*\)$/);
            if (match) {
                if (printedExpression === null) { printedExpression = match[1].trim();
                }
            } else {
                messageElement.textContent = `Ошибка синтаксиса: Некорректный формат print().
                Ожидается: print(выражение).`;
                return;
            }
            
            if (!handlePrintForEntity(trimmedLine)) return;
            console.log('EXECUTED: ' + trimmedLine); 
            
        } else if (trimmedLine.includes('=')) {
            if (!handleAssignment(trimmedLine)) return;
            console.log('EXECUTED: ' + trimmedLine); 
            
        } else {
            messageElement.textContent = `Ошибка синтаксиса!
            Неизвестная команда: "<b>${trimmedLine}</b>"`;
            console.error(`[ERROR STOP] Unknown command on line ${i+1}: ${trimmedLine}`);
            return;
        }
        
        console.log(`[END ITERATION] Completed line ${i+1}. Next line: ${i+2}`);
    } 
    
    // 🛑 ДОБАВЬТЕ ЭТОТ БЛОК ДЛЯ СИНХРОНИЗАЦИИ
    // --------------------------------------------------------------------------
    if (lines.length > startIndex) {
    	// Если выполнение дошло до конца файла, сохраняем актуальное состояние флага
    	window.wasWhileLoopExecuted = window.wasWhileLoopExecuted || wasWhileLoopExecuted; 
    	console.log(`[EOF SYNC] wasWhileLoopExecuted synchronized to global: ${window.wasWhileLoopExecuted}`);
    }
    // --------------------------------------------------------------------------
    // 🛑 Логика обработки конца файла (EOF) для завершения цикла WHILE
    if (whileLoopStack.length > 0) {
        console.log(`[EOF CHECK] Active WHILE loop found. Triggering final block exit logic.`);
        let shouldRestart = false;
        
        while (controlFlowStack.length > 1) {
            const poppedBlock = controlFlowStack[controlFlowStack.length - 1];
            if (poppedBlock.type === 'while') {
                const currentWhileState = whileLoopStack.length > 0 ?
                    whileLoopStack[whileLoopStack.length - 1] : null;

                if (!currentWhileState) {
                     messageElement.textContent = "Внутренняя ошибка: Не удалось найти состояние активного цикла (EOF).";
                    return;
                }
                
                const conditionText = currentWhileState.condition;
                let shouldRepeat = false;
                
                if (!isBreakingLoop) {
                    try {
                        console.log(`[LOOP CHECK EOF] Evaluating condition: ${conditionText}`);
                        shouldRepeat = evaluateCondition(conditionText);
                    } catch(e) { messageElement.textContent = `Ошибка в условии цикла WHILE: ${e.message}`; return;
                    }
                } else {
                    isBreakingLoop = false;
                }

                if (shouldRepeat) {
                    // 🛑 Сохраняем состояние и перезапускаем
                    window.executionIndex = currentWhileState.startLineIndex + 1;
                    // Возвращаемся на ПЕРВУЮ строку ТЕЛА цикла
                    window.controlFlowStackSnapshot = controlFlowStack.slice();
                    window.whileLoopStackSnapshot = whileLoopStack.slice();
                    window.isReturningToLoopBodySnapshot = true; // Устанавливаем флаг для перезапуска
                    // 🛑 ИСПРАВЛЕНИЕ 4: Сохраняем флаг wasWhileLoopExecuted при перезапуске
                    window.wasWhileLoopExecutedSnapshot = wasWhileLoopExecuted; 
                    // -----------------------------------------------------------------------
                    shouldRestart = true;
                    console.log(`[LOOP REPEAT EOF] Jumping back to line ${currentWhileState.startLineIndex + 2} (startLineIndex+1) and restarting execution.`);
                    break;
                } else {
                    controlFlowStack.pop();
                    whileLoopStack.pop();
                }
            } else {
                controlFlowStack.pop();
            }
        }
        
        if (shouldRestart) {
             return window.executeCode();
        }
    }
    // 🛑 НОВАЯ ФИНАЛЬНАЯ ЛОГИКА
    // --------------------------------------------------------------------------
    // СИНХРОНИЗАЦИЯ ФЛАГА И ЗАПУСК ПРОВЕРКИ ТОЛЬКО ПОСЛЕ ПОЛНОГО ЗАВЕРШЕНИЯ КОДА
    window.wasWhileLoopExecuted = wasWhileLoopExecuted; // Финальная синхронизация
    console.log(`[FINAL SYNC] wasWhileLoopExecuted synchronized to global: ${window.wasWhileLoopExecuted}`);
    
    handleTargetInteraction(); 
    console.log("--- FINISHED EXECUTION ---");
    messageElement.textContent = "Код успешно выполнен. Проверьте консоль и положение.";
    drawGame();
}

// --- СПРАВОЧНИК ДЛЯ ЗАНЯТИЯ 4 ---

const REFERENCE_DATA = {
    4: {  // Занятие 4
        title: "Справочник: Занятие 4 - Цикл while",
        content: `
            <h3>🔄 Цикл while</h3>
            <p><code>while условие:</code> - выполняет блок кода, пока условие истинно</p>
            
            <h3>🚫 Управление циклом</h3>
            <p><code>break</code> - немедленно выходит из цикла</p>
            <p><code>continue</code> - пропускает текущую итерацию, переходит к следующей</p>
            
            <h3>🧮 Арифметические операции</h3>
            <ul>
                <li><code>+</code> - сложение</li>
                <li><code>-</code> - вычитание</li>
                <li><code>*</code> - умножение</li>
                <li><code>/</code> - обычное деление</li>
                <li><code>//</code> - целочисленное деление</li>
                <li><code>%</code> - остаток от деления</li>
                <li><code>**</code> - возведение в степень</li>
            </ul>
            
            <h3>📥 Ввод данных</h3>
            <p><code>int(input())</code> - ввод целого числа</p>
            
            <h3>🚶 Движение и поворот</h3>
            <p><code>move = int(input())</code> - движение на N шагов</p>
            <p><code>turn = input()</code> - поворот (вправо, влево, вверх, вниз)</p>
            
            <h3>📤 Взаимодействие с сущностями</h3>
            <p><code>print("Проверка данных")</code> - получить данные с терминала</p>
            <p><code>print("Спросить")</code> - получить приветствие от менеджера паролей</p>
            <p><code>print(код)</code> - ввести код в бортовой компьютер</p>
        `
    }
}; // <-- Закрывающая фигурная скобка для объекта и точка с запятой
            

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

// 🛑 ВАЖНО: Обработчик события, который привязывает функцию hideIntroAndStart к кнопке
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.onclick = window.hideIntroAndStart; 
    }
});

// --- Запуск игры при загрузке страницы ---
lessonTitle.textContent = 'Курс "Основы Python"';
showIntroScreen();

// Добавляем в конец game.js
document.getElementById('return-to-level-btn').addEventListener('click', function() {
    // Выдаем пароль и закрываем окно
    givePassword();
    closeQuestionModal();
});

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.onclick = window.hideIntroAndStart; 
    }
    
    // 🆕 Инициализация системы пройденных уровней для ученика
    const studentData = JSON.parse(localStorage.getItem('currentStudent'));
    if (studentData) {
        const studentIdentifier = getStudentIdentifier();
        const partKey = '4.0';
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        
        if (!localStorage.getItem(completedKey)) {
            localStorage.setItem(completedKey, '[]');
        }
    }
});
