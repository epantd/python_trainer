const LESSON_NUMBER = 5;

// ===============================
// СИСТЕМА СОХРАНЕНИЯ ПРОГРЕССА
// ===============================

async function saveProgressToGoogleSheets(action = 'update') {
    try {
        const studentData = JSON.parse(localStorage.getItem('currentStudent'));

        if (!studentData) {
            console.log('Нет данных ученика для сохранения');
            return true;
        }

        // ОБНОВЛЯЕМ ВСЕ ДАННЫЕ, ВКЛЮЧАЯ ОПЫТ
        studentData.currentPart = LESSON_NUMBER;
        studentData.currentLevel = currentLevel;
        studentData.experience = totalExperience;  // ← ВАЖНО: сохраняем опыт
        studentData.lastSave = new Date().toISOString();

        // Сохраняем в localStorage (мгновенно)
        localStorage.setItem('currentStudent', JSON.stringify(studentData));

        // Отправляем на сервер ВСЕ ДАННЫЕ, ВКЛЮЧАЯ ОПЫТ
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
                    currentPart: LESSON_NUMBER,
                    currentLevel: studentData.currentLevel || 0,
                    experience: totalExperience,  // ← ОТПРАВЛЯЕМ ОПЫТ
                    lastLogin: new Date().toISOString()
                };

                fetch('https://script.google.com/macros/s/AKfycby7-PMwDOy11PysIDD0DSLkAcB7nq_fugQx6o92RPSYRRd-35Cp9XeC6noO-artX7XT/exec', {
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
            // Восстанавливаем опыт
            if (studentData.experience) {
                totalExperience = studentData.experience;
                console.log('Опыт загружен:', totalExperience);
            }

            // Восстанавливаем уровень ТОЛЬКО если сохраненный урок совпадает с текущим
            if (studentData.currentPart === LESSON_NUMBER && studentData.currentLevel !== undefined) {
                console.log('Загружен уровень', studentData.currentLevel, 'для урока', LESSON_NUMBER);
                return {
                    success: true,
                    currentLevel: studentData.currentLevel
                };
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
    await saveProgressToGoogleSheets('update');
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
background.src = '../images5/game-bg.png';
background.onload = function() {
    drawGame(); 
};


const playerImage = new Image();
playerImage.src = '../images5/player-main.png';
playerImage.onload = function() { drawGame(); };

// Спрайт-листы для анимации
const stoneSprite = new Image();
stoneSprite.src = '../images5/stone-sprite.png'; // Для pharaoh

const sourceSprite = new Image();
sourceSprite.src = '../images5/source-sprite.png'; // Для keeper

const terminalSprite = new Image();
terminalSprite.src = '../images5/terminal-sprite.png'; // Для terminal

// Константы анимации
const STONE_TOTAL_FRAMES = 8;        // Pharaoh: 16 кадров
const SOURCE_TOTAL_FRAMES = 7;       // Keeper: 16 кадров
const TERMINAL_TOTAL_FRAMES = 10;      // Terminal: 4 кадра
const FRAME_WIDTH = 1098;
const FRAME_HEIGHT = 1098;
const FRAME_INTERVAL = 120;
const MIN_PAUSE_DURATION = 5000;
const MAX_PAUSE_DURATION = 10000;
const ANIMATION_CYCLES = 2;
const LAUNCH_INTERVAL = 3000;
const MAX_INITIAL_DELAY = 15000;

// Класс для управления анимацией сущности
class EntityAnimation {
    constructor(entityType, entityIndex) {
        this.entityType = entityType;
        this.entityIndex = entityIndex;
        
        // Устанавливаем разное количество кадров в зависимости от типа сущности
        switch(entityType) {
            case 'stone':
                this.totalFrames = STONE_TOTAL_FRAMES;
                break;
            case 'source':
                this.totalFrames = SOURCE_TOTAL_FRAMES;
                break;
            case 'terminal':
                this.totalFrames = TERMINAL_TOTAL_FRAMES;
                break;
            default:
                this.totalFrames = TERMINAL_TOTAL_FRAMES;
        }
        
        this.currentFrame = 0;
        this.state = 'idle';
        this.timer = 0;
        this.cyclesCompleted = 0;
        this.isPlaying = false;
        
        // Делаем начальную задержку кратной LAUNCH_INTERVAL
        const baseDelay = this.getRandomBaseDelay();
        this.idleTimer = baseDelay + (entityIndex * LAUNCH_INTERVAL);
        
        // Гарантируем, что паузы также будут кратны интервалу
        this.nextPauseDuration = this.getRoundedPauseDuration();
    }
    
    // Функция для получения базовой задержки, кратной интервалу
    getRandomBaseDelay() {
        const maxSteps = Math.floor(MAX_INITIAL_DELAY / LAUNCH_INTERVAL);
        const randomStep = Math.floor(Math.random() * (maxSteps + 1));
        return randomStep * LAUNCH_INTERVAL;
    }
    
    // Функция для получения длительности паузы, кратной интервалу
    getRoundedPauseDuration() {
        let pause = MIN_PAUSE_DURATION + Math.random() * (MAX_PAUSE_DURATION - MIN_PAUSE_DURATION);
        pause = Math.round(pause / LAUNCH_INTERVAL) * LAUNCH_INTERVAL;
        pause = Math.max(MIN_PAUSE_DURATION, Math.min(MAX_PAUSE_DURATION, pause));
        return pause;
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
                        this.nextPauseDuration = this.getRoundedPauseDuration();
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

// Функция для получения или создания анимации для сущности
function getEntityAnimation(entityId) {
    if (!entityAnimations.has(entityId)) {
        // Определяем тип сущности по entityId
        let entityType = 'terminal'; // по умолчанию
        if (entityId.includes('pharaoh')) {
            entityType = 'stone';
        } else if (entityId.includes('keeper')) {
            entityType = 'source';
        }
        
        // Извлекаем индекс из entityId
        const match = entityId.match(/_(\d+)$/);
        const entityIndex = match ? parseInt(match[1]) : 0;
        
        entityAnimations.set(entityId, new EntityAnimation(entityType, entityIndex));
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

// Функция для сброса анимаций при начале нового уровня
function resetAnimations() {
    entityAnimations.clear();
    
    // Создаем новые анимации для текущих сущностей
    if (currentLevelData && currentLevelData.entities) {
        currentLevelData.entities.forEach((entity, index) => {
            // Создаем анимацию только для pharaoh, keeper и terminal
            if (entity.name_en === 'pharaoh' || entity.name_en === 'keeper' || entity.name_en === 'terminal') {
                // Создаем уникальный ID для сущности
                const entityId = `${entity.name_en}_${index}`;
                
                // Определяем тип сущности для анимации
                let entityType;
                if (entity.name_en === 'pharaoh') {
                    entityType = 'stone'; // 16 кадров
                } else if (entity.name_en === 'keeper') {
                    entityType = 'source'; // 16 кадров
                } else if (entity.name_en === 'terminal') {
                    entityType = 'terminal'; // 4 кадра
                }
                
                entityAnimations.set(entityId, new EntityAnimation(entityType, index));
            }
        });
    }
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

// Обработчики загрузки спрайтов
stoneSprite.onload = function() { 
    console.log("Stone sprite loaded");
    drawGame(); 
};

sourceSprite.onload = function() { 
    console.log("Source sprite loaded");
    drawGame(); 
};

terminalSprite.onload = function() { 
    console.log("Terminal sprite loaded");
    drawGame(); 
};

// --- Параметры Игры и Уровней ---
let currentPart = 5; // 🛑 ИЗМЕНЕНО: 3 -> 5
let currentLevel = 0; 
const PLAYER_SIZE = 70;
const STEP_SIZE = 70; 
const TEACHER_PASSWORD = 'python'; 

const KNOWLEDGE_QUESTIONS = [
    {
        question: "Что выведет программа?",
        code: `x = 5\ny = 2\nprint(x + y * 2)`,
        answers: ["9", "14", "7", "10"],
        correct: 0 // 9
    },
    {
        question: "Что выведет программа?",
        code: `a = 10\nb = 3\nprint(a % b)`,
        answers: ["3", "1", "0", "13"],
        correct: 1 // 1
    },
    {
        question: "Что выведет программа?",
        code: `x = 7\nif x > 5:\n    print("A")\nelse:\n    print("B")`,
        answers: ["A", "B", "Ошибка", "Ничего"],
        correct: 0 // A
    },
    {
        question: "Что выведет программа?",
        code: `i = 0\nwhile i < 3:\n    print(i)\n    i += 1`,
        answers: ["0 1 2", "1 2 3", "0 1 2 3", "Бесконечный цикл"],
        correct: 0 // 0 1 2
    },
    {
        question: "Что выведет программа?",
        code: `x = 4\ny = 2\nprint(x ** y)`,
        answers: ["8", "16", "6", "2"],
        correct: 1 // 16
    },
    {
        question: "Что выведет программа?",
        code: `a = 15\nb = 4\nprint(a // b)`,
        answers: ["3", "3.75", "4", "11"],
        correct: 0 // 3
    },
    {
        question: "Что выведет программа?",
        code: `x = 8\ny = 12\nprint(x == y)`,
        answers: ["True", "False", "Ошибка", "8"],
        correct: 1 // False
    },
    {
        question: "Что выведет программа?",
        code: `name = input("Введите имя: ")\n# Пользователь вводит "Анна"\nprint("Привет, " , name)`,
        answers: ["Привет, Анна", "Привет, name", "Ошибка", "Анна"],
        correct: 0 // Привет, Анна
    },
    {
        question: "Что выведет программа?",
        code: `for i in range(3):\n    print(i * 2)`,
        answers: ["0 2 4", "2 4 6", "0 1 2", "0 2 4 6"],
        correct: 0 // 0 2 4
    },
    {
        question: "Что выведет программа?",
        code: `x = 5\ny = 10\nif x > y:\n    print("Больше")\nelif x == y:\n    print("Равно")\nelse:\n    print("Меньше")`,
        answers: ["Меньше", "Больше", "Равно", "Ошибка"],
        correct: 0 // Меньше
    },
    {
        question: "Что выведет программа?",
        code: `a = 20\nb = 6\nprint(a / b)`,
        answers: ["3.333...", "3", "14", "Ошибка"],
        correct: 0 // 3.333...
    },
    {
        question: "Что выведет программа?",
        code: `count = 0\nwhile count < 2:\n    print("Python")\n    count += 1`,
        answers: ["Python Python", "Python", "Python Python Python", "Бесконечный цикл"],
        correct: 0 // Python Python
    },
    {
        question: "Что выведет программа?",
        code: `x = 3\ny = 4\nz = x + y\nprint(z * 2)`,
        answers: ["14", "10", "7", "24"],
        correct: 0 // 14
    },
    {
        question: "Что выведет программа?",
        code: `num = 9\nif num % 2 == 0:\n    print("Четное")\nelse:\n    print("Нечетное")`,
        answers: ["Нечетное", "Четное", "Ошибка", "Ничего"],
        correct: 0 // Нечетное
    },
    {
        question: "Что выведет программа?",
        code: `for i in range(1, 4):\n    print(i)`,
        answers: ["1 2 3", "0 1 2 3", "1 2 3 4", "0 1 2"],
        correct: 0 // 1 2 3
    },
    {
        question: "Что выведет программа?",
        code: `x = 5\ny = 2\nresult = x > y and x < 10\nprint(result)`,
        answers: ["True", "False", "5", "Ошибка"],
        correct: 0 // True
    },
    {
        question: "Что выведет программа?",
        code: `a = 10\nb = 2\nprint(a * b + 5)`,
        answers: ["25", "20", "15", "30"],
        correct: 0 // 25
    },
    {
        question: "Что выведет программа?",
        code: `for letter in "AB":\n    print(letter)`,
        answers: ["A B", "AB", "0 1", "Ошибка"],
        correct: 0 // A B
    },
    {
        question: "Что выведет программа?",
        code: `x = 7\ny = 3\nprint(x != y)`,
        answers: ["True", "False", "7", "3"],
        correct: 0 // True
    },
    {
        question: "Что выведет программа?",
        code: `total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)`,
        answers: ["6", "10", "3", "0"],
        correct: 0 // 6
    },
    {
        question: "Что выведет программа?",
        code: `age = 18\nif age >= 18:\n    print("Совершеннолетний")\nelse:\n    print("Несовершеннолетний")`,
        answers: ["Совершеннолетний", "Несовершеннолетний", "Ошибка", "18"],
        correct: 0 // Совершеннолетний
    },
    {
        question: "Что выведет программа?",
        code: `x = 2\nprint(x ** 3)`,
        answers: ["8", "6", "4", "9"],
        correct: 0 // 8
    },
    {
        question: "Что выведет программа?",
        code: `num = 5\nwhile num > 0:\n    print(num)\n    num -= 1`,
        answers: ["5 4 3 2 1", "4 3 2 1 0", "Бесконечный цикл", "5 4 3 2 1 0"],
        correct: 0 // 5 4 3 2 1
    },
    {
        question: "Что выведет программа?",
        code: `a = 12\nb = 5\nprint(a // b + a % b)`,
        answers: ["4", "2", "7", "Ошибка"],
        correct: 0 // 4
    },
    {
        question: "Что выведет программа?",
        code: `x = True\ny = False\nprint(x or y)`,
        answers: ["True", "False", "Ошибка", "None"],
        correct: 0 // True
    },
    {
        question: "Что выведет программа?",
        code: `for i in range(0, 6, 2):\n    print(i)`,
        answers: ["0 2 4", "0 2 4 6", "2 4 6", "0 1 2 3 4 5"],
        correct: 0 // 0 2 4
    },
    {
        question: "Что выведет программа?",
        code: `score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")`,
        answers: ["B", "A", "C", "85"],
        correct: 0 // B
    },
    {
        question: "Что выведет программа?",
        code: `x = 10\ny = 20\nz = x + y / 2\nprint(z)`,
        answers: ["20.0", "15.0", "30.0", "Ошибка"],
        correct: 0 // 20.0
    },
    {
        question: "Что выведет программа?",
        code: `counter = 3\nwhile counter > 0:\n    print("Hello")\n    counter -= 1`,
        answers: ["Hello Hello Hello", "Hello Hello", "Hello Hello Hello Hello", "Бесконечный цикл"],
        correct: 0 // Hello Hello Hello
    },
    {
        question: "Что выведет программа?",
        code: `a = 4\nb = 2\nprint(a * b ** 2)`,
        answers: ["16", "8", "64", "36"],
        correct: 0 // 16
    }
];

// Переменные для отслеживания состояния проверки знаний
let currentQuestion = null;
let questionAttempts = 0;
let questionExperienceAwarded = false;
let awaitingKeeperPassword = false;
let currentQuestionIndex = -1;

// Функция для показа случайного вопроса
// Замените существующую функцию showRandomQuestion на:
function showRandomQuestion() {
    // Выбираем случайный вопрос, отличный от предыдущего
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * KNOWLEDGE_QUESTIONS.length);
    } while (newIndex === currentQuestionIndex && KNOWLEDGE_QUESTIONS.length > 1);
    
    currentQuestionIndex = newIndex;
    currentQuestion = KNOWLEDGE_QUESTIONS[newIndex];
    questionAttempts = 0;
    questionExperienceAwarded = false;
    
    // Заполняем модальное окно
    document.getElementById('question-title').textContent = "Проверка знаний Хранителя";
    document.getElementById('question-text').innerHTML = `
        <strong>${currentQuestion.question}</strong><br><br>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-family: 'Consolas', monospace;">${currentQuestion.code}</pre>
        <br>Выберите правильный ответ:
    `;
    
    // Очищаем предыдущие ответы
    const answersContainer = document.getElementById('question-answers');
    answersContainer.innerHTML = '';
    
    // Добавляем варианты ответов
    currentQuestion.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = `${String.fromCharCode(65 + index)}) ${answer}`;
        button.dataset.index = index;
        button.onclick = () => handleAnswerSelection(index);
        answersContainer.appendChild(button);
    });
    
    // Скрываем кнопку возврата и фидбэк
    document.getElementById('return-to-level-btn').style.display = 'none';
    document.getElementById('question-feedback').style.display = 'none';
    
    // Показываем модальное окно
    document.getElementById('question-modal').style.display = 'flex';
}

function handleAnswerSelection(selectedIndex) {
    const isCorrect = selectedIndex === currentQuestion.correct;
    const feedbackElement = document.getElementById('question-feedback');
    const returnButton = document.getElementById('return-to-level-btn');
    const answerButtons = document.querySelectorAll('#question-answers button');
    
    // Отключаем все кнопки
    answerButtons.forEach(button => {
        button.disabled = true;
    });
    
    questionAttempts++;
    
    if (isCorrect) {
        // Правильный ответ
        if (questionAttempts === 1) {
            // Первая попытка - начисляем опыт
            totalExperience += 1;
            updateExperienceDisplay();
            feedbackElement.innerHTML = `<div class="success">✅ Правильно! +1 опыт за быстрый ответ!</div>`;
            questionExperienceAwarded = true;
        } else {
            // Не первая попытка - опыт не начисляем
            feedbackElement.innerHTML = `<div class="success">✅ Правильно! Ответ найден с ${questionAttempts} попытки.</div>`;
        }
        
        // Показываем кнопку возврата
        returnButton.style.display = 'inline-block';
        returnButton.onclick = () => {
            closeQuestionModal();
            giveKeeperPassword();
        };
        
    } else {
        // Неправильный ответ
        if (questionAttempts < 3) {
            // Меньше 3 попыток - показываем сообщение и новый вопрос
            feedbackElement.innerHTML = `<div class="error">❌ Попробуй еще раз, ты пока не прошел поверку (попытка ${questionAttempts}/3)</div>`;
            feedbackElement.style.display = 'block';
            
            // Через 1.5 секунды показываем новый вопрос
            setTimeout(() => {
                if (questionAttempts < 3) {
                    // Выбираем новый случайный вопрос
                    let newIndex;
                    do {
                        newIndex = Math.floor(Math.random() * KNOWLEDGE_QUESTIONS.length);
                    } while (newIndex === currentQuestionIndex && KNOWLEDGE_QUESTIONS.length > 1);
                    
                    currentQuestionIndex = newIndex;
                    currentQuestion = KNOWLEDGE_QUESTIONS[newIndex];
                    
                    // Обновляем модальное окно
                    document.getElementById('question-text').innerHTML = `
                        <strong>${currentQuestion.question}</strong><br><br>
                        <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-family: 'Consolas', monospace;">${currentQuestion.code}</pre>
                        <br>Выберите правильный ответ:
                    `;
                    
                    // Обновляем кнопки ответов
                    const answersContainer = document.getElementById('question-answers');
                    answersContainer.innerHTML = '';
                    
                    currentQuestion.answers.forEach((answer, index) => {
                        const button = document.createElement('button');
                        button.textContent = `${String.fromCharCode(65 + index)}) ${answer}`;
                        button.dataset.index = index;
                        button.onclick = () => handleAnswerSelection(index);
                        answersContainer.appendChild(button);
                    });
                    
                    // Скрываем фидбэк
                    feedbackElement.style.display = 'none';
                }
            }, 1500);
            
        } else {
            // 3 попытки и неправильно - отнимаем опыт (может быть отрицательным)
            totalExperience -= 1; // Убрали Math.max, чтобы опыт мог стать отрицательным
            updateExperienceDisplay();
            
            feedbackElement.innerHTML = `<div class="error">❌ В следующий раз будь внимательнее, у тебя точно получится. -1 опыт.</div>`;
            feedbackElement.style.display = 'block';
            
            // Показываем кнопку возврата
            returnButton.style.display = 'inline-block';
            returnButton.onclick = () => {
                closeQuestionModal();
                giveKeeperPassword();
            };
        }
    }
    
    feedbackElement.style.display = 'block';
}

// Функция закрытия модального окна вопроса
function closeQuestionModal() {
    document.getElementById('question-modal').style.display = 'none';
    awaitingKeeperPassword = false;
}

// Функция выдачи пароля от Хранителя
// Также обновите функцию giveKeeperPassword для отображения сообщения о опыте:
function giveKeeperPassword() {
    if (!currentLevelData) return;
    
    const greeting = currentLevelData.requiredGreeting;
    consoleOutput += `\n> Хранитель: Приветственное слово для Фараона: ${greeting}\n`;
    
    // Добавляем сообщение о опыте, если он был получен
    if (questionExperienceAwarded) {
        consoleOutput += `> Хранитель: Отличные знания! +1 опыт!\n`;
        questionExperienceAwarded = false;
    }
    
    updateOutputDisplay();
    messageElement.textContent = `Хранитель дал тебе Приветственное Слово: ${greeting}. Иди к Фараону.`;
    
    // Сбрасываем состояние
    currentQuestion = null;
    questionAttempts = 0;
    currentQuestionIndex = -1;
}

// Переменные для эмуляции Python
let pythonVariables = {'n':1};
let consoleOutput = ""; 
let isSkippingBlock = false; // Для if/elif/else
let currentBlockIndentation = 0; // Для if/elif/else
let ifConditionMetInBlock = false; // Для if/elif/else
window.consoleOutputBuffer = "";

// Переменные состояния Игрока
let playerX = 0;
let playerY = 0;
let direction = 'вправо';

// Новые переменные для Занятия 5
let currentLevelData = null; 
let lastPrintedResult = null; 
let printedExpression = null; 
let targetUnlocked = false; 

// 🛑 Глобальное состояние для двухфазной победы
let levelPhase = 'initial'; // 'initial', 'target_greeted'

// 🛑 НОВОЕ: Флаги для проверки if/переменных
let currentExecutionFlags = {
    isConditional: false, // Была ли команда вызвана внутри сработавшего if/elif/else
    usedLevelVariable: false // Была ли переменная уровня использована в if/elif
};

// Переменные для отслеживания использования циклов
let wasForLoopExecuted = false; // 🆕 ДОБАВИТЬ ЭТУ СТРОКУ

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
    let earnedExp = 0;
    let reasons = [];
    
    console.log("=== РАСЧЕТ ОПЫТА ===");
    console.log(`Попыток взаимодействия с Фараоном: ${levelAttempts}`);
    console.log(`Время старта уровня: ${levelStartTime ? new Date(levelStartTime).toLocaleTimeString() : 'не установлено'}`);
    
    // 1. Базовый опыт за уровень
    earnedExp += 1;
    reasons.push("+1 за завершение уровня");
    console.log("✅ +1 за завершение уровня");
    
    // 2. Бонус за малое количество попыток (≤ 3)
    // 🆕 ИЗМЕНЕНО: считаем только попытки взаимодействия с Фараоном
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
    
    totalExperience += earnedExp;
    // СОХРАНЯЕМ ОПЫТ СРАЗУ ПОСЛЕ РАСЧЕТА
    setTimeout(async () => {
        await saveProgressToGoogleSheets('update');
        console.log('Опыт сохранен на сервер:', totalExperience);
    }, 100);
    
    // Сохраняем в localStorage
    try {
        localStorage.setItem('pythonGameExperience', totalExperience.toString());
    } catch (e) {
        console.error('Ошибка сохранения опыта:', e);
    }
    
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
    'ВеликийНил',
    'СвященныйСкарабей', 
    'ЗолотойФараон',
    'ВечныйСфинкс',
    'ТаинственныйИероглиф',
    'ДревнийПапирус',
    'БожественныйРа',
    'МогучийОсирис',
    'МудраяИсида',
    'ЗащитникАнубис',
    'СокровищеГизы',
    'ПесчанаяВеличество',
    'НебеснаяЛадья',
    'ВечностьПирамид',
    'СветХепри',
    'ТайнаСерапеума',
    'СилаГора',
    'МудростьТота',
    'КолесницаРамсеса',
    'ОбрядОсириса'
];

// 🛑 ДОБАВИТЬ В НАЧАЛО ФАЙЛА (после объявления переменных)
let ifChainState = {
    currentLevel: null,
    hasExecuted: false,
    chainBlocks: []
};

function resetIfChainState() {
    console.log(`[IF_CHAIN_RESET] Resetting if chain state`);
    ifChainState = {
        currentLevel: null,
        hasExecuted: false,
        chainBlocks: []
    };
}

// 🛑 ИЗМЕНЕННАЯ ФУНКЦИЯ updateIfChainState
function updateIfChainState(indentation, conditionMet) {
    console.log(`[IF_CHAIN_DEBUG] updateIfChainState: indentation=${indentation}, conditionMet=${conditionMet}, currentLevel=${ifChainState.currentLevel}, hasExecuted=${ifChainState.hasExecuted}`);
    
    if (ifChainState.currentLevel === null) {
        // Первый блок в цепочке
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    } else if (ifChainState.currentLevel === indentation) {
        // Тот же уровень - обновляем цепочку
        if (conditionMet) {
            ifChainState.hasExecuted = true;
        }
        ifChainState.chainBlocks.push(conditionMet ? 'if/elif' : 'else');
    } else if (indentation > ifChainState.currentLevel) {
        // Вложенный блок - начинаем новую цепочку
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    } else {
        // Уровень меньше текущего - сбрасываем
        resetIfChainState();
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    }
    
    console.log(`[IF_CHAIN_DEBUG] After update: currentLevel=${ifChainState.currentLevel}, hasExecuted=${ifChainState.hasExecuted}, chainBlocks=${ifChainState.chainBlocks.join(',')}`);
}

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
        <p>1. <b>Зодчий:</b> Подойдите и скажите <code>print("План постройки")</code>, чтобы получить данные уровня или названия переменных.</p>
        <p>2. <b>Хранитель:</b> Подойдите и скажите <code>print("Спросить")</code>, чтобы получить Приветственное Слово.</p>
    `;
    return base;
}


// --- Вспомогательная функция для генерации подсказок по операторам ---
function getTaskHint(levelData) {
    let hint = `<p><b>Фараон:</b> Подойдите, далее поприветсвуйте его (<code>print("Пароль")</code>) и последним <code>print()</code> введите правильный код (результат вычислений).</p>`;
    if (levelData.id === '5.1') {
        hint += `<p><b>Подсказка для уровня 5.1:</b> Используй цикл for чтобы вывести символ '█' на каждой строке. Количество строк знает Зодчий.</p>`;
    } else if (levelData.id === '5.2') {
        hint += `<p><b>Подсказка для уровня 5.2:</b> Каждый уровень должен состоять из 5 блоков (символов '█'). Количество уровней узнаешь у Зодчего.</p>`;
    } else if (levelData.id === '5.3') {
        hint += `<p><b>Подсказка для уровня 5.3:</b> Пронумеруй каждый уровень и выведи 5 блоков на каждом уровне. Количество уровней знает Зодчий. Цикл должен учитывать каждый, в том числе и последний уровень.</p>`;
    } else if (levelData.id === '5.4') {
        hint += `<p><b>Подсказка для уровня 5.4:</b> Выведи только четные уровни (те, у которых номер делится на 2). Каждый уровень состоит из 5 блоков и должен быть пронумерован. Нулевой уровень пирамиды учитывать не следует, будем работать начиная с 1.</p>`;
    } else if (levelData.id === '5.5') {
        hint += `<p><b>Подсказка для уровня 5.5:</b> Если номер уровня делится на 3, выведи '█✯█✯█', иначе выведи '█████'. В этот раз так же пропустим 0 уровень, будем начинать работу с 1, однако, надо обязательно не забыть учесть последний - верхний уровень.</p>`;
    } else if (levelData.id === '5.6') {
        hint += `<p><b>Подсказка для уровня 5.6:</b> Если число простое, выведи '✯' умноженное на число (например, '✯✯✯' для 3), иначе выведи '█' умноженное на число.</p>`;
    } else if (levelData.id === '5.7') {
        hint += `<p><b>Подсказка для уровня 5.7:</b> Построй пирамиду, где каждый следующий уровень короче предыдущего.</p>`;
    } else if (levelData.id === '5.8') {
        hint += `<p><b>Подсказка для уровня 5.8:</b> Выведи только уровни, номера которых делятся на 2 или 3. Количество блоков в уровне равно его номеру.</p>`;
    } else if (levelData.id === '5.9') {
        hint += `<p><b>Подсказка для уровня 5.9:</b> Посчитай среднее арифметическое: сложи номера всех уровней (от 1 до той, которую знает Зодчий) и раздели на количество уровней.</p>`;
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
// Урок 5: СТРОИТЕЛЬСТВО ПИРАМИД (PART_5_LEVELS)
// -------------------------------------------------------------------------------------------------

const PART_5_LEVELS = [
    // 🏺 Уровень 5.1: "Фундамент Великой Пирамиды"
    {
        id: '5.1',
        name: 'Фундамент Великой Пирамиды',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фараон приказал заложить фундамент пирамиды. Узнай у Зодчего сколько блоков нужно для основания и выведи каждый блок на отдельной строке.",
        operators: ['<code>print()</code>', '<code>for</code>'],
        levelVariable: 'blocks',
        levelVariableRange: [3, 7],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.2: "Первые Уровни"
    {
        id: '5.2',
        name: 'Первые Уровни',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фундамент готов! Теперь нужно возвести несколько уровней пирамиды. Каждый уровень состоит из 5 блоков.",
        operators: ['<code>print()</code>', '<code>for</code>'],
        levelVariable: 'levels',
        levelVariableRange: [2, 4],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.3: "Учет Камней" (ИЗМЕНЕНО)
    {
        id: '5.3',
        name: 'Учет Камней',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фараон требует вести учет каждого уровня. Пронумеруй каждый уровень пирамиды. Каждый уровень состоит из 5 блоков.",
        operators: ['<code>print()</code>', '<code>for</code>'],
        levelVariable: 'blocks',
        levelVariableRange: [2, 4],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.4: "Священные Числа" (ИЗМЕНЕНО)
    {
        id: '5.4',
        name: 'Священные Числа',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фараон хочет проверить качество строительства. Выведи только четные уровни пирамиды (пронумерованные). Каждый уровень состоит из 5 блоков.",
        operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>'],
        levelVariable: 'levels',
        levelVariableRange: [4, 8],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.5: "Магическая Пирамида" (ИЗМЕНЕНО)
    {
        id: '5.5',
        name: 'Магическая Пирамида',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Жрецы требуют построить магическую пирамиду! Если номер уровня делится на 3, то уровень должен быть вида '█✯█✯█', иначе '█████'.",
        operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>'],
        levelVariable: 'magic_levels',
        levelVariableRange: [3, 6],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.6: "Золотые Блоки" (ИЗМЕНЕНО)
    {
        id: '5.6',
        name: 'Золотые Блоки',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фараону был передан числовой камень. Определи, простое ли это число. Если число простое, выведи '✯' умноженное на число, иначе выведи '█' умноженное на число.",
        operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>'],
        levelVariable: 'gold_blocks',
        levelVariableRange: [10, 20],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.7: "Убывающая Пирамида"
    {
        id: '5.7',
        name: 'Убывающая Пирамида',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Построй специальную пирамиду, где каждый следующий уровень короче предыдущего.",
        operators: ['<code>print()</code>', '<code>for</code>'],
        levelVariable: 'terminal_levels',
        levelVariableRange: [3, 6],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.8: "Секретные Символы" (ИЗМЕНЕНО)
    {
        id: '5.8',
        name: 'Секретные Символы',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Жрецы зашифровали послание в уровнях. Выведи только те уровни, номера которых делятся на 2 или 3. Каждый уровень должен содержать столько блоков, каков его номер.",
        operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>'],
        levelVariable: 'secret_numbers',
        levelVariableRange: [5, 10],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🏺 Уровень 5.9: "Подсчет Блоков" (ИЗМЕНЕНО)
    {
        id: '5.9',
        name: 'Математическая Проверка',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Фараон требует убедиться, что пирамида соответствует математическим стандартам. Посчитай среднее арифметическое номеров уровней (сумма номеров всех уровней / количество уровней).",
        operators: ['<code>print()</code>', '<code>for</code>'],
        levelVariable: 'amount',
        levelVariableRange: [3, 6],
        requiredGreeting: null,
        entities: [
            createEntity('Зодчий', 'terminal', 'terminal', 0, 0),
            createEntity('Хранитель', 'keeper', 'source', 0, 0, null),
            createEntity('Фараон', 'pharaoh', 'target', 0, 0),
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
    
    // Установка Приветственного Слова Хранителя
    const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
    levelData.requiredGreeting = greetingWord;

    let terminalDataValue;
    let correctResult;
    let isListOrTuple = false;

    // Сброс переменных Python перед установкой terminal_data
    pythonVariables = {}; 

    switch (levelData.id) {
        case '5.1': { 
            // Фундамент - вывод N блоков, каждый на отдельной строке
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            // Создаем массив из N строк, каждая содержит один блок
            correctResult = Array(terminalDataValue).fill('█').join('\n');
            break;
        }
        case '5.2': { 
            // Несколько уровней по 5 блоков
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            const level = '█████';
            correctResult = Array(terminalDataValue).fill(level).join('\n');
            break;
        }
        case '5.3': { 
            // Нумерация уровней: каждый уровень имеет номер и 5 блоков
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let pyramid = [];
            for (let level = 1; level <= terminalDataValue; level++) {
                pyramid.push(level + ' █████');
            }
            correctResult = pyramid.join('\n');
            break;
        }
        case '5.4': { 
            // Только четные уровни (пронумерованные)
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let pyramid = [];
            for (let level = 1; level <= terminalDataValue; level++) {
                if (level % 2 === 0) {
                    pyramid.push(level + ' █████');
                }
            }
            correctResult = pyramid.join('\n');
            break;
        }
        case '5.5': { 
            // Магическая пирамида: уровни, делящиеся на 3, имеют вид '█✯█✯█', иначе '█████'
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let pyramid = [];
            for (let level = 1; level <= terminalDataValue; level++) {
                if (level % 3 === 0) {
                    pyramid.push('█✯█✯█');
                } else {
                    pyramid.push('█████');
                }
            }
            correctResult = pyramid.join('\n');
            break;
        }
        case '5.6': { 
            // Простые числа: если число простое, то '✯' повторенное gold_blocks раз, иначе '█' повторенное gold_blocks раз
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            
            // Функция проверки на простое число
            function isPrime(num) {
                if (num < 2) return false;
                for (let i = 2; i <= Math.sqrt(num); i++) {
                    if (num % i === 0) return false;
                }
                return true;
            }
            
            if (isPrime(terminalDataValue)) {
                correctResult = '✯'.repeat(terminalDataValue);
            } else {
                correctResult = '█'.repeat(terminalDataValue);
            }
            break;
        }
        case '5.7': { 
            // Убывающая пирамида
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let pyramid = [];
            for (let i = terminalDataValue; i >= 1; i--) {
                pyramid.push('█'.repeat(i));
            }
            correctResult = pyramid.join('\n');
            break;
        }
        case '5.8': { 
            // Уровни, делящиеся на 2 или 3, выводятся с количеством блоков, равным номеру уровня
            terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let pyramid = [];
            for (let level = 1; level <= terminalDataValue; level++) {
                if (level % 2 === 0 || level % 3 === 0) {
                    pyramid.push('█'.repeat(level));
                }
            }
            correctResult = pyramid.join('\n');
            break;
        }
        case '5.9': { 
            // Среднее арифметическое номеров уровней
    	    terminalDataValue = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
    	    // Сумма чисел от 1 до terminalDataValue
            let sum = 0;
            for (let i = 1; i <= terminalDataValue; i++) {
                sum += i;
            }
            const average = sum / terminalDataValue;
            correctResult = `${average}`;
            break;
        }
    }
    
    // Сохранение значений в levelData
    levelData.levelVariableValue = terminalDataValue;
    levelData.correctCodeword = String(correctResult);
    levelData.displayTerminalData = terminalDataValue;
    pythonVariables[levelData.levelVariable] = terminalDataValue;
}

// Вспомогательная функция для НОД (если понадобится в будущем)
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
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
    lessonSubtitle.textContent = 'Занятие 5: For'; 
    lessonText.innerHTML = `
        Сегодня предстоит поработать в священном зале строителей. Для возведения Великой Пирамиды требуется выполнить ряд вычислений на основе данных, полученных с разных терминалов.<br><br>
        <strong>Вычисления</strong> в Python используются для обработки числовых данных. Тебе нужно будет самостоятельно рассчитать правильный код, используя цикл For.<br>
        <strong>Твоя задача:</strong> Получить данные у <b>Зодчего</b>, узнать Приветственное Слово у <b>Хранителя</b>, рассчитать нужный код и передать его <b>Фараону</b> после приветствия!
    `; 
    document.getElementById('start-game-btn').textContent = 'Начать Занятие 5'; 
}

window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    canvas.style.display = 'block';
    outputDisplay.style.display = 'block';
    gameMainTitle.textContent = `Занятие ${currentPart}`;
    codeInput.placeholder = "print(...), move = int(input()), turn = input(), for i in range():...";
    // Загружаем сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        currentPart = savedProgress.currentPart || 2;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен:', { currentPart, currentLevel, totalExperience });
    startGame(currentLevel);
    }
    // Сохраняем факт начала сессии
    saveProgressToGoogleSheets('login');
}

function showWinModal(isPartComplete = false) {
    const earnedExp = calculateExperience();
    const expMessage = isPartComplete 
        ? `<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`
        : `<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
    
    if (winModal.querySelector('#modal-text')) {
        winModal.querySelector('#modal-text').innerHTML += expMessage;
    }
    if (isPartComplete) {
        winModal.querySelector('#modal-title').textContent = "Занятие 5 пройдено!"; 
        winModal.querySelector('#modal-text').innerHTML = `Ты отлично справился с вычислениями! <br> Готов к следующему уроку?`; 
        document.getElementById('next-level-btn').textContent = 'Продолжить';
    } else {
        winModal.querySelector('#modal-title').textContent = "Уровень пройден!";
        winModal.querySelector('#modal-text').textContent = "Правильно! Переходим к следующей задаче.";
        document.getElementById('next-level-btn').textContent = 'Следующий уровень';
    }
    document.getElementById('next-level-btn').style.display = 'inline-block';
    winModal.style.display = 'flex';
}

window.nextLevel = async function() {
    winModal.style.display = 'none';
    if (currentLevel + 1 < PART_5_LEVELS.length) { 
        currentLevel++;
        // Сохраняем прогресс при переходе на следующий уровень
        await saveProgressToGoogleSheets('update');
        startGame(currentLevel);
    } else {
        // Занятие 5 завершено
        currentPart = 5; 
        currentLevel = 0;
        // Сохраняем прогресс
        await saveProgressToGoogleSheets('update');
        showWinModal(true); 
    }
}

window.restartLevel = function() {
    winModal.style.display = 'none';
    startGame(currentLevel);
}

function startGame(levelIndex) {
    startLevelTracking();
    if (levelIndex < 0 || levelIndex >= PART_5_LEVELS.length) { 
        messageElement.textContent = `Ошибка: Уровень ${levelIndex} не существует. Запущено Занятие 5.1.`; 
        levelIndex = 0;
    }
    currentLevel = levelIndex;
    const levelSource = PART_5_LEVELS[levelIndex]; 
    if (!levelSource) {
        messageElement.textContent = "Ошибка загрузки уровня. Проверьте PART_5_LEVELS."; 
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
    targetUnlocked = false; 
    codeInput.value = '';
    messageElement.textContent = `Уровень ${currentLevelData.id}. Введите код.`;

    // 🛑 Сброс состояния для двухфазной победы
    levelPhase = 'initial';
    wasForLoopExecuted = false;

    // 💡 ОБНОВЛЯЕМ КОНСОЛЬ
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    resetGameExecutionState();
    updateSidebars(currentLevelData);
    updateReferenceContent();
    resetAnimations();
    startAnimationLoop();
    updateExperienceDisplay();
    drawGame();
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

// 🛑 НОВАЯ ФУНКЦИЯ ДЛЯ ФИНАЛЬНОЙ ПРОВЕРКИ БОРТОВОГО КОМПЬЮТЕРА
// 🛑 НОВАЯ ФУНКЦИЯ ДЛЯ ФИНАЛЬНОЙ ПРОВЕРКИ БОРТОВОГО КОМПЬЮТЕРА
function handleTargetInteraction() {
    const targetEntity = currentLevelData.entities.find(e => e.name_en === 'pharaoh');

    // Проверяем, находится ли игрок на компьютере
    if (!targetEntity || !checkCollision(playerX, playerY, targetEntity)) {
        return; // Игрок не на компьютере, или его нет на уровне.
    }
    levelAttempts++;
    console.log(`[Опыт] Попытка взаимодействия с Фараоном №${levelAttempts}`);
    // --- ЛОГИКА АНАЛИЗА ВЫВОДА ДЛЯ ДВУХ ФАЗ ---
    const allOutputLines = window.consoleOutputBuffer.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 1. Ищем ПЕРВУЮ строку для Приветствия/Пароля
    const firstOutputLine = allOutputLines.length > 0 ? allOutputLines[0] : '';
    
    // 2. Получаем весь вывод после приветствия для Финального Результата
    let resultOutput = '';
    if (allOutputLines.length > 1) {
        resultOutput = allOutputLines.slice(1).join('\n');
    }
    // ------------------------------------------

    // 1. ПРОВЕРКА ПРИВЕТСТВИЯ (Фаза 1)
    const requiredGreeting = currentLevelData.requiredGreeting;
    if (levelPhase === 'initial') {
        // Сравниваем ПЕРВУЮ строку вывода с ожидаемым приветствием
        if (firstOutputLine.includes(requiredGreeting)) { 
            // 🚀 Смена фазы
            levelPhase = 'target_greeted';
            consoleOutput += `\n> Фараон: Приветствие принято! Думаю над предложенным алгоритмом...\n`;
            messageElement.textContent = "Фараон: Приветствие принято! Думаю над предложенным алгоритмом...";
            updateOutputDisplay();
            // 🛑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: УДАЛЯЕМ 'return;'
            // Теперь выполнение перейдет к Фазе 2 в том же цикле вызова.
        } else {
            messageElement.textContent = `Фараон ждет приветствие. (Получено: "${firstOutputLine}")`; 
            updateOutputDisplay(); // Обновляем только при неудачном пароле
            return; // Неудачный пароль, прерываем
        }
    }
     
    // 2. ПРОВЕРКА КОДОВОГО СЛОВА (Фаза 2)
    const requiredCodeword = currentLevelData.correctCodeword;
    // Этот блок теперь выполняется сразу после успешного перехода из 'initial' в 'target_greeted'
    if (levelPhase === 'target_greeted') {
        
        // 🛑 УНИВЕРСАЛЬНАЯ ПРОВЕРКА: ИСПОЛЬЗОВАНИЕ ЦИКЛА FOR
        if (!window.wasForLoopExecuted) {
            messageElement.textContent = "Ты ни разу не использовал for, поэтому Фараон не засчитывает победу.";
            consoleOutput += `\n> Фараон: Ты ни разу не использовал for, поэтому я не засчитываю победу.\n`;
            updateOutputDisplay();
            return; // Прерываем проверку победы, если for не был запущен
        }
        
        // --- ЛОГИКА ПРОВЕРКИ ФИНАЛЬНОГО РЕЗУЛЬТАТА ---
        // Сравниваем весь вывод после приветствия с ожидаемым результатом
        if (resultOutput === requiredCodeword) { 
            consoleOutput += `\n> Фараон: Строительство дозволено. УРА!\n`;
            messageElement.textContent = "Фараон: Строительство дозволено. Уровень пройден!";
            updateOutputDisplay();
            showWinModal(false);
        } else {
            messageElement.textContent = `Неверный код. Ожидается:\n${requiredCodeword}\nПолучено:\n${resultOutput}`;
            consoleOutput += `\n> Фараон: Это не то, что я ожидал. Попробуй еще раз.\n`;
            updateOutputDisplay();
        }
    }
}

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
            // 🔴 ИСПРАВЛЕНИЕ: Новая функция для обработки выражений
            const evaluateExpression = (expr) => {
                // Сначала заменяем переменные на их значения
                let processed = expr.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                    if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                    if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;
                    if (pythonVariables.hasOwnProperty(variableName)) {
                        const varValue = pythonVariables[variableName];
                        return typeof varValue === 'string' ? `'${varValue}'` : varValue;
                    }
                    throw new Error(`Переменная ${variableName} не определена.`);
                });

                console.log(`[EVAL_EXPR] After variable substitution: ${processed}`);

                // Обрабатываем умножение строки на число
                const processStringMultiplication = (expr) => {
                    const stringMultiplyPattern = /(['"])(.*?)\1\s*\*\s*([^+\-*/().,\s][^+\-*/).,\s]*)|([^+\-*/().,\s][^+\-*/).,\s]*)\s*\*\s*(['"])(.*?)\5/g;
                    let result = expr;
                    let match;
                    
                    while ((match = stringMultiplyPattern.exec(expr)) !== null) {
                        let str, numExpr;
                        
                        if (match[1]) { // "строка" * число
                            str = match[2];
                            numExpr = match[3];
                        } else { // число * "строка"
                            str = match[6];
                            numExpr = match[4];
                        }
                        
                        // Вычисляем числовое выражение
                        let num;
                        try {
                            // Заменяем переменные в числовом выражении
                            const processedNumExpr = numExpr.replace(/([a-zA-Z_]\w*)/g, (m, varName) => {
                                if (pythonVariables.hasOwnProperty(varName)) {
                                    const val = pythonVariables[varName];
                                    return typeof val === 'string' ? `'${val}'` : val;
                                }
                                return m;
                            });
                            num = eval(processedNumExpr);
                        } catch (e) {
                            throw new Error(`Не удалось вычислить числовое выражение: ${numExpr}`);
                        }
                        
                        if (typeof num === 'number' && !isNaN(num)) {
                            const repeated = str.repeat(num);
                            result = result.replace(match[0], `'${repeated}'`);
                        } else {
                            throw new Error(`Результат не является числом: ${num}`);
                        }
                    }
                    
                    return result;
                };

                // Обрабатываем умножение строк
                processed = processStringMultiplication(processed);
                console.log(`[EVAL_EXPR] After string multiplication: ${processed}`);

                // Теперь вычисляем все выражение
                // Сначала обрабатываем сложение (конкатенацию) строк
                const parts = processed.split(/\s*\+\s*/);
                if (parts.length > 1) {
                    let result = '';
                    for (let part of parts) {
                        if ((part.startsWith("'") && part.endsWith("'")) || 
                            (part.startsWith('"') && part.endsWith('"'))) {
                            result += part.slice(1, -1);
                        } else {
                            // Пробуем вычислить как число или выражение
                            try {
                                const value = eval(part);
                                result += String(value);
                            } catch (e) {
                                result += part;
                            }
                        }
                    }
                    return result;
                } else {
                    // Если нет сложения, просто вычисляем выражение
                    const value = eval(processed.replace(/and/g, '&&')
                        .replace(/or/g, '||')
                        .replace(/not/g, '!')
                        .replace(/True/g, 'true')
                        .replace(/False/g, 'false'));
                    
                    return typeof value === 'string' ? value : String(value);
                }
            };
            
            printedText = evaluateExpression(content);
            
        } catch (error) {
            console.log(`[ERROR IN PRINT EVAL] ${error.message}`);
            consoleOutput += `[Ошибка: print] ${error.message}\n`;
            updateOutputDisplay();
            messageElement.textContent = `Ошибка в print(): ${error.message}`;
            return false;
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
        if (normalizedPrintedText === 'план постройки') {
            const variableSource = currentLevelData.levelVariable;
            const levelId = currentLevelData.id;
            if ('1' == '1') {
                 // 🛑 ВЫВОД В КОНСОЛЬ Терминала: Переменные уже загружены
            consoleOutput += `\n>Данные от Зодчего получены.\n Используй █ если нужны блоки для постройки.\n`; 
            
            // 🔴 ДОБАВЛЯЕМ: Загружаем переменную уровня в pythonVariables
            const variableName = currentLevelData.levelVariable;
            const variableValue = currentLevelData.levelVariableValue;
            pythonVariables[variableName] = variableValue;
            consoleOutput += `> Переменная ${variableName}\n`;
            
            updateOutputDisplay();
            messageElement.textContent = `Данные от Зодчего получены. Переменная ${variableName}`; 
            }
            return true;
        } else {
            messageElement.textContent = `Зодчий ждет команду "План постройки".`;
            return false;
        }
    }

    // --- 3. ИНТЕРАКЦИЯ С МЕНЕДЖЕРОМ ПАРОЛЕЙ (SOURCE) ---
    const sourceEntity = currentLevelData.entities.find(e => e.name_en === 'keeper');
    if (sourceEntity && checkCollision(playerX, playerY, sourceEntity)) {
        if (normalizedPrintedText === 'спросить') {
            // Запускаем проверку знаний
            awaitingKeeperPassword = true;
            showRandomQuestion();
            return true;
        } else {
            messageElement.textContent = "Хранитель ждет, что ты спросишь его: 'Спросить'.";
            return false;
        }
    }

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

// --- МОДИФИЦИРОВАННАЯ ФУНКЦИЯ drawGame ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    const levelData = currentLevelData;
    ctx.textAlign = 'center';

    // =========================================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ТЕКСТА
    // =========================================================================
    const PADDING_X = 10;
    const PADDING_Y = 6;
    const RADIUS = 5;
    
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
        const VERTICAL_CORRECTION = FONT_SIZE * 0.2;
        
        const bgWidth = textWidth + PADDING_X * 2;
        const bgHeight = textHeight + PADDING_Y * 2;
        const bgX = x - bgWidth / 2;
        const bgY = y - textHeight - PADDING_Y + VERTICAL_CORRECTION;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = -1;
        ctx.shadowOffsetY = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawRoundedRect(bgX, bgY, bgWidth, bgHeight, RADIUS);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = 'black';
        ctx.fillText(text, x, y);
    }

    // =========================================================================
    // ОТРИСОВКА СУЩНОСТЕЙ С АНИМАЦИЕЙ
    // =========================================================================
    if (levelData) {
        levelData.entities.forEach((entity, index) => {
            let sprite = null;
            let isSpriteLoaded = false;
            
            // Выбираем соответствующий спрайт-лист для сущности
            if (entity.name_en === 'pharaoh') {
                sprite = stoneSprite;
                isSpriteLoaded = stoneSprite.complete;
            } else if (entity.name_en === 'keeper') {
                sprite = sourceSprite;
                isSpriteLoaded = sourceSprite.complete;
            } else if (entity.name_en === 'terminal') {
                sprite = terminalSprite;
                isSpriteLoaded = terminalSprite.complete;
            }
            
            // Рисуем спрайт с анимацией или статичное изображение
            if (sprite && isSpriteLoaded) {
                // Получаем анимацию для этой сущности
                const entityId = `${entity.name_en}_${index}`;
                const animation = getEntityAnimation(entityId);
                const currentFrame = animation.getCurrentFrame();
                
                // Рисуем текущий кадр из спрайт-листа
                const sx = currentFrame * FRAME_WIDTH;
                const sy = 0;
                
                ctx.drawImage(
                    sprite, 
                    sx, sy, FRAME_WIDTH, FRAME_HEIGHT,
                    entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE
                );
            } else if (sprite) {
                // Если спрайт еще не загружен, показываем запасное статичное изображение
                if (entity.name_en === 'pharaoh' && stoneImage.complete) {
                    ctx.drawImage(stoneImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                } else if (entity.name_en === 'keeper' && sourceImage.complete) {
                    ctx.drawImage(sourceImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                } else if (entity.name_en === 'terminal' && terminalImage.complete) {
                    ctx.drawImage(terminalImage, entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE);
                }
            }

            // Отрисовка текста
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

    // =========================================================================
    // ОТРИСОВКА ИГРОКА (СТАТИЧНАЯ, БЕЗ АНИМАЦИИ)
    // =========================================================================
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
        const maxLevel = PART_5_LEVELS.length;
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
            messageElement.textContent = `Переход на уровень ${PART_5_LEVELS[targetLevelIndex].id} успешно выполнен.`;
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

function evaluateCondition(conditionText) {
    // Эта функция остается без изменений и необходима для работы.
    const jsCondition = conditionText.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
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
let forLoopStack = [];
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
    forLoopStack = [];
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
    
    let value;
    try {
        // 🔴 УПРОЩЕННЫЙ ПОДХОД: Сначала попробуем обработать умножение строки на число
        // Ищем шаблон: "строка" * число или число * "строка"
        const stringMultiplyPattern = /(['"])(.*?)\1\s*\*\s*(.+)|(.+)\s*\*\s*(['"])(.*?)\5/;
        const match = expression.match(stringMultiplyPattern);
        
        if (match) {
            let str, numExpr;
            
            if (match[1]) { // "строка" * число
                str = match[2];
                numExpr = match[3];
            } else { // число * "строка"
                str = match[6];
                numExpr = match[4];
            }
            
            // Заменяем переменные в числовом выражении
            numExpr = numExpr.replace(/([a-zA-Z_]\w*)/g, (match, varName) => {
                if (pythonVariables.hasOwnProperty(varName)) {
                    const val = pythonVariables[varName];
                    return typeof val === 'string' ? `'${val}'` : val;
                }
                return match;
            });
            
            // Вычисляем числовое выражение
            let num;
            try {
                num = eval(numExpr);
            } catch (e) {
                throw new Error(`Не удалось вычислить числовое выражение: ${numExpr}`);
            }
            
            if (typeof num === 'number' && !isNaN(num)) {
                value = str.repeat(num);
            } else {
                throw new Error(`Результат не является числом: ${num}`);
            }
        } else {
            // Стандартная обработка для других выражений
            const isArithmeticOrNumber = /[+\-*/%]/.test(expression) || /^\d+(\.\d+)?$/.test(expression); 
            
            const evaluatedExpression = expression.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]\w*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                
                if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;

                if (pythonVariables.hasOwnProperty(variableName)) {
                    const varValue = pythonVariables[variableName];
                    
                    if (isArithmeticOrNumber) {
                        const numericValue = Number(varValue);
                        if (!isNaN(numericValue)) {
                            return numericValue; 
                        }
                    }
                    
                    return typeof varValue === 'string' ? `'${varValue}'` : varValue;
                }
                
                if (isArithmeticOrNumber && !/^\d+(\.\d+)?$/.test(expression)) {
                    throw new Error(`Переменная "${variableName}" не определена.`);
                }
                return match; 
            });
            
            console.log(`[ASSIGN_DEBUG] Evaluating: eval("${evaluatedExpression}")`);
            value = eval(evaluatedExpression);

            if (isArithmeticOrNumber && !isNaN(Number(value)) && value !== '') {
                value = Number(value);
            }
        }

    } catch (error) {
        messageElement.textContent = `Ошибка присвоения: Некорректное выражение: ${expression} (Подробности: ${error.message})`;
        return false;
    }

    pythonVariables[varName] = value;
    console.log(`[ASSIGN_DEBUG] Переменная ${varName} УСПЕШНО обновлена до: ${pythonVariables[varName]} (Type: ${typeof pythonVariables[varName]})`); 
    
    const displayValue = typeof value === 'string' ? `'${value}'` : value;
    messageElement.textContent = `Переменной ${varName} присвоено значение.`;
    return true;
}

function parseForLoop(line) {
    const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^)]+))?\s*\)\s*:$/);
    if (!forMatch) return null;

    const varName = forMatch[1];
    
    // Функция для преобразования выражения в число с учетом переменных
    const parseRangeValue = (expr) => {
        if (!expr) return undefined;
        
        // Если выражение - число, возвращаем его
        if (!isNaN(expr)) {
            return parseInt(expr);
        }
        
        // Если выражение - переменная, ищем в pythonVariables
        if (pythonVariables.hasOwnProperty(expr)) {
            const value = pythonVariables[expr];
            if (typeof value === 'number') {
                return value;
            }
            // Пробуем преобразовать строку в число
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                return numValue;
            }
        }
        
        // Если это математическое выражение, вычисляем его
        try {
            // Заменяем переменные на их значения
            let processedExpr = expr;
            for (const [varName, varValue] of Object.entries(pythonVariables)) {
                const regex = new RegExp('\\b' + varName + '\\b', 'g');
                processedExpr = processedExpr.replace(regex, 
                    typeof varValue === 'string' ? `"${varValue}"` : varValue
                );
            }
            
            const result = eval(processedExpr);
            if (typeof result === 'number' && !isNaN(result)) {
                return result;
            }
        } catch (e) {
            console.error(`[RANGE_ERROR] Cannot evaluate expression: ${expr}`, e);
        }
        
        throw new Error(`Некорректное значение в range(): ${expr}`);
    };
    
    let start, end, step;
    
    if (forMatch[3] === undefined) {
        start = 0;
        end = parseRangeValue(forMatch[2]);
        step = 1;
    } else if (forMatch[4] === undefined) {
        start = parseRangeValue(forMatch[2]);
        end = parseRangeValue(forMatch[3]);
        step = 1;
    } else {
        start = parseRangeValue(forMatch[2]);
        end = parseRangeValue(forMatch[3]);
        step = parseRangeValue(forMatch[4]);
    }

    return {
        varName: varName,
        current: start,
        end: end,
        step: step,
        startValue: start,
        endValue: end,
        stepValue: step
    };
}

window.executeCode = function() {
    const code = codeInput.value;
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    let isReturningToLoopBody = false;
    let wasForLoopExecuted = window.wasForLoopExecuted || false;
    let controlFlowStack = [{ indentation: 0, conditionMet: false, isSkipping: false, type: 'root', startLineIndex: -1, ifChainExecuted: false }];
    resetIfChainState();
    if (lines[0] && lines[0].toLowerCase() === 'go') {
        return handleTeacherMode();
    }
    
    let startIndex = 0;
    if (typeof window.executionIndex !== 'undefined') {
        if (typeof window.controlFlowStackSnapshot !== 'undefined') {
            controlFlowStack = window.controlFlowStackSnapshot;
        }
        if (typeof window.whileLoopStackSnapshot !== 'undefined') {
            whileLoopStack = window.whileLoopStackSnapshot;
        }
        if (typeof window.forLoopStackSnapshot !== 'undefined') {
            forLoopStack = window.forLoopStackSnapshot;
        }
        if (typeof window.isReturningToLoopBodySnapshot !== 'undefined') {
            isReturningToLoopBody = window.isReturningToLoopBodySnapshot;
            window.isReturningToLoopBodySnapshot = undefined;
        }
        if (typeof window.wasForLoopExecutedSnapshot !== 'undefined') { 
            wasForLoopExecuted = window.wasForLoopExecutedSnapshot;
            window.wasForLoopExecutedSnapshot = undefined;
        }
        
        startIndex = window.executionIndex;
        window.executionIndex = undefined; 
        window.controlFlowStackSnapshot = undefined;
        window.whileLoopStackSnapshot = undefined;
        window.forLoopStackSnapshot = undefined;
        console.log(`[RESTART] Resuming execution from line ${startIndex + 1}. Stack depth: ${controlFlowStack.length}. ReturningToBody: ${isReturningToLoopBody}`);
    } else {
        lastPrintedResult = null;
        printedExpression = null;
        resetGameExecutionState();
        window.wasForLoopExecuted = false;
        wasForLoopExecuted = false;
        consoleOutput += "\n--- Выполнение кода ---\n";
        console.log("--- START EXECUTION ---");
        window.consoleOutputBuffer = "";
        const levelVariables = {};
        Object.keys(pythonVariables).forEach(key => {
            if (currentLevelData && currentLevelData.levelVariable === key) {
                levelVariables[key] = pythonVariables[key];
            }
        });
        pythonVariables = { 'n': 1, ...levelVariables };
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
        
        // Определяем типы операторов
        const isElse = trimmedLine.startsWith('else:');
        const isElif = trimmedLine.startsWith('elif ') || trimmedLine.startsWith('elif(');
        const isIf = trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(');
        const isWhile = trimmedLine.startsWith('while ') || trimmedLine.startsWith('while(');
        const isFor = trimmedLine.startsWith('for ');
        
        const isControlFlowOperator = isElse || isElif || isIf || isWhile || isFor;

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
        
        // --- 1.5. Обработка команд цикла (break/continue)
        if (!isSkippingBlock) {
            if (trimmedLine === 'break') {
                if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
                    isBreakingLoop = true;
                    console.log('[LOOP] BREAK command encountered.');
                    continue; 
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'break' вне цикла.`;
                    return;
                }
            } else if (trimmedLine === 'continue') {
                if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
                    isContinuingLoop = true;
                    console.log('[LOOP] CONTINUE command encountered.');
                    continue; 
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'continue' вне цикла.`;
                    return;
                }
            }
        }
        
        // --- 2. Логика выхода из блока (IF/ELIF/ELSE/WHILE/FOR) ---
        
        let needsForcedExit = false;
        if (lineIndentation < currentBlockIndentation) {
            needsForcedExit = true;
            console.log(`[FORCED_EXIT] Triggered: lineIndentation (${lineIndentation}) < currentBlockIndentation (${currentBlockIndentation})`);
        }

        // 🔴 ИСПРАВЛЕНИЕ: Специальная обработка для else/elif при смене уровня отступа
        if (lineIndentation < currentBlockIndentation || isBreakingLoop || isContinuingLoop || needsForcedExit) {
            console.log(`[BLOCK_EXIT_START] Indent (${lineIndentation}) < CurrentBlock (${currentBlockIndentation}) OR Loop Control OR Forced Exit (${needsForcedExit}). Checking stack collapse.`);
            let pops = 0;
            let jumpedBack = false;

            // 🔴 ДОБАВЛЕНО: Если это else/elif, и мы на том же уровне, что и родительский if, не пропускаем его
            const parentBlock = controlFlowStack[controlFlowStack.length - 1];
            const isElseOrElifOnSameLevel = (isElse || isElif) && parentBlock && parentBlock.type === 'if' && parentBlock.indentation === lineIndentation;
            
            if (isElseOrElifOnSameLevel) {
                console.log(`[ELSE_ELIF_SAME_LEVEL] else/elif belongs to parent if at same indent ${lineIndentation}, not collapsing.`);
                // Устанавливаем текущий отступ блока равным отступу else/elif
                currentBlockIndentation = lineIndentation;
                isSkippingBlock = false; // 🔴 ВАЖНО: Сбрасываем пропуск блока для else/elif
                // Пропускаем стандартную логику выхода из блока для else/elif
            } else {
                // Стандартная логика выхода из блока
                // Прыжок к началу цикла при isContinuingLoop
                if (isContinuingLoop && (whileLoopStack.length > 0 || forLoopStack.length > 0)) {
                    const currentLoop = whileLoopStack.length > 0 ? whileLoopStack[whileLoopStack.length - 1] : forLoopStack[forLoopStack.length - 1];
                    if (!currentLoop) {
                        console.log(`[CONTINUE_ERROR] currentLoop is undefined, skipping continue.`);
                        isContinuingLoop = false;
                        continue;
                    }
                    if (lineIndentation >= currentLoop.indentation) {
                        isContinuingLoop = false;
                        i = currentLoop.startLineIndex;
                        jumpedBack = true;
                        console.log(`[LOOP JUMP] CONTINUE: Jumping back to line ${currentLoop.startLineIndex + 1} (loop condition)`);
                        continue;
                    }
                }

                while (controlFlowStack.length > 1 && lineIndentation <= controlFlowStack[controlFlowStack.length - 1].indentation) {
                    const poppedBlock = controlFlowStack[controlFlowStack.length - 1];
                    let shouldCollapse = false;

                    if (poppedBlock.type === 'while' || poppedBlock.type === 'for') {
                        const loopStack = poppedBlock.type === 'while' ? whileLoopStack : forLoopStack;
        
                        // 🔴 ДОБАВЛЕНА ПРОВЕРКА: Убедимся, что в стеке есть элементы
                        if (loopStack.length === 0) {
                            console.log(`[BLOCK_EXIT_WARNING] ${poppedBlock.type} stack is empty, skipping.`);
                            controlFlowStack.pop();
                            pops++;
                            continue;
                        }
        
                        const currentLoopState = loopStack[loopStack.length - 1];
        
                        if (!currentLoopState) {
                            console.log(`[BLOCK_EXIT_WARNING] currentLoopState is undefined, skipping.`);
                            controlFlowStack.pop();
                            pops++;
                            continue;
                        }

                        if (isBreakingLoop) { 
                            isBreakingLoop = false;
                            shouldCollapse = true;
                            
                        } else {
                            let shouldRepeat = false;
                            
                            if (poppedBlock.type === 'while') {
                                try {
                                    console.log(`[LOOP CHECK] Evaluating WHILE condition: ${currentLoopState.condition}`);
                                    shouldRepeat = evaluateCondition(currentLoopState.condition);
                                    console.log(`[LOOP END/REPEAT] WHILE condition check: ${shouldRepeat}.`);
                                } catch(e) { 
                                    messageElement.textContent = `Ошибка в условии цикла WHILE: ${e.message}`;
                                    return; 
                                }
                            } else {
                                // 🆕 ОБНОВЛЯЕМ ПЕРЕМЕННУЮ ЦИКЛА FOR ПЕРЕД ПРОВЕРКОЙ УСЛОВИЯ
                                currentLoopState.current += currentLoopState.step;
                                pythonVariables[currentLoopState.varName] = currentLoopState.current;
                                shouldRepeat = currentLoopState.current < currentLoopState.end;
                                console.log(`[LOOP END/REPEAT] FOR condition check: ${shouldRepeat} (${currentLoopState.varName} = ${currentLoopState.current} < ${currentLoopState.end})`);
                            }

                            if (shouldRepeat) {
                                i = currentLoopState.startLineIndex;
                                isReturningToLoopBody = true;
                                jumpedBack = true;
                                console.log(`[LOOP REPEAT JUMP] Jumping back to line ${currentLoopState.startLineIndex + 1} (loop line)`);
                                break;
                            } else {
                                shouldCollapse = true;
                            }
                        }
                        
                        if (shouldCollapse) {
                               controlFlowStack.pop();
                               (poppedBlock.type === 'while' ? whileLoopStack : forLoopStack).pop();
                               pops++;
                               console.log(`[LOOP END/BREAK] ${poppedBlock.type.toUpperCase()} block finished/broken at indent ${poppedBlock.indentation}.`);
                        }
                        
                    } else {
                        controlFlowStack.pop();
                        pops++;
                    }
                    
                    if (jumpedBack) break;
                }
                
                if (jumpedBack) continue;
                console.log(`[BLOCK_EXIT] Collapsed stack. Popped ${pops} levels. StackDepth: ${controlFlowStack.length}`);
                
                const updatedParentBlock = controlFlowStack[controlFlowStack.length - 1];
                
                // 🔴 ИЗМЕНЕНО: Обновленная логика сброса ifChainState
                if (updatedParentBlock.type !== 'if' && updatedParentBlock.type !== 'while' && updatedParentBlock.type !== 'for') {
                    // Сбрасываем ifChainState только если выходим на корневой уровень И текущая строка не else/elif
                    if (lineIndentation === 0 && !isElse && !isElif) {
                        console.log(`[IF_CHAIN_RESET] Resetting because lineIndentation is 0 and not else/elif`);
                        resetIfChainState();
                    }
                    ifConditionMetInBlock = false;
                } else {
                    ifConditionMetInBlock = updatedParentBlock.conditionMet;
                }
                
                currentBlockIndentation = 0;
                if (controlFlowStack.length > 1) { 
                    currentBlockIndentation = controlFlowStack[controlFlowStack.length - 1].indentation + 4;
                } else {
                    currentBlockIndentation = 0;
                }
                
                console.log(`[BLOCK_EXIT] New state: isSkippingBlock=${isSkippingBlock}, CurrentBlock=${currentBlockIndentation}`);
                
                if (lineIndentation !== currentBlockIndentation) {
                    console.log(`[SKIP] Line skipped because indentation doesn't match: ${lineIndentation} != ${currentBlockIndentation}`);
                    continue;
                }
            }
        } 

        // --- 3. Обработка условных операторов (IF/ELIF/ELSE) и ЦИКЛОВ (WHILE/FOR) ---
        if (isIf || isElif || isElse || isWhile || isFor) {
            
            if (!trimmedLine.endsWith(':')) {
                 messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Ожидается двоеточие (:) в конце оператора.`;
                return;
            }
            
            if ((isWhile || isFor) && isReturningToLoopBody) {
                isReturningToLoopBody = false;
                let shouldExecuteBlock = false;
                if (isWhile) {
                    shouldExecuteBlock = true;
                    console.log(`[LOOP JUMP BODY] Executing WHILE body (line ${i+1})`);
                } else {
                    // 🔴 ДОБАВЛЕНА ПРОВЕРКА НА СУЩЕСТВОВАНИЕ currentFor
                    if (forLoopStack.length === 0) {
                        console.log(`[LOOP_ERROR] forLoopStack is empty, cannot update currentFor`);
                        shouldExecuteBlock = false;
                    } else {
                        const currentFor = forLoopStack[forLoopStack.length - 1];
                        if (!currentFor) {
                            console.log(`[LOOP_ERROR] currentFor is undefined`);
                            shouldExecuteBlock = false;
                        } else {
                            currentFor.current += currentFor.step;
                            pythonVariables[currentFor.varName] = currentFor.current;
                            shouldExecuteBlock = currentFor.current < currentFor.end;
                            console.log(`[LOOP JUMP BODY] FOR condition check: ${shouldExecuteBlock} (${currentFor.varName} = ${currentFor.current} < ${currentFor.end})`);
                        }
                    }
                }
                
                isSkippingBlock = !shouldExecuteBlock;
                currentBlockIndentation = lineIndentation + 4;
    
                // 🔴 ПЕРЕМЕЩЕНО ПОЛУЧЕНИЕ currentLoop ПОСЛЕ ВСЕХ ПРОВЕРОК
                let currentLoop = null;
                if (isWhile && whileLoopStack.length > 0) {
                    currentLoop = whileLoopStack[whileLoopStack.length - 1];
                } else if (isFor && forLoopStack.length > 0) {
                    currentLoop = forLoopStack[forLoopStack.length - 1];
                }
    
                // 🔴 ДОБАВЛЕНА ПРОВЕРКА НА currentLoop И startLineIndex
                if (!currentLoop || currentLoop.startLineIndex === undefined) {
                    console.log(`[LOOP_JUMP_BODY_ERROR] currentLoop or startLineIndex is invalid, skipping block creation.`);
                    console.log(`[LOOP_JUMP_BODY_ERROR] currentLoop:`, currentLoop);
                    continue;
                }
    
                const newBlockState = {
                    indentation: lineIndentation,
                    conditionMet: false,
                    isSkipping: isSkippingBlock,
                    type: isWhile ? 'while' : 'for',
                    startLineIndex: currentLoop.startLineIndex, 
                    condition: isWhile ? currentLoop.condition : 'for'
                };
                controlFlowStack.push(newBlockState);
                console.log(`[LOOP_JUMP_BODY] Created new block state for ${isWhile ? 'WHILE' : 'FOR'} at line ${currentLoop.startLineIndex + 1}`);
                continue;
            }

            const currentLevel = controlFlowStack[controlFlowStack.length - 1];
            const isRootLevel = controlFlowStack.length === 1;
            const isNewNestedBlock = lineIndentation > currentLevel.indentation || (isRootLevel && lineIndentation === 0);
            const containerSkipping = isNewNestedBlock 
                ? currentLevel.isSkipping 
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
                    updateIfChainState(lineIndentation, shouldExecuteBlock);
                    
                    console.log(`[COND_DEBUG] IF result: ${shouldExecuteBlock}`);
                } catch (e) { return; }
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
                        updateIfChainState(lineIndentation, shouldExecuteBlock);
                        console.log(`[COND_DEBUG] ELIF result: ${shouldExecuteBlock}, New met: ${ifConditionMetInBlock}`);
                    } catch (e) { return; }
                } else {
                    shouldExecuteBlock = false;
                    console.log(`[COND_DEBUG] ELIF skipped because ifConditionMetInBlock=true`);
                }
                blockType = 'if';
            } else if (isElse) { 
                // 🔴 УПРОЩЕННАЯ ЛОГИКА ДЛЯ ELSE
                // Получаем родительский блок
                const parentBlock = controlFlowStack[controlFlowStack.length - 1];
                
                // Если есть родительский блок if на том же уровне
                if (parentBlock && parentBlock.type === 'if' && parentBlock.indentation === lineIndentation) {
                    // ELSE выполняется, если if не выполнился
                    shouldExecuteBlock = !parentBlock.conditionMet && ifChainState.currentLevel === lineIndentation && !ifChainState.hasExecuted;
                    
                    console.log(`[COND_DEBUG_ELSE] lineIndentation=${lineIndentation}, parentBlock.conditionMet=${parentBlock.conditionMet}, ifChainState.currentLevel=${ifChainState.currentLevel}, hasExecuted=${ifChainState.hasExecuted}`);
                    console.log(`[COND_DEBUG_ELSE] shouldExecuteElse=${shouldExecuteBlock}`);
                    
                    if (shouldExecuteBlock) {
                        // Обновляем состояние цепочки для else
                        updateIfChainState(lineIndentation, true);
                    }
                    
                    blockType = 'if';
                } else {
                    // Если нет родительского if на этом уровне, то это ошибка
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'else' без соответствующего 'if'.`;
                    return;
                }
            } else if (isWhile) { 
                conditionText = trimmedLine.replace(/^(while)\s*\(*/, '').replace(/\)*:$/, '').trim();
                blockType = 'while';
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    console.log(`[COND_DEBUG] WHILE result: ${shouldExecuteBlock}`);
                    
                    if (shouldExecuteBlock && isNewNestedBlock) { 
                        const newWhile = {
                            indentation: lineIndentation,
                            condition: conditionText,
                            startLineIndex: i,
                            ifElseState: { hasExecutedIf: false }
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

                } catch (e) { return; }
                ifConditionMetInBlock = false;
            } else if (isFor) { 
                const forLoopData = parseForLoop(trimmedLine);
                if (!forLoopData) {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Некорректный формат цикла for. Ожидается: for переменная in range(...):`;
                    return;
                }

                blockType = 'for';
                
                shouldExecuteBlock = forLoopData.current < forLoopData.end;
                console.log(`[COND_DEBUG] FOR result: ${shouldExecuteBlock} (${forLoopData.varName} = ${forLoopData.current} < ${forLoopData.end})`);
                if (shouldExecuteBlock && !containerSkipping) wasForLoopExecuted = true;

                if (shouldExecuteBlock && isNewNestedBlock) {
                    pythonVariables[forLoopData.varName] = forLoopData.current;
                    
                    const newFor = {
                        indentation: lineIndentation,
                        varName: forLoopData.varName,
                        current: forLoopData.current,
                        end: forLoopData.end,
                        step: forLoopData.step,
                        startLineIndex: i,
                        ifElseState: { hasExecutedIf: false }
                    };
                    forLoopStack.push(newFor);
                    console.log(`[LOOP START] PUSH FOR to loop stack. ${forLoopData.varName} = ${forLoopData.current}, end = ${forLoopData.end}, step = ${forLoopData.step}`);
                }
                else if (shouldExecuteBlock && currentLevel.type === 'for' && currentLevel.indentation === lineIndentation) {
                    if (forLoopStack.length > 0) {
                        const topOfLoopStack = forLoopStack[forLoopStack.length - 1];
                        if (topOfLoopStack) {
                            topOfLoopStack.startLineIndex = i;
                        }
                    }
                }
            }

            if (!isNewNestedBlock && blockType === 'if') {
                isSkippingBlock = !shouldExecuteBlock;
                console.log(`[COND_DEBUG] NOT Nested: Skip=${isSkippingBlock}`);
            } else {
                isSkippingBlock = containerSkipping || !shouldExecuteBlock;
                console.log(`[COND_DEBUG] Nested/While: Skip=${isSkippingBlock}`);
            }

            currentBlockIndentation = lineIndentation + 4;
            console.log(`[COND_DEBUG] Final: isSkippingBlock=${isSkippingBlock}, currentBlockIndentation=${currentBlockIndentation}`);
            const newBlockState = {
                indentation: lineIndentation,
                conditionMet: blockType === 'if' ? ifConditionMetInBlock : false,
                isSkipping: isSkippingBlock,
                type: blockType,
                startLineIndex: i,
                condition: conditionText,
                ifChainExecuted: false
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
        const currentBlock = controlFlowStack[controlFlowStack.length - 1];

        console.log(`[PRE-EXEC] Executing command: ${trimmedLine}`);
        if (trimmedLine.startsWith('print')) {   
            const match = trimmedLine.match(/^print\s*\((.+?)\s*\)$/);
            if (match) {
                if (printedExpression === null) { printedExpression = match[1].trim();
                }
            } else {
                messageElement.textContent = `Ошибка синтаксиса: Некорректный формат print(). Оживается: print(выражение).`;
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
        
        console.log(`[END ITERATION] Completed line ${i+1}. Next line: ${i+2}`);
    } 
    
    if (lines.length > startIndex) {
        window.wasForLoopExecuted = wasForLoopExecuted; 
        console.log(`[EOF SYNC] wasForLoopExecuted synchronized to global: ${window.wasForLoopExecuted}`);
    }
    
    if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
        console.log(`[EOF CHECK] Active loop found. Triggering final block exit logic.`);
        let shouldRestart = false;
        
        while ((whileLoopStack.length > 0 || forLoopStack.length > 0) && controlFlowStack.length > 1) {
            const poppedBlock = controlFlowStack[controlFlowStack.length - 1];
            if (poppedBlock.type === 'while' || poppedBlock.type === 'for') {
                const loopStack = poppedBlock.type === 'while' ? whileLoopStack : forLoopStack;
    
                // 🔴 ДОБАВЛЕНА ПРОВЕРКА: Убедимся, что в стеке есть элементы
                if (loopStack.length === 0) {
                    console.log(`[EOF_WARNING] ${poppedBlock.type} stack is empty, popping control flow block.`);
                    controlFlowStack.pop();
                    continue;
                }
    
                const currentLoopState = loopStack[loopStack.length - 1];
    
                if (!currentLoopState) {
                    console.log(`[EOF_WARNING] currentLoopState is undefined, popping control flow block.`);
                    controlFlowStack.pop();
                    continue;
                }
                
                let shouldRepeat = false;
                
                if (!isBreakingLoop) {
                    try {
                        if (poppedBlock.type === 'while') {
                            console.log(`[LOOP CHECK EOF] Evaluating WHILE condition: ${currentLoopState.condition}`);
                            shouldRepeat = evaluateCondition(currentLoopState.condition);
                            console.log(`[LOOP CHECK EOF] WHILE condition result: ${shouldRepeat}`);
                        } else {
                            pythonVariables[currentLoopState.varName] = currentLoopState.current;
                            shouldRepeat = currentLoopState.current < currentLoopState.end;
                            console.log(`[LOOP CHECK EOF] FOR condition: ${shouldRepeat} (${currentLoopState.varName} = ${currentLoopState.current} < ${currentLoopState.end})`);
                        }
                    } catch(e) { 
                        messageElement.textContent = `Ошибка в условии цикла: ${e.message}`; 
                        return;
                    }
                } else {
                    isBreakingLoop = false;
                }

                if (shouldRepeat) {
                    window.executionIndex = currentLoopState.startLineIndex;
                    window.controlFlowStackSnapshot = controlFlowStack.slice();
                    window.whileLoopStackSnapshot = whileLoopStack.slice();
                    window.forLoopStackSnapshot = forLoopStack.slice();
                    window.isReturningToLoopBodySnapshot = true;
                    window.wasForLoopExecutedSnapshot = wasForLoopExecuted;
                    shouldRestart = true;
                    console.log(`[LOOP REPEAT EOF] Jumping back to line ${currentLoopState.startLineIndex + 1} (loop line) and restarting execution.`);
                    break;
                } else {
                    controlFlowStack.pop();
                    (poppedBlock.type === 'while' ? whileLoopStack : forLoopStack).pop();
                    console.log(`[LOOP END EOF] ${poppedBlock.type.toUpperCase()} loop finished.`);
                }
            } else {
                controlFlowStack.pop();
            }
        }
        
        if (shouldRestart) {
             return window.executeCode();
        }
    }
    
    window.wasForLoopExecuted = wasForLoopExecuted;
    console.log(`[FINAL SYNC] wasForLoopExecuted synchronized to global: ${window.wasForLoopExecuted}`);
    handleTargetInteraction(); 
    console.log("--- FINISHED EXECUTION ---");
    messageElement.textContent = "Код успешно выполнен. Проверьте консоль и положение.";
    drawGame();
}
// --- СПРАВОЧНИК ДЛЯ ЗАНЯТИЯ 5 ---

const REFERENCE_DATA = {
    5: {  // Занятие 5
        title: "Справочник: Занятие 5",
        content: `
            <h3>🔁 Цикл for</h3>
            <p><code>for переменная in последовательность:</code> — цикл по элементам последовательности.</p>
            <p><code>for i in range(5):</code> — цикл по числам от 0 до 4.</p>
            
            <h3>📜 Функция range()</h3>
            <p><code>range(стоп)</code> — числа от 0 до стоп-1.</p>
            <p><code>range(старт, стоп)</code> — числа от старт до стоп-1.</p>
            <p><code>range(старт, стоп, шаг)</code> — числа от старт до стоп-1 с шагом.</p>
            
            <h3>🚶 Движение</h3>
            <p><code>move = int(input())</code> - движение на N шагов</p>
            <p><code>turn = input()</code> - поворот (вправо, влево, вверх, вниз)</p>
            
            <h3>📤 Взаимодействие</h3>
            <p><code>print("Слово")</code> - взаимодействие с объектами</p>
            <p><b>Зодчий:</b> <code>print("План постройки")</code> - получить данные</p>
            <p><b>Хранитель:</b> <code>print("Спросить")</code> - получить приветственное слово</p>
            <p><b>Фараон:</b> <code>print("ПриветственноеСлово")</code> - затем передать код</p>
            
            <h3>⚖️ Условный оператор if</h3>
            <p><code>if условие:</code> — выполнить блок кода, если условие истинно.</p>
            <p><code>elif условие:</code> — если предыдущие условия ложны, а это истинно.</p>
            <p><code>else:</code> — если все условия ложны.</p>
            
            <h3>🧮 Операции со строками</h3>
            <p><code>"строка" * число</code> — повтор строки заданное число раз.</p>
            <p><code>len(строка)</code> — длина строки.</p>
            
            <h3>🎯 Проверка победы</h3>
            <p>1. Получи данные у <b>Зодчего</b></p>
            <p>2. Узнай Приветственное Слово у <b>Хранителя</b></p>
            <p>3. Используй <b>цикл for</b> для расчетов</p>
            <p>4. Передай приветствие и код <b>Фараону</b></p>
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

// 🛑 ВАЖНО: Обработчик события, который привязывает функцию hideIntroAndStart к кнопке
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.onclick = window.hideIntroAndStart; 
    }
    
    // 🆕 ДОБАВЛЕНО: Инициализируем справочник при загрузке
    updateReferenceContent();
});
