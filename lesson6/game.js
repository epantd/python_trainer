const LESSON_NUMBER = 6;

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
                    experience: studentData.experience || 0,  // ← ОТПРАВЛЯЕМ ОПЫТ
                    lastLogin: new Date().toISOString()
                };

                fetch('https://script.google.com/macros/s/AKfycbwF5BhsgiI-XjQpn8lJVGA7Ntk0Bwx-L0gmRETiwbAslh2HhqFsPdMS1NUz4ptEIy4h/exec', {
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
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');
const codeInput = document.getElementById('codeInput'); // <textarea>
const winModal = document.getElementById('win-modal');
const introScreen = document.getElementById('intro-screen');
const gameContainer = document.getElementById('game-container');

// Ссылки на элементы DOM
const lessonTitle = document.getElementById('lesson-title');
const lessonSubtitle = document.getElementById('lesson-subtitle');
const lessonText = document.getElementById('lesson-text');

const gameMainTitle = document.getElementById('game-main-title');
const outputDisplay = document.getElementById('output-display');

// Элементы сайдбаров
const instructionSidebar = document.getElementById('instruction-sidebar');
const instructionContent = document.getElementById('instruction-content');
const taskSidebar = document.getElementById('task-sidebar');
const currentTaskDisplay = document.getElementById('current-task-display');
const taskContent = document.getElementById('task-content');

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
stoneSprite.src = '../images5/stone-sprite.png';

const sourceSprite = new Image();
sourceSprite.src = '../images5/source-sprite.png';

const terminalSprite = new Image();
terminalSprite.src = '../images5/terminal-sprite.png';

// Константы анимации
const STONE_TOTAL_FRAMES = 8;
const SOURCE_TOTAL_FRAMES = 7;
const TERMINAL_TOTAL_FRAMES = 10;
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
        
        const baseDelay = this.getRandomBaseDelay();
        this.idleTimer = baseDelay + (entityIndex * LAUNCH_INTERVAL);
        
        this.nextPauseDuration = this.getRoundedPauseDuration();
    }
    
    getRandomBaseDelay() {
        const maxSteps = Math.floor(MAX_INITIAL_DELAY / LAUNCH_INTERVAL);
        const randomStep = Math.floor(Math.random() * (maxSteps + 1));
        return randomStep * LAUNCH_INTERVAL;
    }
    
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

function getEntityAnimation(entityId) {
    if (!entityAnimations.has(entityId)) {
        let entityType = 'terminal';
        if (entityId.includes('pharaoh')) {
            entityType = 'stone';
        } else if (entityId.includes('keeper')) {
            entityType = 'source';
        }
        
        const match = entityId.match(/_(\d+)$/);
        const entityIndex = match ? parseInt(match[1]) : 0;
        
        entityAnimations.set(entityId, new EntityAnimation(entityType, entityIndex));
    }
    return entityAnimations.get(entityId);
}

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

function resetAnimations() {
    entityAnimations.clear();
    
    if (currentLevelData && currentLevelData.entities) {
        currentLevelData.entities.forEach((entity, index) => {
            if (entity.name_en === 'pharaoh' || entity.name_en === 'keeper' || entity.name_en === 'terminal') {
                const entityId = `${entity.name_en}_${index}`;
                
                let entityType;
                if (entity.name_en === 'pharaoh') {
                    entityType = 'stone';
                } else if (entity.name_en === 'keeper') {
                    entityType = 'source';
                } else if (entity.name_en === 'terminal') {
                    entityType = 'terminal';
                }
                
                entityAnimations.set(entityId, new EntityAnimation(entityType, index));
            }
        });
    }
}

function startAnimationLoop() {
    function animate(currentTime) {
        updateAnimations(currentTime);
        drawGame();
        requestAnimationFrame(animate);
    }
    
    lastUpdateTime = 0;
    requestAnimationFrame(animate);
}

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
let currentPart = 6;
let currentLevel = 0; 
const PLAYER_SIZE = 70;
const STEP_SIZE = 70; 
const TEACHER_PASSWORD = 'python'; 

// --- ТЕОРЕТИЧЕСКИЕ ВОПРОСЫ ДЛЯ ПРОВЕРКИ ОШИБОК ---
// --- ТЕОРЕТИЧЕСКИЕ ВОПРОСЫ ДЛЯ ПРОВЕРКИ ОШИБОК ---
const THEORETICAL_QUESTIONS = [
    {
        question: "Найди ошибку в программе:",
        code: [
            "x = 10",
            "if x > 5",
            "    print('x больше 5')",
            "else:",
            "    print('x меньше или равно 5')"
        ],
        correctLines: [2],
        explanation: "Ошибка в строке 2: после условия if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(5)",
            "    print(i)",
            "",
            "while True",
            "    print('бесконечный цикл')"
        ],
        correctLines: [1, 4],
        explanation: "Ошибки в строках 1 и 4: после for и while должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "i = 1",
            "sum = 0",
            "while i <= 10",
            "    sum = sum + i",
            "    i = i + 1",
            "print('Сумма: ' + sum)"
        ],
        correctLines: [3, 6],
        explanation: "Ошибки в строке 3 (нет двоеточия после while) и строке 6 (нельзя сложить строку и число, нужно str(sum))."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "age = 15",
            "if age >= 18:",
            "    print('Взрослый')",
            "elif age >= 13:",
            "    print('Подросток')",
            "else",
            "    print('Ребенок')"
        ],
        correctLines: [6],
        explanation: "Ошибка в строке 6: после else должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "x = 5",
            "y = 10",
            "if x = y:",
            "    print('равны')",
            "else:",
            "    print('не равны')"
        ],
        correctLines: [3],
        explanation: "Ошибка в строке 3: в условии нужно использовать == (сравнение), а не = (присваивание)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "i = 0",
            "while i < 5",
            "    print(i)",
            "    i += 1",
            "print('Цикл завершен')"
        ],
        correctLines: [2],
        explanation: "Ошибка в строке 2: после while должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(5):",
            "    if i % 2 == 0",
            "        print(str(i) + ' четное')",
            "    else:",
            "        print(str(i) + ' нечетное')"
        ],
        correctLines: [2],
        explanation: "Ошибка в строке 2: после условия if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for letter in 'ABC'",
            "    if letter == 'A'",
            "        print('Первая буква')",
            "    else:",
            "        print('Другая буква')"
        ],
        correctLines: [1, 2],
        explanation: "Ошибки в строках 1 и 2: после for и if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "n = 5",
            "factorial = 1",
            "while n > 0",
            "    factorial = factorial * n",
            "    n = n - 1",
            "print('Факториал: ' + factorial)"
        ],
        correctLines: [3, 6],
        explanation: "Ошибки в строке 3 (нет двоеточия после while) и строке 6 (нельзя сложить строку и число, нужно str(factorial))."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "score = 85",
            "if score >= 90:",
            "    print('Отлично')",
            "elif score >= 80",
            "    print('Хорошо')",
            "else:",
            "    print('Удовлетворительно')"
        ],
        correctLines: [4],
        explanation: "Ошибка в строке 4: после elif должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "x = 10",
            "y = 20",
            "if x < y",
            "    print('x меньше y')",
            "    if x * 2 == y",
            "        print('x вдвое меньше y')"
        ],
        correctLines: [3, 5],
        explanation: "Ошибки в строках 3 и 5: после if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "a = 5",
            "b = '5'",
            "if a == b",
            "    print('равны')",
            "else:",
            "    print('не равны')"
        ],
        correctLines: [3],
        explanation: "Ошибка в строке 3: после условия if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "count = 1",
            "while count <= 3",
            "    print('Попытка ' + count)",
            "    count = count + 1"
        ],
        correctLines: [2, 3],
        explanation: "Ошибки в строке 2 (нет двоеточия после while) и строке 3 (нельзя сложить строку и число, нужно str(count))."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "x = 7",
            "if x > 0: print('положительное')",
            "else: print('отрицательное или ноль')"
        ],
        correctLines: [2],
        explanation: "Ошибка в строке 2: хотя синтаксически это допустимо, в курсе принято переносить блоки на новую строку с отступом."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(5): print(i)",
            "print('готово')"
        ],
        correctLines: [1],
        explanation: "Ошибка в строке 1: хотя синтаксически это допустимо, в курсе принято переносить блоки на новую строку с отступом."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "while True: print('бесконечный цикл')",
            "print('эта строка никогда не выполнится')"
        ],
        correctLines: [1],
        explanation: "Ошибка в строке 1: хотя синтаксически это допустимо, в курсе принято переносить блоки на новую строку с отступом."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "if x > 10",
            ":",
            "    print('больше 10')",
            "else:",
            "    print('10 или меньше')"
        ],
        correctLines: [1, 2],
        explanation: "Ошибки в строках 1 и 2: двоеточие должно быть в той же строке, что и if, а не на отдельной строке."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(3)",
            ":",
            "    print(i)",
            "    print(i * 2)"
        ],
        correctLines: [1, 2],
        explanation: "Ошибки в строках 1 и 2: двоеточие должно быть в той же строке, что и for, а не на отдельной строке."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "a = 10",
            "b = 20",
            "if a < b",
            "    print('a меньше b')",
            "elif a == b",
            "    print('a равно b')",
            "else:",
            "    print('a больше b')"
        ],
        correctLines: [3, 5],
        explanation: "Ошибки в строках 3 и 5: после if и elif должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "number = 15",
            "if number > 10",
            "    print('Больше 10')",
            "    if number > 20",
            "        print('Больше 20')",
            "print('Проверка завершена')"
        ],
        correctLines: [2, 4],
        explanation: "Ошибки в строках 2 и 4: после if должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(1, 4)",
            "    print('Цикл ' + str(i))",
            "    for j in range(1, 4)",
            "        print('Вложенный ' + str(j))",
            "print('Конец')"
        ],
        correctLines: [1, 3],
        explanation: "Ошибки в строках 1 и 3: после for должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "x = 25",
            "if x > 20:",
            "    print('Больше 20')",
            "elif x > 10",
            "    print('Больше 10')",
            "elif x > 5:",
            "    print('Больше 5')",
            "else",
            "    print('Меньше или равно 5')"
        ],
        correctLines: [4, 8],
        explanation: "Ошибки в строке 4 (нет двоеточия после elif) и строке 8 (нет двоеточия после else)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "while 5 > 2",
            "    print('5 больше 2')",
            "    break"
        ],
        correctLines: [1],
        explanation: "Ошибка в строке 1: после while должно быть двоеточие (:)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "x == 10",
            "if x > 0:",
            "    print('x положительное')"
        ],
        correctLines: [1],
        explanation: "Ошибка в строке 1: для присваивания нужно использовать =, а не == (сравнение)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "total == 0",
            "for i in range(1, 6):",
            "    total = total + i",
            "print('Сумма: ' + total)"
        ],
        correctLines: [1, 4],
        explanation: "Ошибки в строке 1 (== вместо =) и строке 4 (нельзя сложить строку и число, нужно str(total))."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for i in range(3)",
            "    print('Номер: i')",
            "    if i == 1:",
            "        print('это единица')"
        ],
        correctLines: [1, 2],
        explanation: "Ошибки в строке 1 (нет двоеточия после for) и строке 2 (чтобы вывести значение переменной i, нужно вывести её без кавычек или использовать конкатенацию: print('Номер: ' + str(i)))"
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "text = 'Hello'",
            "count = 0",
            "while count < 5",
            "    print(text)",
            "    count = count + 1",
            "print('Длина строки: ' + len(text))"
        ],
        correctLines: [3, 6],
        explanation: "Ошибки в строке 3 (нет двоеточия после while) и строке 6 (нельзя сложить строку и число, нужно str(len(text)))."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "name = 'Анна'",
            "if name == 'Анна'",
            "    print(Привет, name)",
            "else:",
            "    print('Неизвестное имя')"
        ],
        correctLines: [2, 3],
        explanation: "Ошибки в строке 2 (нет двоеточия после if) и строке 3 (текст должен быть в кавычках. Нужно: print('Привет, ' + name))"
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "for num in range(3)",
            "    if num % 2 == 0",
            "        print('Четное')",
            "    print('Следующее число')"
        ],
        correctLines: [1, 2],
        explanation: "Ошибки в строке 1 (нет двоеточия после for) и строке 2 (нет двоеточия после if)."
    },
    {
        question: "Найди ошибку в программе:",
        code: [
            "i = 10",
            "while i > 0:",
            "    if i == 5",
            "        print('Половина пройдена')",
            "    i = i - 1",
            "    print('Текущее значение: ' + i)"
        ],
        correctLines: [3, 6],
        explanation: "Ошибки в строке 3 (нет двоеточия после if) и строке 6 (нельзя сложить строку и число, нужно str(i))."
    }
];


function getRandomQuestion() {
    // Выбираем случайный вопрос, отличный от предыдущего
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * THEORETICAL_QUESTIONS.length);
    } while (newIndex === currentQuestionIndex && THEORETICAL_QUESTIONS.length > 1);
    
    currentQuestionIndex = newIndex;
    selectedLines = []; // Сбрасываем выбранные строки
    return THEORETICAL_QUESTIONS[newIndex];
}

function showQuestionModal() {
    const question = getRandomQuestion();
    questionAttempts = 0;
    isQuestionModalOpen = true;
    selectedLines = [];
    
    // Заполняем модальное окно
    document.getElementById('question-text').textContent = question.question;
    
    // Создаем контейнер для кода
    const codeContainer = document.getElementById('code-container');
    codeContainer.innerHTML = '';
    
    // Добавляем строки кода с возможностью выбора
    question.code.forEach((line, index) => {
        if (line.trim() === '') {
            // Пустая строка
            const emptyLine = document.createElement('div');
            emptyLine.className = 'code-line empty';
            emptyLine.innerHTML = '&nbsp;';
            codeContainer.appendChild(emptyLine);
        } else {
            const lineElement = document.createElement('div');
            lineElement.className = 'code-line';
            lineElement.dataset.lineNumber = index + 1;
            
            // Добавляем номер строки
            const lineNumber = document.createElement('span');
            lineNumber.className = 'line-number';
            lineNumber.textContent = `${index + 1}.`;
            
            // Добавляем код
            const codeContent = document.createElement('span');
            codeContent.className = 'code-content';
            codeContent.textContent = ` ${line}`;
            
            lineElement.appendChild(lineNumber);
            lineElement.appendChild(codeContent);
            
            // Добавляем обработчик клика
            lineElement.addEventListener('click', () => {
                if (lineElement.classList.contains('selected')) {
                    lineElement.classList.remove('selected');
                    selectedLines = selectedLines.filter(num => num !== index + 1);
                } else {
                    lineElement.classList.add('selected');
                    selectedLines.push(index + 1);
                    selectedLines.sort((a, b) => a - b);
                }
                updateCheckButton();
            });
            
            codeContainer.appendChild(lineElement);
        }
    });
    
    // Сбрасываем состояние кнопок и фидбэка
    document.getElementById('question-feedback').style.display = 'none';
    document.getElementById('question-feedback').className = '';
    document.getElementById('return-to-level-btn').style.display = 'none';
    document.getElementById('check-answer-btn').style.display = 'inline-block';
    document.getElementById('check-answer-btn').disabled = true;
    document.getElementById('check-answer-btn').textContent = 'Проверить';
    
    // Скрываем крестик закрытия
    document.getElementById('question-close').style.display = 'none';
    
    // Показываем модальное окно
    document.getElementById('question-modal').style.display = 'flex';
}

// Функция обновления состояния кнопки "Проверить"
function updateCheckButton() {
    const checkBtn = document.getElementById('check-answer-btn');
    checkBtn.disabled = selectedLines.length === 0;
}

// Функция проверки ответа
function checkAnswer() {
    if (selectedLines.length === 0) return;
    
    questionAttempts++;
    const question = THEORETICAL_QUESTIONS[currentQuestionIndex];
    const feedbackElement = document.getElementById('question-feedback');
    const checkBtn = document.getElementById('check-answer-btn');
    const returnBtn = document.getElementById('return-to-level-btn');
    const closeBtn = document.getElementById('question-close');
    
    // Сортируем правильные ответы для сравнения
    const correctLinesSorted = [...question.correctLines].sort((a, b) => a - b);
    const selectedLinesSorted = [...selectedLines].sort((a, b) => a - b);
    
    // Проверяем правильность
    const isCorrect = selectedLinesSorted.length === correctLinesSorted.length &&
                     selectedLinesSorted.every((value, index) => value === correctLinesSorted[index]);
    
    if (isCorrect) {
        // Правильный ответ
        if (questionAttempts === 1) {
            // Первая попытка - +1 опыт
            totalExperience += 1;
            questionExperienceAwarded = true;
            feedbackElement.textContent = `✅ Правильно! +1 опыт за быстрый ответ!\n${question.explanation}`;
            feedbackElement.className = 'success';
            console.log(`[Опыт] +1 за правильный ответ с первой попытки`);
        } else {
            feedbackElement.textContent = `✅ Правильно! Ответ найден с ${questionAttempts} попытки.\n${question.explanation}`;
            feedbackElement.className = 'success';
        }
        
        // Подсвечиваем правильные строки
        document.querySelectorAll('.code-line').forEach(line => {
            const lineNum = parseInt(line.dataset.lineNumber);
            if (question.correctLines.includes(lineNum)) {
                line.classList.add('correct-line');
            }
        });
        
        feedbackElement.style.display = 'block';
        checkBtn.style.display = 'none';
        returnBtn.style.display = 'block';
        closeBtn.style.display = 'none'; // Крестик по-прежнему скрыт
        
    } else {
        // Неправильный ответ
        if (questionAttempts < 3) {
            feedbackElement.textContent = `❌ Попробуй еще раз, ты пока не прошел поверку (попытка ${questionAttempts}/3)`;
            feedbackElement.className = 'error';
            feedbackElement.style.display = 'block';
            returnBtn.style.display = 'none';
            
            // Сбрасываем выбранные строки для новой попытки
            selectedLines = [];
            document.querySelectorAll('.code-line').forEach(line => {
                line.classList.remove('selected');
            });
            updateCheckButton();
            
            // Через 1.5 секунды показываем новый вопрос
            setTimeout(() => {
                const newQuestion = getRandomQuestion();
                document.getElementById('question-text').textContent = newQuestion.question;
                
                // Обновляем код
                const codeContainer = document.getElementById('code-container');
                codeContainer.innerHTML = '';
                
                newQuestion.code.forEach((line, index) => {
                    if (line.trim() === '') {
                        const emptyLine = document.createElement('div');
                        emptyLine.className = 'code-line empty';
                        emptyLine.innerHTML = '&nbsp;';
                        codeContainer.appendChild(emptyLine);
                    } else {
                        const lineElement = document.createElement('div');
                        lineElement.className = 'code-line';
                        lineElement.dataset.lineNumber = index + 1;
                        
                        const lineNumber = document.createElement('span');
                        lineNumber.className = 'line-number';
                        lineNumber.textContent = `${index + 1}.`;
                        
                        const codeContent = document.createElement('span');
                        codeContent.className = 'code-content';
                        codeContent.textContent = ` ${line}`;
                        
                        lineElement.appendChild(lineNumber);
                        lineElement.appendChild(codeContent);
                        
                        lineElement.addEventListener('click', () => {
                            if (lineElement.classList.contains('selected')) {
                                lineElement.classList.remove('selected');
                                selectedLines = selectedLines.filter(num => num !== index + 1);
                            } else {
                                lineElement.classList.add('selected');
                                selectedLines.push(index + 1);
                                selectedLines.sort((a, b) => a - b);
                            }
                            updateCheckButton();
                        });
                        
                        codeContainer.appendChild(lineElement);
                    }
                });
                
                feedbackElement.style.display = 'none';
            }, 1500);
            
        } else {
            // Третья неправильная попытка
            totalExperience -= 1; // Вычитаем 1 (может быть отрицательным)
            feedbackElement.textContent = `❌ В следующий раз будь внимательнее, у тебя точно получится. -1 опыт.\n\nПравильный ответ: строки ${question.correctLines.join(', ')}\n${question.explanation}`;
            feedbackElement.className = 'error';
            feedbackElement.style.display = 'block';
            
            // Подсвечиваем правильные строки
            document.querySelectorAll('.code-line').forEach(line => {
                const lineNum = parseInt(line.dataset.lineNumber);
                if (question.correctLines.includes(lineNum)) {
                    line.classList.add('correct-line');
                }
            });
            
            checkBtn.style.display = 'none';
            returnBtn.style.display = 'block';
            closeBtn.style.display = 'none'; // Крестик скрыт
        }
    }
    
    updateExperienceDisplay();
}


// Функция закрытия модального окна с вопросом
function closeQuestionModal() {
    document.getElementById('question-modal').style.display = 'none';
    isQuestionModalOpen = false;
    currentQuestionIndex = -1;
    
    // Выдаем пароль только после нажатия кнопки
    givePassword();
}

// Функция выдачи пароля
function givePassword() {
    passwordCheckPassed = true;
    const greeting = currentLevelData.requiredGreeting;
    
    consoleOutput += `\n> Марио (Шеф): Приветственное слово для Жюри: ${greeting}\n`;
    if (questionExperienceAwarded) {
        consoleOutput += `> Марио (Шеф): Отличные знания! +1 опыт!\n`;
        questionExperienceAwarded = false;
    }
    
    updateOutputDisplay();
    messageElement.textContent = `Марио дал тебе Приветственное Слово: ${greeting}. Иди к Жюри.`;
}

// Переменные для отслеживания состояния вопросов
let currentQuestionIndex = -1;
let questionAttempts = 0;
let isQuestionModalOpen = false;
let passwordCheckPassed = false;
let questionExperienceAwarded = false;
let selectedLines = [];

// Переменные для эмуляции Python
let pythonVariables = {'n':1};
let consoleOutput = ""; 
let isSkippingBlock = false;
let currentBlockIndentation = 0;
let ifConditionMetInBlock = false;
window.consoleOutputBuffer = "";

// Переменные состояния Игрока
let playerX = 0;
let playerY = 0;
let direction = 'вправо';

// Новые переменные для Занятия 6
let currentLevelData = null; 
let lastPrintedResult = null; 
let printedExpression = null; 
let targetUnlocked = false; 

// Глобальное состояние для двухфазной победы
let levelPhase = 'initial';

// НОВОЕ: Флаги для проверки if/переменных
let currentExecutionFlags = {
    isConditional: false,
    usedLevelVariable: false,
    usedIf: false,           // ДЛЯ УРОВНЯ 6.3 - отслеживает использование оператора if
    usedLower: false,         // ДЛЯ УРОВНЯ 6.3 - отслеживает использование метода .lower()
    usedReplace: false,
    usedLen: false,           // ДЛЯ УРОВНЯ 6.5 и 6.6 - отслеживает использование len()
    usedFor: false,           // ДЛЯ УРОВНЯ 6.6 - отслеживает использование цикла for
    usedUpper: false,         // ДЛЯ УРОВНЯ 6.7 - отслеживает использование .upper()
    usedIsAlpha: false,       // ДЛЯ УРОВНЯ 6.8 - отслеживает использование .isalpha()
    usedIsDigit: false, 
    usedCount: false,
    usedJoin: false       
};

// Переменные для отслеживания использования циклов
let wasForLoopExecuted = false;

// ===============================
// СИСТЕМА ОПЫТА
// ===============================

let totalExperience = 0;
let levelStartTime = null;
let levelAttempts = 0;

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

function startLevelTracking() {
    levelStartTime = Date.now();
    levelAttempts = 0;
    console.log(`[Опыт] Начало отслеживания уровня в ${new Date(levelStartTime).toLocaleTimeString()}`);
    console.log(`[Опыт] Счетчик попыток сброшен: ${levelAttempts}`);
}

function calculateExperience() {
    let earnedExp = 0;
    let reasons = [];
    
    console.log("=== РАСЧЕТ ОПЫТА ===");
    console.log(`Попыток взаимодействия с Жюри: ${levelAttempts}`);
    
    earnedExp += 1;
    reasons.push("+1 за завершение уровня");
    
    if (levelAttempts <= 4) {
        earnedExp += 1;
        reasons.push(`+1 за малое количество попыток (${levelAttempts})`);
    }
    
    if (levelStartTime) {
        const timeSpent = Date.now() - levelStartTime;
        const threeMinutes = 3 * 60 * 1000;
        const secondsSpent = Math.floor(timeSpent / 1000);
        
        if (timeSpent < threeMinutes) {
            earnedExp += 1;
            reasons.push(`+1 за быстрое прохождение (${secondsSpent} сек)`);
        }
    }
    
    totalExperience += earnedExp;
    // СОХРАНЯЕМ ОПЫТ СРАЗУ ПОСЛЕ РАСЧЕТА
    setTimeout(async () => {
        await saveProgressToGoogleSheets('update');
        console.log('Опыт сохранен на сервер:', totalExperience);
    }, 100);

    
    updateExperienceDisplay();
    
    setTimeout(() => {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.innerHTML += `<br><small>Получено опыта: ${earnedExp} (${reasons.join(', ')})</small>`;
        }
    }, 500);
    
    return earnedExp;
}

// СПИСОК ПРИВЕТСТВИЙ ОТ МАРИО (Шефа)
const ESSENCE_GREETINGS = [
    'КулинарныйШедевр',
    'ИзысканныйВкус',
    'АроматПрованса',
    'ФьюжнКухня',
    'МишленовскаяЗвезда',
    'СекретныйСоус',
    'ИтальянскаяПаста',
    'ФранцузскаяВыпечка',
    'АзиатскийСтиль',
    'МорскиеДары'
];

let ifChainState = {
    currentLevel: null,
    hasExecuted: false,
    chainBlocks: []
};

function resetIfChainState() {
    ifChainState = {
        currentLevel: null,
        hasExecuted: false,
        chainBlocks: []
    };
}

function updateIfChainState(indentation, conditionMet) {
    if (ifChainState.currentLevel === null) {
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    } else if (ifChainState.currentLevel === indentation) {
        if (conditionMet) {
            ifChainState.hasExecuted = true;
        }
        ifChainState.chainBlocks.push(conditionMet ? 'if/elif' : 'else');
    } else if (indentation > ifChainState.currentLevel) {
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    } else {
        resetIfChainState();
        ifChainState.currentLevel = indentation;
        ifChainState.hasExecuted = conditionMet;
        ifChainState.chainBlocks = [conditionMet ? 'if' : 'if'];
    }
}

// --- Вспомогательная функция для создания структуры сущности ---
function createEntity(name_ru, name_en, type, x, y, value = null, index = null) { 
    return { name_ru, name_en, type, x: 0, y: 0, value, index }; 
}

// --- Вспомогательная функция для генерации подсказок по операторам ---
function getOpHint(ops) {
    let operatorsHtml = ops.map(op => `<code>${op.replace(/<.?code>/g, '')}</code>`).join(' ');

    let base = `
        <p><strong>Доступные операторы:</strong> ${operatorsHtml}</p>
        <p>Для взаимодействия с сущностями используйте <code>print("Слово")</code></p>
        <pre style="background: #2c3e50; color: white; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 5px;">
print("Слово")
</pre>
        <p><b>Взаимодействие (Три сущности):</b></p>
        <p>1. <b>Луи (Стажер):</b> Подойдите и скажите <code>print("Данные кухни")</code>, чтобы получить данные.</p>
        <p>2. <b>Марио (Шеф):</b> Подойдите и скажите <code>print("Спросить")</code>, чтобы получить Приветственное Слово.</p>
    `;
    return base;
}

// --- Вспомогательная функция для генерации подсказок по операторам ---
function getTaskHint(levelData) {
    let hint = `<p><b>Жюри:</b> Подойдите, далее поприветствуйте их (<code>print("ПриветственноеСлово")</code>) и последним <code>print()</code> введите правильный код (результат вычислений).</p>`;
    if (levelData.id === '6.1') {
        hint += `<p><b>Подсказка для уровня 6.1:</b> Получи от Луи три части названия, присвой их переменным part1, part2, part3 и соедини с помощью конкатенации (+).</p>`;
    } else if (levelData.id === '6.2') {
        hint += `<p><b>Подсказка для уровня 6.2:</b> Посчитай количество восклицательных знаков в тираде шефа с помощью метода подсчета символов.</p>`;
    } else if (levelData.id === '6.3') {
        hint += `<p><b>Подсказка для уровня 6.3:</b> Если этикетка не пустая, приведи её к нижнему регистру методом который делает большие буквы маленькими, иначе выведи "ЭТИКЕТКА СТЕРТА".</p>`;
    } else if (levelData.id === '6.4') {
        hint += `<p><b>Подсказка для уровня 6.4:</b> Если год на маркировке равен "2126", замени на "2026" с помощью метода замены, иначе выведи "ДОП. ПРОВЕРКА".</p>`;
    } else if (levelData.id === '6.5') {
        hint += `<p><b>Подсказка для уровня 6.5:</b> Используй функцию подсчета длины чтобы получить длину строки, а затем условия для получения нужного вывода.</p>`;
    } else if (levelData.id === '6.6') {
        hint +=`<p><b>Подсказка для уровня 6.6:</b> Используй цикл фор, который будет работать такое количество раз, сколько символов в слове, для перебора символов и проверяй каждый символ по его индексу, чтобы найти ошибки ⬛.</p>`;
    } else if (levelData.id === '6.7') {
        hint += `<p><b>Подсказка для уровня 6.7:</b> Приведи список ингредиентов к верхнему регистру с помощью .upper(), затем проверь условия с помощью оператора if и ключевых слов in/not in.</p>`;
    } else if (levelData.id === '6.8') {
        hint += `<p><b>Подсказка для уровня 6.8:</b> Используй цикл for для перебора каждого символа маркировки. Проверяй каждый символ с помощью .isalpha() и .isdigit(), и выводи соответствующий результат.</p>`;
    } else if (levelData.id === '6.9') {
        hint += `<p><b>Подсказка для уровня 6.9:</b> У тебя есть список ингредиентов, лежащих в переменной у Луи, а так же разделитель "->". Используй метод .join() для преобразования этого списка в строку. Это нужно, чтобы дальше работать с рецептом как с обычной строкой и применять к ней строковые методы.</p>`;
    } 
    
    return hint;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------------------------------------------------------------------------------------------------
// Урок 6: КУЛИНАРНОЕ ШОУ «БИТВА ШЕФОВ» (PART_6_LEVELS)
// -------------------------------------------------------------------------------------------------

const PART_6_LEVELS = [
    // 🍽️ Уровень 6.1: "Собери имя блюда"
    {
        id: '6.1',
        name: 'Собери имя блюда',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Луи рассыпал карточки с названием фирменного блюда. Собери три части воедино, соединив их с помощью конкатенации.",
        operators: ['<code>print()</code>', '<code>+</code>'],
        levelVariable: 'ingredients',
        levelVariableRange: [3, 3],
        requiredGreeting: null,
        entities: [
            createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🍽️ Уровень 6.2: "Счет идеальных моментов"
    {
        id: '6.2',
        name: 'Счет идеальных моментов',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Шеф в восторге кричит «Идеально!». Посчитай, сколько раз (!) это прозвучало в его тираде с помощью метода .count().",
        operators: ['<code>print()</code>', '<code>.count()</code>'],
        levelVariable: 'exclamations',
        levelVariableRange: [5, 15],
        requiredGreeting: null,
        entities: [
            createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🍽️ Уровень 6.3: "Стандартизация этикетки"
    {
        id: '6.3',
        name: 'Стандартизация этикетки',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "На банке с дорогой специей название написано капслоком. Приведи его к нормальному виду методом .lower(), если этикетка не стерлась.",
        operators: ['<code>print()</code>', '<code>if</code>', '<code>.lower()</code>'],
        levelVariable: 'labels',
        levelVariableRange: [1, 1],
        requiredGreeting: null,
        entities: [
            createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🍽️ Уровень 6.4: "Секрет из конверта"
    {
    	id: '6.4',
    	name: 'Исправление года на этикетке',
    	currentState: 'activated',
    	possibleStates: ['activated'],
    	correctCodeword: null,
    	magicWords: { 'activated': 'Value' },
    	description: "На кухне кто-то не очень хорошо пошутил, и теперь год на этикетке выглядит так: 2126. Нужно заменить, используй .replace() чтобы заменить год маркировки на 2026. Если там встречается какой-то странный год, не 2126, напиши 'ДОП. ПРОВЕРКА', чтобы шеф потом сам этим занялся.",
    	operators: ['<code>print()</code>', '<code>if</code>', '<code>.replace()</code>'],
    	levelVariable: 'marking',
    	levelVariableRange: [1, 1],
    	requiredGreeting: null,
    	entities: [
        	createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
        	createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
        	createEntity('Жюри', 'pharaoh', 'target', 0, 0),
    	]
    },

    // 🍽️ Уровень 6.5: "Проверка длины названия блюда"
    {
    	id: '6.5',
    	name: 'Проверка длины названия блюда',
    	currentState: 'activated',
    	possibleStates: ['activated'],
    	correctCodeword: null,
    	magicWords: { 'activated': 'Value' },
    	description: "Похоже жюри выставило новое правило, что название блюда должно быть не длиннее 10 символов. Нужно внимательно следить, чтобы конкуренты не нарушили правила. Если оно длиннее 10 букв, то кричи (\"Несоблюдение правил!\"), если их ровно 10, то нужно крикнуть (\"Требуем дополнительную проверку\"), а если все нормально, то скажи(\"Тут все чисто\").",
    	operators: ['<code>print()</code>', '<code>if</code>', '<code>len()</code>', '<code>elif</code>', '<code>else</code>'],
    	levelVariable: 'names',
    	levelVariableRange: [1, 1],
    	requiredGreeting: null,
    	entities: [
        	createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
        	createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
        	createEntity('Жюри', 'pharaoh', 'target', 0, 0),
    	]
    },

    // 🍽️ Уровень 6.6: "Проверка маркировки на ошибки печати"
    {
    	id: '6.6',
    	name: 'Проверка маркировки на ошибки печати',
    	currentState: 'activated',
    	possibleStates: ['activated'],
    	correctCodeword: null,
    	magicWords: { 'activated': 'Value' },
    	description: "Принтер маркировок сломался и вместо некоторых символов на маркировках печатал \"⬛\", проверь маркировки посимвольно, и если встретишь ошибку печати, сразу говори \"Перепечатать\", иначе помечай ее как \"Нормальная\".",
    	operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>', '<code>len()</code>', '<code>else</code>'],
    	levelVariable: 'marking_label',
    	levelVariableRange: [1, 1],
    	requiredGreeting: null,
    	entities: [
        	createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
        	createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
        	createEntity('Жюри', 'pharaoh', 'target', 0, 0),
    	]
    },

    // 🍽️ Уровень 6.7: "Проверка ингредиентов"
    {
        id: '6.7',
        name: 'Проверка ингредиентов',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Пришел очень длинный список ингредиентов (задан строкой). Нужно проверить, есть ли в нем помидоры и если да, вывести (Помидоры есть), аесли нет, то (Помидоров нет), и нет ли базилика, с ним так же, либо (Базилик есть), либо (Базилика нет). Регистр в списке сбился - слова записаны по-разному. Приведи список к общему виду с помощью .upper(), затем проверь условия.",
        operators: ['<code>print()</code>', '<code>if</code>', '<code>.upper()</code>', '<code>in</code>', '<code>not in</code>'],
        levelVariable: 'ingredients_list',
        levelVariableRange: [1, 1],
        requiredGreeting: null,
        entities: [
            createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🍽️ Уровень 6.8: "Исправление маркировки"
    {
        id: '6.8',
        name: 'Исправление маркировки',
        currentState: 'activated',
        possibleStates: ['activated'],
        correctCodeword: null,
        magicWords: { 'activated': 'Value' },
        description: "Проверь маркировку посимвольно. Если символ - буква, вывести 'Неверно', если цифра - 'Верно', если другой символ - 'Ошибка'.",
        operators: ['<code>print()</code>', '<code>for</code>', '<code>if</code>', '<code>.isalpha()</code>', '<code>.isdigit()</code>'],
        levelVariable: 'bug_marking',
        levelVariableRange: [1, 1],
        requiredGreeting: null,
        entities: [
            createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    },

    // 🍽️ Уровень 6.9: "Принятие сложного заказа"
    {
            id: '6.9',
    	    name: 'Преобразование списка в строку',
    	    currentState: 'activated',
    	    possibleStates: ['activated'],
    	    correctCodeword: null,
    	    magicWords: { 'activated': 'Value' },
    	    description: "Нам передали рецепт, но он записан списком и из-за этого занимает много памяти, а принтер маркировок барахлит. Преобразуй список в строку, где ингредиенты разделены знаком '->' — так с ней можно будет работать как с обычной строкой, используя все строковые методы.",
    	    operators: ['<code>print()</code>', '<code>.join()</code>'],
    	    levelVariable: 'orders',
    	    levelVariableRange: [3, 5],
    	    requiredGreeting: null,
    	    entities: [
            	createEntity('Луи (Стажер)', 'terminal', 'terminal', 0, 0),
            	createEntity('Марио (Шеф)', 'keeper', 'source', 0, 0, null),
            	createEntity('Жюри', 'pharaoh', 'target', 0, 0),
        ]
    }

];

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

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
    
    // Установка Приветственного Слова Марио
    const greetingWord = ESSENCE_GREETINGS[getRandomInt(0, ESSENCE_GREETINGS.length - 1)];
    levelData.requiredGreeting = greetingWord;

    let terminalDataValue;
    let correctResult;

    // НЕ сбрасываем pythonVariables здесь - они сбрасываются в startGame
    // pythonVariables = {};

    switch (levelData.id) {
        case '6.1': {
            // Сбор названия блюда из трёх частей (НЕРАВНОМЕРНОЕ РАЗДЕЛЕНИЕ)
            const dishes = [
        	{ name: 'Спагетти с соусом', parts: ['Спаг', 'етти с со', 'усом'] },
        	{ name: 'Карбонара с беконом', parts: ['Кар', 'бонара с б', 'економ'] },
        	{ name: 'Ризотто с грибами', parts: ['Риз', 'отто с гри', 'бами'] },
        	{ name: 'Лазанья с сыром', parts: ['Ла', 'занья с сы', 'ром'] },
        	{ name: 'Паста с морепродуктами', parts: ['Пас', 'та с морепр', 'одуктами'] }
    	    ];
            
            const randomDish = dishes[getRandomInt(0, dishes.length - 1)];
            terminalDataValue = randomDish.name;
            correctResult = randomDish.name;
            
            // СОЗДАЕМ ПЕРЕМЕННЫЕ НЕПОСРЕДСТВЕННО В pythonVariables
            pythonVariables['part1'] = randomDish.parts[0];
    	    pythonVariables['part2'] = randomDish.parts[1];
    	    pythonVariables['part3'] = randomDish.parts[2];
            
            // Также сохраняем в levelData для отладки
            levelData.parts = randomDish.parts;
            // ДОБАВИТЬ эту строку:
            levelData.initialVariables = {
        	'n': 1,
        	'part1': randomDish.parts[0],
        	'part2': randomDish.parts[1],
        	'part3': randomDish.parts[2],
        	'ingredients': terminalDataValue
    	    };
    	    break;
	}
        case '6.2': {
            // Подсчёт восклицательных знаков
            const exclamations = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
            let tirade = '';
            for (let i = 0; i < exclamations; i++) {
                tirade += 'Идеально! ';
            }
            terminalDataValue = tirade.trim();
            correctResult = exclamations.toString();
            pythonVariables['тирада'] = terminalDataValue;
            break;
        }
        case '6.3': {
            // Приведение этикетки к нижнему регистру
            const spices = ['ВАНИЛЬ', 'ШАФРАН', 'КАРДАМОН', 'КОРИЦА', 'МУСКАТНЫЙ ОРЕХ'][getRandomInt(0, 4)];
            terminalDataValue = spices;
            correctResult = spices.toLowerCase();
            pythonVariables['этикетка'] = terminalDataValue;
            break;
        }
        case '6.4': {
    		// Исправление года на этикетке
    		// 80% шанс на правильный год 2126, 20% на случайный другой год
    		const isCorrectYear = Math.random() < 0.8;
    		const year = isCorrectYear ? '2126' : getRandomInt(1900, 2100).toString();
    
    		terminalDataValue = year;
    		correctResult = isCorrectYear ? '2026' : 'ДОП. ПРОВЕРКА';
    		pythonVariables['marking'] = terminalDataValue;
    		break;
	}
        case '6.5': {
    		// Генерируем случайную строку длиной от 5 до 15 символов
    		const possibleNames = [
        		"Спагетти", "Карбонара", "Ризотто", "Лазанья", "Паста", 
        		"Пицца Маргарита", "Салат Цезарь", "Борщ", "Пельмени", "Шашлык"
    		];
    		const name = possibleNames[getRandomInt(0, possibleNames.length - 1)];
    		terminalDataValue = name;
    
    		// Определяем правильный результат в зависимости от длины
    		const nameLength = name.length;
    		if (nameLength > 10) {
        		correctResult = "Несоблюдение правил!";
    		} else if (nameLength === 10) {
        		correctResult = "Требуем дополнительную проверку!";
    		} else {
        		correctResult = "Тут все чисто";
    		}
    
    		pythonVariables['names'] = terminalDataValue;
    		correctResult = String(correctResult);
		levelData.correctCodeword = String(correctResult);
    		break;
        }

	case '6.6': {
    		// Генерируем маркировку с возможными ошибками печати
    		const length = getRandomInt(5, 10);
    		let marking = "";
    		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789⬛";
    
    		// Гарантируем, что будет хотя бы один символ ⬛ в 70% случаев
    		const hasError = Math.random() < 0.7;
    		let errorPosition = hasError ? getRandomInt(0, length - 1) : -1;
    
    		for (let i = 0; i < length; i++) {
        		if (i === errorPosition) {
            			marking += "⬛";
        		} else {
            			marking += characters[getRandomInt(0, characters.length - 2)]; // без ⬛
        		}
    		}
    
    		terminalDataValue = marking;
    
    		// Генерируем правильный результат - проверяем каждый символ
    		let correctLines = [];
    		for (let i = 0; i < marking.length; i++) {
        		if (marking[i] === "⬛") {
            			correctLines.push("Перепечатать");
        		} else {
            			correctLines.push("Нормальная");
        		}
    		}
    		correctResult = correctLines.join("\n");
    
    		pythonVariables['marking_label'] = terminalDataValue;
    		break;
        }
        case '6.7': {
            // Генерация списка ингредиентов со случайным регистром
            const allIngredients = [
                'пОмИдОр', 'бАзИлИк', 'перец', 'сОлЬ', 'маслО', 
                'чесНОК', 'луК', 'мЯсО', 'рыБа', 'сыР'
            ];
            
            // Создаем случайную последовательность ингредиентов
            const numIngredients = getRandomInt(5, 8);
            let selectedIngredients = [];
            for (let i = 0; i < numIngredients; i++) {
                const randomIndex = getRandomInt(0, allIngredients.length - 1);
                selectedIngredients.push(allIngredients[randomIndex]);
            }
            
            // Гарантируем наличие помидора в 80% случаев
            const hasTomato = Math.random() < 0.8;
            if (hasTomato && !selectedIngredients.includes('пОмИдОр')) {
                selectedIngredients[getRandomInt(0, selectedIngredients.length - 1)] = 'пОмИдОр';
            }
            
            // Гарантируем отсутствие базилика в 60% случаев
            const hasBasil = Math.random() < 0.4;
            if (!hasBasil && selectedIngredients.includes('бАзИлИк')) {
                selectedIngredients = selectedIngredients.filter(item => item !== 'бАзИлИк');
            } else if (hasBasil && !selectedIngredients.includes('бАзИлИк')) {
                selectedIngredients.push('бАзИлИк');
            }
            
            // Перемешиваем и создаем строку
            terminalDataValue = selectedIngredients.join(', ');
            
            // Генерируем правильный результат
            const upperIngredients = terminalDataValue.toUpperCase();
            let resultLines = [];
            
            if (upperIngredients.includes('ПОМИДОР')) {
                resultLines.push('Помидоры есть');
            } else {
                resultLines.push('Помидоров нет');
            }
            
            if (!upperIngredients.includes('БАЗИЛИК')) {
                resultLines.push('Базилика нет');
            } else {
                resultLines.push('Базилик есть');
            }
            
            correctResult = resultLines.join('\n');
            pythonVariables['ingredients_list'] = terminalDataValue;
            break;
        }
        
        case '6.8': {
    	    // Генерация строки с буквами, цифрами и специальными символами
    	    const length = getRandomInt(10, 20);
    	    let marking = '';
    	    const digits = '0123456789';
    	    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    	    const specials = '!@#$%^&*()-_=+[]{}|;:,.<>?/';
    
    	    // Гарантируем наличие всех типов символов
    	    const hasLetter = true;
    	    const hasDigit = true;
    	    const hasSpecial = true;
    
    	    // Сначала добавляем по одному символу каждого типа
    	    marking += letters[getRandomInt(0, letters.length - 1)];
    	    marking += digits[getRandomInt(0, digits.length - 1)];
    	    marking += specials[getRandomInt(0, specials.length - 1)];
    
    	    // Заполняем остаток случайными символами
    	    for (let i = 3; i < length; i++) {
        	    const charType = getRandomInt(1, 3);
        
        	    if (charType === 1) {
            	        // Буква
                        marking += letters[getRandomInt(0, letters.length - 1)];
        	    } else if (charType === 2) {
                        // Цифра
            	        marking += digits[getRandomInt(0, digits.length - 1)];
        	    } else {
            	        // Специальный символ
            	        marking += specials[getRandomInt(0, specials.length - 1)];
        	    }
    	    }
    
            terminalDataValue = marking;
    
            // Генерируем правильный результат
            let resultLines = [];
            for (let i = 0; i < marking.length; i++) {
        	const ch = marking[i];
        
        	if (/^[A-Za-z]$/.test(ch)) {
            		resultLines.push('Неверно');
        	} else if (/^\d$/.test(ch)) {
            		resultLines.push('Верно');
        	} else {
            		resultLines.push('Ошибка');
        	}
    	    }
    
    	    correctResult = resultLines.join('\n');
    	    pythonVariables['bug_marking'] = terminalDataValue;
    	    break;
	}

        case '6.9': {
             // Преобразование списка в строку
    	    const orderCount = getRandomInt(levelData.levelVariableRange[0], levelData.levelVariableRange[1]);
    	    const ingredients = ['курица', 'рис', 'соус', 'брокколи', 'имбирь', 'чеснок'];
    	    const selected = ingredients.slice(0, orderCount);
    	    terminalDataValue = selected; // Список ингредиентов
    	    correctResult = selected.join('->'); // Ожидаемый результат: строка с разделителем +
    	    pythonVariables['orders'] = selected; // Сохраняем список в переменную
    	    break;
        }
    }
    
    levelData.levelVariableValue = terminalDataValue;
    levelData.correctCodeword = String(correctResult);
    levelData.displayTerminalData = terminalDataValue;
    pythonVariables[levelData.levelVariable] = terminalDataValue;
}

function updateSidebars(levelData) {
    if (!levelData || !levelData.entities) {
        instructionSidebar.style.display = 'block';
        taskSidebar.style.display = 'block';
        return;
    }

    instructionSidebar.style.display = 'block';
    instructionContent.innerHTML = getOpHint(levelData.operators);

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
    lessonSubtitle.textContent = 'Занятие 6: Работа со строками'; 
    lessonText.innerHTML = `
        Добро пожаловать на кулинарное шоу «Битва Шефов»! Ты стажёр на самой популярной кулинарной арене.<br><br>
        <strong>Работа со строками</strong> в Python позволяет обрабатывать текстовые данные. Тебе нужно будет использовать методы строк для выполнения заданий на кухне.<br>
        <strong>Твоя задача:</strong> Получить данные у <b>Луи (Стажер)</b>, узнать Приветственное Слово у <b>Марио (Шеф)</b>, выполнить задание и представить результат <b>Жюри</b> после приветствия!
    `; 
    document.getElementById('start-game-btn').textContent = 'Начать Занятие 6'; 
}

window.hideIntroAndStart = async function() {
    introScreen.style.display = 'none';
    gameContainer.style.opacity = '1';
    canvas.style.display = 'block';
    outputDisplay.style.display = 'block';
    gameMainTitle.textContent = `Занятие ${currentPart}`;
    codeInput.placeholder = "print(...), .count(), .lower(), .replace(), .split(), .join()";
    // Загружаем сохраненный прогресс
    const savedProgress = await loadProgress();
    if (savedProgress && savedProgress.success) {
        currentPart = savedProgress.currentPart || 2;
        currentLevel = savedProgress.currentLevel || 0;
        console.log('Прогресс загружен:', { currentPart, currentLevel, totalExperience });
    }
    startGame(currentLevel);
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
        winModal.querySelector('#modal-title').textContent = "Занятие 6 пройдено!"; 
        winModal.querySelector('#modal-text').innerHTML = `Ты отлично справился с кулинарными задачами! <br> Готов к следующему уроку?`; 
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
    if (currentLevel + 1 < PART_6_LEVELS.length) { 
        currentLevel++;
        // Сохраняем прогресс при переходе на следующий уровень
        await saveProgressToGoogleSheets('update');
        startGame(currentLevel);
    } else {
        currentPart = 6; 
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
    if (levelIndex < 0 || levelIndex >= PART_6_LEVELS.length) { 
        messageElement.textContent = `Ошибка: Уровень ${levelIndex} не существует. Запущено Занятие 6.1.`; 
        levelIndex = 0;
    }
    currentLevel = levelIndex;
    const levelSource = PART_6_LEVELS[levelIndex]; 
    if (!levelSource) {
        messageElement.textContent = "Ошибка загрузки уровня. Проверьте PART_6_LEVELS."; 
        return;
    }
    
    // СБРАСЫВАЕМ переменные, но оставляем n
    pythonVariables = {'n': 1};
    currentLevelData = JSON.parse(JSON.stringify(levelSource));
    setupDynamicLevel(currentLevelData);  // Эта функция добавит нужные переменные
    setupRandomPositions(currentLevelData);
    
    // ОСТАЛЬНОЙ КОД БЕЗ ИЗМЕНЕНИЙ
    direction = 'вправо';
    lastPrintedResult = null;
    printedExpression = null;
    consoleOutput = "--- Сброс консоли ---\n";
    targetUnlocked = false; 
    codeInput.value = '';
    messageElement.textContent = `Уровень ${currentLevelData.id}. Введите код.`;

    levelPhase = 'initial';
    wasForLoopExecuted = false;
    
    // СБРОС СОСТОЯНИЯ ВОПРОСОВ
    passwordCheckPassed = false;
    questionAttempts = 0;
    isQuestionModalOpen = false;
    questionExperienceAwarded = false;
    selectedLines = [];
    currentQuestionIndex = -1;
    
    outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
    resetGameExecutionState();
    updateSidebars(currentLevelData);
    updateReferenceContent();
    resetAnimations();
    startAnimationLoop();
    updateExperienceDisplay();
    drawGame();
}


function checkCollision(x, y, entity) {
    const gridSize = PLAYER_SIZE;
    return (
        Math.floor(x / gridSize) === Math.floor(entity.x / gridSize) &&
        Math.floor(y / gridSize) === Math.floor(entity.y / gridSize)
    );
}

function handleTargetInteraction() {
    const targetEntity = currentLevelData.entities.find(e => e.name_en === 'pharaoh');

    if (!targetEntity || !checkCollision(playerX, playerY, targetEntity)) {
        return;
    }
    levelAttempts++;
    console.log(`[Опыт] Попытка взаимодействия с Жюри №${levelAttempts}`);
    
    const allOutputLines = window.consoleOutputBuffer.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const firstOutputLine = allOutputLines.length > 0 ? allOutputLines[0] : '';
    
    let resultOutput = '';
    if (allOutputLines.length > 1) {
        resultOutput = allOutputLines.slice(1).join('\n');
    }

    const requiredGreeting = currentLevelData.requiredGreeting;
    if (levelPhase === 'initial') {
        if (firstOutputLine.includes(requiredGreeting)) { 
            levelPhase = 'target_greeted';
            consoleOutput += `\n> Жюри: Приветствие принято! Проверяю ваш кулинарный код...\n`;
            messageElement.textContent = "Жюри: Приветствие принято! Проверяю ваш кулинарный код...";
            updateOutputDisplay();
        } else {
            messageElement.textContent = `Жюри ждет приветствие. (Получено: "${firstOutputLine}")`; 
            updateOutputDisplay();
            return;
        }
    }
     
    const requiredCodeword = currentLevelData.correctCodeword;
    if (levelPhase === 'target_greeted') {
        // ДЛЯ УРОВНЯ 6.1: Проверяем, что использованы правильные переменные
        if (currentLevelData.id === '6.1') {
            console.log("Проверка переменных для 6.1:", {
                initialVariables: currentLevelData.initialVariables,
                pythonVariables: pythonVariables,
                codeInput: codeInput.value
            });
            
            // Проверяем, что переменные part1, part2, part3 существуют и имеют значения
            const hasVariables = 
                pythonVariables['part1'] !== undefined && 
                pythonVariables['part2'] !== undefined && 
                pythonVariables['part3'] !== undefined;
            
            if (!hasVariables) {
                messageElement.textContent = "Сначала присвой значения переменным part1, part2, part3!";
                consoleOutput += `\n> Жюри: Ты должен создать переменные part1, part2, part3!\n`;
                updateOutputDisplay();
                return;
            }
            
            // Проверяем, что в коде есть присваивание переменных (более гибкая проверка)
            const normalizedCode = codeInput.value.toLowerCase().replace(/\s/g, '');
            const hasAssignmentInCode = 
                /part1\s*=\s*["'][^"']*["']/.test(codeInput.value) && 
                /part2\s*=\s*["'][^"']*["']/.test(codeInput.value) && 
                /part3\s*=\s*["'][^"']*["']/.test(codeInput.value);
            
            // Проверяем, что в коде есть сложение этих переменных
            const hasAdditionInCode = 
                /print\s*\(\s*part1\s*\+\s*part2\s*\+\s*part3\s*\)/i.test(codeInput.value) ||
                /print\s*\(\s*["'][^"']*["']\s*\+\s*["'][^"']*["']\s*\+\s*["'][^"']*["']\s*\)/.test(codeInput.value);
            
            console.log("Проверки для 6.1:", {
                hasVariables,
                hasAssignmentInCode,
                hasAdditionInCode,
                normalizedCode
            });
            
            if (!hasAssignmentInCode) {
                messageElement.textContent = "Нужно присвоить значения переменным part1, part2, part3! (Например: part1 = '...')";
                consoleOutput += `\n> Жюри: Используй: part1 = "..."; part2 = "..."; part3 = "..."\n`;
                updateOutputDisplay();
                return;
            }
            
            if (!hasAdditionInCode) {
                messageElement.textContent = "Нужно использовать сложение переменных: print(part1 + part2 + part3)!";
                consoleOutput += `\n> Жюри: Используй сложение переменных: print(part1 + part2 + part3)\n`;
                updateOutputDisplay();
                return;
            }
            
            // Дополнительная проверка: результат должен быть правильным
            const userResult = resultOutput.trim();
            if (userResult !== requiredCodeword) {
                messageElement.textContent = `Неверный результат. Ожидается: ${requiredCodeword}\nПолучено: ${userResult}`;
                consoleOutput += `\n> Жюри: Результат не совпадает. Проверь свои вычисления!\n`;
                updateOutputDisplay();
                return;
            }
        }
        // ДЛЯ УРОВНЯ 6.2: Проверяем, использовал ли игрок .count()
	if (currentLevelData.id === '6.2') {
    	    if (!currentExecutionFlags.usedCount) {
        	messageElement.textContent = "Жюри: Для этого уровня нужно использовать метод .count()!";
        	consoleOutput += `\n> Жюри: Ты не использовал метод .count() для подсчета восклицательных знаков!\n`;
        	updateOutputDisplay();
        	return;
    	    }
	}
        // ДЛЯ УРОВНЯ 6.3: Проверяем, использовал ли игрок if и .lower()
        if (currentLevelData.id === '6.3') {
            if (!currentExecutionFlags.usedIf || !currentExecutionFlags.usedLower) {
                let missingItems = [];
                if (!currentExecutionFlags.usedIf) missingItems.push("оператор if");
                if (!currentExecutionFlags.usedLower) missingItems.push("метод .lower()");
                
                messageElement.textContent = `Жюри: Для этого уровня нужно использовать ${missingItems.join(" и ")}!`;
                consoleOutput += `\n> Жюри: Ты не использовал ${missingItems.join(" и ")} для решения задания!\n`;
                updateOutputDisplay();
                return;
            }
        }
	if (currentLevelData.id === '6.4') {
    		if (!currentExecutionFlags.usedIf || !currentExecutionFlags.usedReplace) {
        		let missingItems = [];
        		if (!currentExecutionFlags.usedIf) missingItems.push("оператор if");
        		if (!currentExecutionFlags.usedReplace) missingItems.push("метод .replace()");
        
        		messageElement.textContent = `Жюри: Для этого уровня нужно использовать ${missingItems.join(" и ")}!`;
        		consoleOutput += `\n> Жюри: Ты не использовал ${missingItems.join(" и ")} для решения задания!\n`;
        		updateOutputDisplay();
        		return;
    		}
	}
        if (currentLevelData.id === '6.5') {
		console.log("[DEBUG] Проверка уровня 6.5");
    		console.log("[DEBUG] Флаги: usedIf=", currentExecutionFlags.usedIf, "usedLen=", currentExecutionFlags.usedLen);
    		console.log("[DEBUG] resultOutput:", resultOutput);
    		console.log("[DEBUG] requiredCodeword:", requiredCodeword);
    		if (!currentExecutionFlags.usedIf || !currentExecutionFlags.usedLen) {
        		let missingItems = [];
        		if (!currentExecutionFlags.usedIf) missingItems.push("оператор if");
        		if (!currentExecutionFlags.usedLen) missingItems.push("функцию len()");
			
        
        		messageElement.textContent = `Жюри: Для этого уровня нужно использовать ${missingItems.join(" и ")}!`;
        		consoleOutput += `\n> Жюри: Ты не использовал ${missingItems.join(" и ")} для решения задания!\n`;
        		updateOutputDisplay();
        		return;
    		}
	}

	// ДЛЯ УРОВНЯ 6.6: Проверяем, использовал ли игрок for, if и len()
	if (currentLevelData.id === '6.6') {
    		if (!currentExecutionFlags.usedFor || !currentExecutionFlags.usedIf || !currentExecutionFlags.usedLen) {
        		let missingItems = [];
        		if (!currentExecutionFlags.usedFor) missingItems.push("цикл for");
        		if (!currentExecutionFlags.usedIf) missingItems.push("оператор if");
        		if (!currentExecutionFlags.usedLen) missingItems.push("функцию len()");
        
        		messageElement.textContent = `Жюри: Для этого уровня нужно использовать ${missingItems.join(", ")}!`;
        		consoleOutput += `\n> Жюри: Ты не использовал ${missingItems.join(", ")} для решения задания!\n`;
        		updateOutputDisplay();
        		return;
    		}
	}
        
        // ДЛЯ УРОВНЯ 6.7: Проверяем, использовал ли игрок if и .upper()
        if (currentLevelData.id === '6.7') {
            if (!currentExecutionFlags.usedIf) {
                messageElement.textContent = `Жюри: Для этого уровня нужно использовать оператор if!`;
                consoleOutput += `\n> Жюри: Ты не использовал оператор if для проверки условий!\n`;
                updateOutputDisplay();
                return;
            }
            
            // Проверяем, использован ли .upper() в коде
            const normalizedCode = codeInput.value.toLowerCase().replace(/\s/g, '');
            const hasUpper = /\.upper\(\)/.test(codeInput.value);
            
            if (!hasUpper) {
                messageElement.textContent = "Нужно привести список продуктов к нормальному виду, иначе касса его не обработает! Используй .upper()";
                consoleOutput += `\n> Жюри: Используй .upper() для приведения списка к общему виду!\n`;
                updateOutputDisplay();
                return;
            }
        }
        
        // ДЛЯ УРОВНЯ 6.8: Проверяем, использовал ли игрок for, if, .isalpha(), .isdigit()
        if (currentLevelData.id === '6.8') {
            // Проверяем использование for
            if (!currentExecutionFlags.usedFor) {
                messageElement.textContent = "Жюри: Для этого уровня нужно использовать цикл for!";
                consoleOutput += `\n> Жюри: Ты не использовал цикл for для перебора символов!\n`;
                updateOutputDisplay();
                return;
            }
            
            // Проверяем использование if
            if (!currentExecutionFlags.usedIf) {
                messageElement.textContent = "Жюри: Для этого уровня нужно использовать оператор if!";
                consoleOutput += `\n> Жюри: Ты не использовал оператор if для проверки условий!\n`;
                updateOutputDisplay();
                return;
            }
            
            // Проверяем использование .isalpha() и .isdigit() в коде
            const hasIsAlpha = /\.isalpha\(\)/.test(codeInput.value);
            const hasIsDigit = /\.isdigit\(\)/.test(codeInput.value);
            
            if (!hasIsAlpha || !hasIsDigit) {
                messageElement.textContent = "Жюри: Для этого уровня нужно использовать .isalpha() и .isdigit()!";
                consoleOutput += `\n> Жюри: Используй .isalpha() и .isdigit() для проверки символов!\n`;
                updateOutputDisplay();
                return;
            }
        }
        
	// ДЛЯ УРОВНЯ 6.9: Проверяем, использовал ли игрок .join()
	if (currentLevelData.id === '6.9') {
    		if (!currentExecutionFlags.usedJoin) {
        	messageElement.textContent = "Жюри: Для этого уровня нужно использовать метод .join() для преобразования списка в строку!";
        	consoleOutput += `\n> Жюри: Ты не использовал .join() для преобразования списка в строку!\n`;
        	updateOutputDisplay();
        	return;
    		}
	}

        // ОБЩАЯ ПРОВЕРКА ДЛЯ ВСЕХ УРОВНЕЙ
        if (resultOutput === requiredCodeword) { 
            consoleOutput += `\n> Жюри: Браво! Задание выполнено идеально!\n`;
            messageElement.textContent = "Жюри: Браво! Задание выполнено идеально! Уровень пройден!";
            updateOutputDisplay();
            showWinModal(false);
        } else {
            messageElement.textContent = `Неверный результат. Ожидается:\n${requiredCodeword}\nПолучено:\n${resultOutput}`;
            consoleOutput += `\n> Жюри: Это не тот результат, который мы ожидали. Попробуй еще раз.\n`;
            updateOutputDisplay();
        }
    }
}


function handlePrintForEntity(line) {
    const match = line.match(/^print\s*\((.*)\)$/);
    if (!match) return true;

    let content = match[1].trim();
    let printedText;

    const isSimpleString = (content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"));

    if (isSimpleString) {
        printedText = content.slice(1, -1);
    } else {
        try {
            const evaluateExpression = (expr) => {
                console.log(`[EVAL_EXPR] Начало обработки выражения: ${expr}`);
                
                // Функция для обработки всех строковых методов
                const processStringMethods = (expr) => {
                    console.log(`[STRING_METHODS] Обработка: ${expr}`);
                    let result = expr;
                    
                    // 1. Обработка .upper()
                    const upperPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.upper\s*\(\s*\)/gi;
                    let match;
                    
                    while ((match = upperPattern.exec(expr)) !== null) {
                        const target = match[1];
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .upper()`);
                        }
                        
                        const upperStr = strValue.toUpperCase();
                        result = result.replace(match[0], `'${upperStr}'`);
                        console.log(`[UPPER] ${target}.upper() = "${upperStr}"`);
                        
                        // Устанавливаем флаг для уровня 6.7
                        if (currentLevelData && currentLevelData.id === '6.7') {
                            currentExecutionFlags.usedUpper = true;
                            console.log("[DEBUG] Зафиксировано использование .upper() для уровня 6.7");
                        }
                    }
                    
                    // 2. Обработка .lower()
                    const lowerPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.lower\s*\(\s*\)/gi;
                    while ((match = lowerPattern.exec(expr)) !== null) {
                        const target = match[1];
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .lower()`);
                        }
                        
                        const lowerStr = strValue.toLowerCase();
                        result = result.replace(match[0], `'${lowerStr}'`);
                        console.log(`[LOWER] ${target}.lower() = "${lowerStr}"`);
			if (currentLevelData && currentLevelData.id === '6.3') {
        			currentExecutionFlags.usedLower = true;
        			console.log("[DEBUG] Зафиксировано использование .lower() для уровня 6.3");
    			}
                    }
                    
                    // 3. Обработка .replace('старое', 'новое')
                    const replacePattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.replace\s*\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/gi;
                    while ((match = replacePattern.exec(expr)) !== null) {
                        const target = match[1];
                        const oldStr = match[2];
                        const newStr = match[3];
                        
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .replace()`);
                        }
                        
                        const replacedStr = strValue.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
                        result = result.replace(match[0], `'${replacedStr}'`);
                        console.log(`[REPLACE] ${target}.replace("${oldStr}", "${newStr}") = "${replacedStr}"`);
			// В обработке .replace() в evaluateExpression добавьте:
			if (currentLevelData && currentLevelData.id === '6.4') {
    				currentExecutionFlags.usedReplace = true;
    				console.log("[DEBUG] Зафиксировано использование .replace() для уровня 6.4");
			}
                    }
                    
                    // 4. Обработка .isdigit()
                    const isdigitPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.isdigit\s*\(\s*\)/gi;
                    while ((match = isdigitPattern.exec(expr)) !== null) {
                        const target = match[1];
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .isdigit()`);
                        }
                        
                        const isDigit = /^\d+$/.test(strValue);
                        result = result.replace(match[0], isDigit ? 'True' : 'False');
                        console.log(`[ISDIGIT] ${target}.isdigit() = ${isDigit}`);
                        
                        // Устанавливаем флаг для уровня 6.8
                        if (currentLevelData && currentLevelData.id === '6.8') {
                            currentExecutionFlags.usedIsDigit = true;
                            console.log("[DEBUG] Зафиксировано использование .isdigit() для уровня 6.8");
                        }
                    }
                    
                    // 5. Обработка .isalpha()
                    const isalphaPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.isalpha\s*\(\s*\)/gi;
                    while ((match = isalphaPattern.exec(expr)) !== null) {
                        const target = match[1];
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .isalpha()`);
                        }
                        
                        // Проверяем, состоит ли строка только из букв
                        const isAlpha = /^[A-Za-zА-Яа-я]+$/.test(strValue);
                        result = result.replace(match[0], isAlpha ? 'True' : 'False');
                        console.log(`[ISALPHA] ${target}.isalpha() = ${isAlpha}`);
                        
                        // Устанавливаем флаг для уровня 6.8
                        if (currentLevelData && currentLevelData.id === '6.8') {
                            currentExecutionFlags.usedIsAlpha = true;
                            console.log("[DEBUG] Зафиксировано использование .isalpha() для уровня 6.8");
                        }
                    }
                    
                    // 6. Обработка .split('разделитель')
                    const splitPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.split\s*\(\s*['"]([^'"]*)['"]\s*\)/gi;
                    while ((match = splitPattern.exec(expr)) !== null) {
                        const target = match[1];
                        const delimiter = match[2];
                        
                        let strValue;
                        
                        if ((target.startsWith("'") && target.endsWith("'")) || 
                            (target.startsWith('"') && target.endsWith('"'))) {
                            strValue = target.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(target)) {
                            const varValue = pythonVariables[target];
                            if (typeof varValue === 'string') {
                                strValue = varValue;
                            } else {
                                strValue = String(varValue);
                            }
                        } else {
                            throw new Error(`Переменная ${target} не определена для .split()`);
                        }
                        
                        const splitArray = strValue.split(delimiter);
                        result = result.replace(match[0], JSON.stringify(splitArray));
                        console.log(`[SPLIT] ${target}.split("${delimiter}") = ${JSON.stringify(splitArray)}`);
                    }
		    // 7. Обработка len()
		    const lenPattern = /len\s*\(\s*['"]([^"']*)['"]\s*\)|len\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
		    let lenMatch;
		    while ((lenMatch = lenPattern.exec(result)) !== null) {
    			let strValue;
    			if (lenMatch[1] !== undefined) {
        			// Строковый литерал
        			strValue = lenMatch[1];
    			} else {
        			// Переменная
        			const varName = lenMatch[2];
        			if (pythonVariables.hasOwnProperty(varName)) {
            				const varValue = pythonVariables[varName];
            				if (typeof varValue === 'string') {
                				strValue = varValue;
            				} else if (Array.isArray(varValue)) {
                				// Если это массив, то длина массива
                				const len = varValue.length;
                				result = result.replace(lenMatch[0], len);
                				// Устанавливаем флаг usedLen
                				currentExecutionFlags.usedLen = true;
                				console.log("[LEN] len(" + varName + ") = " + len + " (массив)");
                				lenPattern.lastIndex = 0; // Сбросить индекс поиска
                				continue;
            				} else {
                				// Если это не строка и не массив, преобразуем в строку
                				strValue = String(varValue);
            				}
        			} else {
            				throw new Error(`Переменная ${varName} не определена для len()`);
        			}
    			}
    			const length = strValue.length;
    			result = result.replace(lenMatch[0], length);
    			// Устанавливаем флаг usedLen
    			currentExecutionFlags.usedLen = true;
    			console.log("[LEN] len(" + (lenMatch[1] ? `"${lenMatch[1]}"` : lenMatch[2]) + ") = " + length);
    			lenPattern.lastIndex = 0; // Сбросить индекс поиска после замены
		    }
                    
                    // 8. Обработка .join(разделитель)
                    // Шаблон: список.join('разделитель')
                    const joinPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.join\s*\(\s*([^)]+)\s*\)/gi;
                    while ((match = joinPattern.exec(expr)) !== null) {
                        const delimiter = match[1]; // Это разделитель
                        const arrayExpr = match[2]; // Это список
                        
                        let delimiterStr;
                        
                        // Определяем разделитель
                        if ((delimiter.startsWith("'") && delimiter.endsWith("'")) || 
                            (delimiter.startsWith('"') && delimiter.endsWith('"'))) {
                            delimiterStr = delimiter.slice(1, -1);
                        } else if (pythonVariables.hasOwnProperty(delimiter)) {
                            const varValue = pythonVariables[delimiter];
                            if (typeof varValue === 'string') {
                                delimiterStr = varValue;
                            } else {
                                delimiterStr = String(varValue);
                            }
                        } else {
                            throw new Error(`Разделитель ${delimiter} не определен для .join()`);
                        }
                        
                        // Определяем список
                        let arrayValue;
                        try {
                            // Попробуем вычислить выражение списка
                            const processedArrayExpr = arrayExpr.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]\w*)/g, 
                                (m, single, double, varName) => {
                                    if (single !== undefined) return `"${single}"`;
                                    if (double !== undefined) return `"${double}"`;
                                    if (pythonVariables.hasOwnProperty(varName)) {
                                        const val = pythonVariables[varName];
                                        if (Array.isArray(val)) {
                                            return JSON.stringify(val);
                                        }
                                        return typeof val === 'string' ? `"${val}"` : val;
                                    }
                                    return m;
                                });
                            
                            // Парсим JSON или создаем массив из строки
                            if (processedArrayExpr.startsWith('[') && processedArrayExpr.endsWith(']')) {
                                try {
                                    arrayValue = JSON.parse(processedArrayExpr);
                                } catch (e) {
                                    throw new Error(`Неверный формат списка: ${arrayExpr}`);
                                }
                            } else {
                                // Если это переменная-список
                                const varMatch = arrayExpr.match(/^([a-zA-Z_]\w*)$/);
                                if (varMatch && pythonVariables.hasOwnProperty(varMatch[1])) {
                                    const val = pythonVariables[varMatch[1]];
                                    if (Array.isArray(val)) {
                                        arrayValue = val;
                                    } else {
                                        throw new Error(`Переменная ${varMatch[1]} не является списком`);
                                    }
                                } else {
                                    throw new Error(`Неверный формат списка для .join(): ${arrayExpr}`);
                                }
                            }
                        } catch (error) {
                            throw new Error(`Ошибка в .join(): ${error.message}`);
                        }
                        
                        if (!Array.isArray(arrayValue)) {
                            throw new Error(`Ожидается список для .join(), получено: ${typeof arrayValue}`);
                        }
                        
                        const joinedStr = arrayValue.join(delimiterStr);
                        result = result.replace(match[0], `'${joinedStr}'`);
                        console.log(`[JOIN] ${delimiter}.join(${JSON.stringify(arrayValue)}) = "${joinedStr}"`);
			// Устанавливаем флаг usedJoin для уровня 6.9
			if (currentLevelData && currentLevelData.id === '6.9') {
    				currentExecutionFlags.usedJoin = true;
    				console.log("[DEBUG] Зафиксировано использование .join() для уровня 6.9");
			}
                    }
		    // 9. Обработка .count('подстрока')
		    const countPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.count\s*\(\s*['"]([^'"]*)['"]\s*\)/gi;
		    while ((match = countPattern.exec(expr)) !== null) {
    			const target = match[1];
    			const substring = match[2];
    
    			let strValue;
    
    			if ((target.startsWith("'") && target.endsWith("'")) || 
        			(target.startsWith('"') && target.endsWith('"'))) {
        			strValue = target.slice(1, -1);
    			} else if (pythonVariables.hasOwnProperty(target)) {
        			const varValue = pythonVariables[target];
        			if (typeof varValue === 'string') {
            				strValue = varValue;
        			} else {
            				strValue = String(varValue);
        			}
    			} else {
        			throw new Error(`Переменная ${target} не определена для .count()`);
    			}
    
    			// Подсчитываем количество вхождений подстроки
    			let count = 0;
    			let pos = strValue.indexOf(substring);
    			while (pos !== -1) {
        			count++;
        			pos = strValue.indexOf(substring, pos + 1);
    			}
    
    			result = result.replace(match[0], count);
    			console.log(`[COUNT] ${target}.count("${substring}") = ${count}`);
    
    			// Устанавливаем флаг usedCount для уровня 6.2
    			if (currentLevelData && currentLevelData.id === '6.2') {
        			currentExecutionFlags.usedCount = true;
        			console.log("[DEBUG] Зафиксировано использование .count() для уровня 6.2");
    			}
		    }
                    
                    return result;
                };
                
                // Обрабатываем строковые методы
                let processed = processStringMethods(expr);
                console.log(`[EVAL_EXPR] После обработки методов: ${processed}`);
                
                // Заменяем переменные и строковые литералы
                processed = processed.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                    if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                    if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;
                    if (pythonVariables.hasOwnProperty(variableName)) {
                        const varValue = pythonVariables[variableName];
                        return typeof varValue === 'string' ? `'${varValue}'` : varValue;
                    }
                    throw new Error(`Переменная ${variableName} не определена.`);
                });

                console.log(`[EVAL_EXPR] После замены переменных: ${processed}`);

                // Обработка умножения строк
                const processStringMultiplication = (expr) => {
                    const stringMultiplyPattern = /(['"])(.*?)\1\s*\*\s*(.+)|(.+)\s*\*\s*(['"])(.*?)\5/g;
                    let result = expr;
                    let match;
                    
                    while ((match = stringMultiplyPattern.exec(expr)) !== null) {
                        let str, numExpr;
                        
                        if (match[1]) {
                            str = match[2];
                            numExpr = match[3];
                        } else {
                            str = match[6];
                            numExpr = match[4];
                        }
                        
                        let num;
                        try {
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

                processed = processStringMultiplication(processed);
                console.log(`[EVAL_EXPR] После умножения строк: ${processed}`);

                // Разбиваем на части по + и вычисляем
                const parts = processed.split(/\s*\+\s*/);
                if (parts.length > 1) {
                    let result = '';
                    for (let part of parts) {
                        // Удаляем лишние кавычки, если они есть
                        if ((part.startsWith("'") && part.endsWith("'")) || 
                            (part.startsWith('"') && part.endsWith('"'))) {
                            result += part.slice(1, -1);
                        } else {
                            try {
                                // Заменяем True/False на true/false для eval
                                const evalPart = part.replace(/True/g, 'true')
                                    .replace(/False/g, 'false')
                                    .replace(/and/g, '&&')
                                    .replace(/or/g, '||')
                                    .replace(/not/g, '!');
                                
                                const value = eval(evalPart);
                                result += String(value);
                            } catch (e) {
                                // Если не удалось вычислить, добавляем как есть
                                result += part;
                            }
                        }
                    }
                    console.log(`[EVAL_EXPR] Результат конкатенации: ${result}`);
                    return result;
                } else {
                    // Если только одна часть
                    const evalExpr = processed.replace(/True/g, 'true')
                        .replace(/False/g, 'false')
                        .replace(/and/g, '&&')
                        .replace(/or/g, '||')
                        .replace(/not/g, '!');
                    
                    const value = eval(evalExpr);
                    const result = typeof value === 'string' ? value : String(value);
                    console.log(`[EVAL_EXPR] Результат вычисления: ${result}`);
                    return result;
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
    
    window.consoleOutputBuffer += String(printedText) + "\n"; 
    
    const normalizedPrintedText = String(printedText).toLowerCase().trim();
    console.log(`[DEBUG] Normalized Print Text for Interaction: "${normalizedPrintedText}"`);

    const terminalEntity = currentLevelData.entities.find(e => e.name_en === 'terminal');
    if (terminalEntity && checkCollision(playerX, playerY, terminalEntity)) {
        if (normalizedPrintedText === 'данные кухни') {
            if (currentLevelData.id === '6.1') {
                // Для уровня 6.1 Луи говорит конкретно про три кусочка
                consoleOutput += `\n> Луи: Я нашел три кусочка, тебе нужно присвоить их переменным и соединить вместе:\n`;
                consoleOutput += `part1 = "${pythonVariables['part1'] || 'undefined'}"\n`;
                consoleOutput += `part2 = "${pythonVariables['part2'] || 'undefined'}"\n`;
                consoleOutput += `part3 = "${pythonVariables['part3'] || 'undefined'}"\n`;
                consoleOutput += `Затем используй Конкатенацию(соединение) строк, чтобы получить результат.`;
            } else if (currentLevelData.id === '6.2') {
                // Для уровня 6.2 - разбитое сообщение без вывода переменной
                consoleOutput += `\n> Луи: Я записал слова Шефа в файл exclamations, можешь посчитать сколько раз там используется "!"?\n`;
                consoleOutput += `> Луи: Мы поспорили с Жюри, я думаю там больше 20!\n`;
                consoleOutput += `> Луи:  Используй переменную exclamations и подходящую функцию, чтобы сделать это быстро.\n`;
            } else if (currentLevelData.id === '6.3') {
                consoleOutput += `\n> Луи: Жюри решили устроить проверку ингридиентов, а унас на кухней такой беспорядок!\n`;
		consoleOutput += `\n> Луи: Нужно занести все в базу, но получится только если название маленькими буквами.\n`;
		consoleOutput += `\n> Луи: А некоторые этиктеки вообще стерлись! Напиши "ЭТИКЕТКА СТЕРТА", если этикетка пустая.\n`;
                consoleOutput += `Луи: Помоги мне, возьми этикетку labels и сделай ее шрифт прописным, либо пометь как "ЭТИКЕТКА СТЕРТА".\n`;
            } else if (currentLevelData.id === '6.4') {
                consoleOutput += `\n> Луи: Жюри хочется проверить маркировки, но кто-то на кухне пошутил!`;
		consoleOutput += `\n> Луи: Почти все маркировки были изменены на 2126! Срочно поменяй их на 2026 и сдай отчет им!`;
		consoleOutput += `\n> Луи: Используй переменную marking где они записаны, и если там 2126 год, замени на 2026.`;
		consoleOutput += `\n> Луи: Их много, так что используй подходящуюю функцию.`;
                consoleOutput += `\n> Луи: Если там вообще странный год, напиши "ДОП. ПРОВЕРКА", чтобы шеф сам посмотрел.\n`;
            } else if (currentLevelData.id === '6.5') {
                consoleOutput += `\n> Луи: Жюри выставило новое правила, что названия блюд должны быть не длиннее 10 символов.\n`;
		consoleOutput += `\n> Луи: Я буду передавать тебе названия конкурентов через переменную names, а ты проверяй! \n`;
		consoleOutput += `\n> Луи: Используй функцию подсчета длины! Надо делать это очень быстро!\n`;
            } else if (currentLevelData.id === '6.6') {
                consoleOutput += `\n> Луи: Принтер маркировок сломался и вместо некоторых символов на маркировках печатал "⬛" \n`;
                consoleOutput += `\n> Луи: Проверь маркировки из переменной marking_label посимвольно, и если встретишь ошибку печати, сразу говори "Перепечатать", иначе помечай ее как "Нормальная".\n`;
            } else if (currentLevelData.id === '6.7') {
                consoleOutput += `\n> Луи: Вот список ингредиентов со сбитым регистром:\n`;
                consoleOutput += `ingredients_list\n`;
                consoleOutput += `\n> Луи: Нужно привести все к верхнему регистру, затем проверить наличие помидоров и отсутствие базилика.\n`;
            } else if (currentLevelData.id === '6.8') {
                consoleOutput += `\n> Луи: Вот маркировка для проверки:\n`;
    		consoleOutput += `bug_marking\n`;
    		consoleOutput += `\n> Луи: Проверь каждый символ: если это буква - "Неверно", цифра - "Верно", иначе - "Ошибка".\n`;
            } else if (currentLevelData.id === '6.9') {
                consoleOutput += `\n> Луи: Вот рецепт в виде списка: orders\n`;
    		consoleOutput += `\n> Луи: Список занимает много памяти и принтер не может его нормально обработать.\n`;
    		consoleOutput += `> Луи: Преобразуй его в строку с помощью .join(), чтобы получилась единая строка, где ингредиенты разделены плюсом.\n`;
    		consoleOutput += `> Луи: Так мы сможем дальше работать с ним как с обычным текстом и использовать все строковые методы!\n`;
            } else {
                // Для остальных уровней выводим все переменные, кроме n
                consoleOutput += `\n> Луи: Вот данные для задания:\n`;
                Object.keys(pythonVariables).forEach(key => {
                    if (key !== 'n') {
                        const value = pythonVariables[key];
                        if (Array.isArray(value)) {
                            consoleOutput += `${key} = ${JSON.stringify(value)}\n`;
                        } else {
                            consoleOutput += `${key} = ${value}\n`;
                        }
                    }
                });
            }
            
            consoleOutput += `\nИспользуй эти переменные в своём коде!\n`;
            
            updateOutputDisplay();
            messageElement.textContent = `Луи выдал данные для задания. Проверь консоль!`; 
            
            return true;
        } else {
            messageElement.textContent = `Луи ждет команду "Данные кухни".`;
            return false;
        }
    }

    const sourceEntity = currentLevelData.entities.find(e => e.name_en === 'keeper');
    if (sourceEntity && checkCollision(playerX, playerY, sourceEntity)) {
        if (normalizedPrintedText === 'спросить') {
            if (!passwordCheckPassed) {
                // Показываем модальное окно с вопросом
                showQuestionModal();
                messageElement.textContent = "Марио: Сначала ответь на мой вопрос!";
            } else {
                // Если уже прошел проверку, просто сообщаем что уже дал пароль
                const greeting = currentLevelData.requiredGreeting;
                consoleOutput += `\n> Марио (Шеф): Я уже дал тебе Приветственное Слово: ${greeting}\n`;
                updateOutputDisplay();
                messageElement.textContent = `Марио: Я уже дал тебе Приветственное Слово. Иди к Жюри.`;
            }
            return true;
        } else {
            messageElement.textContent = "Марио ждет, что ты спросишь его: 'Спросить'.";
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

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (background.complete) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    const levelData = currentLevelData;
    ctx.textAlign = 'center';

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

    if (levelData) {
        levelData.entities.forEach((entity, index) => {
            let sprite = null;
            let isSpriteLoaded = false;
            
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
            
            if (sprite && isSpriteLoaded) {
                const entityId = `${entity.name_en}_${index}`;
                const animation = getEntityAnimation(entityId);
                const currentFrame = animation.getCurrentFrame();
                
                const sx = currentFrame * FRAME_WIDTH;
                const sy = 0;
                
                ctx.drawImage(
                    sprite, 
                    sx, sy, FRAME_WIDTH, FRAME_HEIGHT,
                    entity.x, entity.y, PLAYER_SIZE, PLAYER_SIZE
                );
            }

            let nameTagText = entity.name_ru;
            const centerX = entity.x + PLAYER_SIZE / 2;

            drawTextWithBackground(
                nameTagText,
                centerX,
                entity.y - 25,
                'bold 13px "Century Gothic", sans-serif'
            );

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

function handleTeacherMode() { 
    if (prompt("Введите пароль учителя:") === TEACHER_PASSWORD) {
        const maxLevel = PART_6_LEVELS.length;
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
            messageElement.textContent = `Переход на уровень ${PART_6_LEVELS[targetLevelIndex].id} успешно выполнен.`;
        } else {
            messageElement.textContent = `Ошибка: Некорректный номер уровня. Доступны: 1-${maxLevel}.`;
        }
    } else {
        messageElement.textContent = "Неверный пароль учителя.";
    }
    return true; 
} 

function evaluateCondition(conditionText) {
    console.log(`[DEBUG evaluateCondition] Начало: "${conditionText}"`);
    
    // Удаляем внешние скобки
    while (conditionText.startsWith('(') && conditionText.endsWith(')')) {
        conditionText = conditionText.substring(1, conditionText.length - 1);
        console.log(`[DEBUG] Удалили внешние скобки: "${conditionText}"`);
    }
    
    
        // Обработка вызовов методов .isalpha() и .isdigit()
    const methodCallPattern = /([a-zA-Z_]\w*)(?:\[([^\]]+)\])?\.(isalpha|isdigit)\s*\(\s*\)/g;
    let match;
    while ((match = methodCallPattern.exec(conditionText)) !== null) {
        const varName = match[1];
        const indexExpr = match[2]; // может быть undefined
        const method = match[3];
        
        if (!pythonVariables.hasOwnProperty(varName)) {
            throw new Error(`Переменная ${varName} не определена для ${method}()`);
        }
        
        let strValue = pythonVariables[varName];
        if (typeof strValue !== 'string') {
            strValue = String(strValue);
        }
        
        // Если есть индекс, то берем символ по индексу
        if (indexExpr !== undefined) {
            // Вычисляем индекс
            let index;
            try {
                // Проверяем, является ли индекс переменной
                if (pythonVariables.hasOwnProperty(indexExpr)) {
                    index = pythonVariables[indexExpr];
                } else {
                    // Пробуем вычислить как число
                    index = Number(indexExpr);
                }
                
                if (typeof index !== 'number' || isNaN(index)) {
                    throw new Error(`Индекс должен быть числом, получено: ${indexExpr}`);
                }
                
                // Берем символ по индексу
                if (index >= 0 && index < strValue.length) {
                    strValue = strValue.charAt(index);
                } else {
                    strValue = ''; // Пустая строка для индекса вне границ
                }
            } catch (e) {
                throw new Error(`Ошибка при вычислении индекса [${indexExpr}]: ${e.message}`);
            }
        }
        
        let result;
        if (method === 'isalpha') {
            // Проверяем, является ли символ буквой (английской или русской)
            result = /^[A-Za-zА-Яа-я]$/.test(strValue);
            // Устанавливаем флаг для уровня 6.8
            if (currentLevelData && currentLevelData.id === '6.8') {
                currentExecutionFlags.usedIsAlpha = true;
                console.log("[DEBUG] Зафиксировано использование .isalpha() в условии для уровня 6.8");
            }
        } else if (method === 'isdigit') {
            // Проверяем, является ли символ цифрой
            result = /^\d$/.test(strValue);
            // Устанавливаем флаг для уровня 6.8
            if (currentLevelData && currentLevelData.id === '6.8') {
                currentExecutionFlags.usedIsDigit = true;
                console.log("[DEBUG] Зафиксировано использование .isdigit() в условии для уровня 6.8");
            }
        } else {
            throw new Error(`Неизвестный метод: ${method}`);
        }
        
        // Заменяем вызов метода на True или False (Python-стиль)
        conditionText = conditionText.replace(match[0], result ? 'True' : 'False');
        // Сбросим lastIndex, потому что мы изменили строку
        methodCallPattern.lastIndex = 0;
    }

    // Обработка len() для строк и переменных
    const lenPattern = /len\s*\(\s*['"]([^"']*)['"]\s*\)|len\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
    conditionText = conditionText.replace(lenPattern, (match, stringLiteral, variableName) => {
        console.log(`[DEBUG len] Обработка: ${match}, stringLiteral: ${stringLiteral}, variableName: ${variableName}`);
        let strValue;
        if (stringLiteral !== undefined) {
            strValue = stringLiteral;
        } else {
            if (pythonVariables.hasOwnProperty(variableName)) {
                const varValue = pythonVariables[variableName];
                if (typeof varValue === 'string') {
                    strValue = varValue;
                } else if (Array.isArray(varValue)) {
                    if (currentLevelData && (currentLevelData.id === '6.5' || currentLevelData.id === '6.6')) {
                        currentExecutionFlags.usedLen = true;
                        console.log("[DEBUG] Зафиксировано использование len() в условии для уровня", currentLevelData.id);
                    }
                    return varValue.length;
                } else {
                    strValue = String(varValue);
                }
            } else {
                throw new Error(`Переменная ${variableName} не определена для len()`);
            }
        }
        if (currentLevelData && (currentLevelData.id === '6.5' || currentLevelData.id === '6.6')) {
            currentExecutionFlags.usedLen = true;
            console.log("[DEBUG] Зафиксировано использование len() в условии для уровня", currentLevelData.id);
        }
        console.log(`[DEBUG len] Результат: ${strValue.length}`);
        return strValue.length;
    });
    
    // Специальная обработка для операторов in и not in
    // Сначала обрабатываем not in
    if (conditionText.includes(' not in ')) {
        const parts = conditionText.split(' not in ');
        if (parts.length === 2) {
            let left = parts[0].trim();
            let right = parts[1].trim();
            
            // Убираем кавычки если есть
            if ((left.startsWith("'") && left.endsWith("'")) || (left.startsWith('"') && left.endsWith('"'))) {
                left = left.substring(1, left.length - 1);
            } else if (pythonVariables.hasOwnProperty(left)) {
                left = pythonVariables[left];
            }
            
            if ((right.startsWith("'") && right.endsWith("'")) || (right.startsWith('"') && right.endsWith('"'))) {
                right = right.substring(1, right.length - 1);
            } else if (pythonVariables.hasOwnProperty(right)) {
                right = pythonVariables[right];
            }
            
            console.log(`[DEBUG not in] left: "${left}", right: "${right}"`);
            const result = !String(right).includes(String(left));
            console.log(`[DEBUG not in] Результат: ${result}`);
            return result;
        }
    }
    
    // Обрабатываем in
    if (conditionText.includes(' in ')) {
        const parts = conditionText.split(' in ');
        if (parts.length === 2) {
            let left = parts[0].trim();
            let right = parts[1].trim();
            
            // Убираем кавычки если есть
            if ((left.startsWith("'") && left.endsWith("'")) || (left.startsWith('"') && left.endsWith('"'))) {
                left = left.substring(1, left.length - 1);
            } else if (pythonVariables.hasOwnProperty(left)) {
                left = pythonVariables[left];
            }
            
            if ((right.startsWith("'") && right.endsWith("'")) || (right.startsWith('"') && right.endsWith('"'))) {
                right = right.substring(1, right.length - 1);
            } else if (pythonVariables.hasOwnProperty(right)) {
                right = pythonVariables[right];
            }
            
            console.log(`[DEBUG in] left: "${left}", right: "${right}"`);
            const result = String(right).includes(String(left));
            console.log(`[DEBUG in] Результат: ${result}`);
            return result;
        }
    }
    
    console.log(`[DEBUG evaluateCondition] После обработки методов: "${conditionText}"`);
    
    // Теперь преобразуем Python-стиль в JavaScript-стиль
    let jsCondition = conditionText;
    
    // Заменяем Python True/False на JavaScript true/false
    jsCondition = jsCondition.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    
    // Заменяем операторы
    jsCondition = jsCondition.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
    
    // Обрабатываем переменные и строки
    jsCondition = jsCondition.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
        if (stringLiteralSingle !== undefined) {
            return `'${stringLiteralSingle}'`;
        }
        if (stringLiteralDouble !== undefined) {
            return `'${stringLiteralDouble}'`;
        }

        // Пропускаем JavaScript булевы значения
        if (variableName === 'true' || variableName === 'false') {
            return variableName;
        }

        if (pythonVariables.hasOwnProperty(variableName)) {
            currentExecutionFlags.usedLevelVariable = true;

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

        // Если это число, возвращаем как есть
        if (!isNaN(variableName)) {
            return variableName;
        }

        throw new Error(`Переменная ${variableName} не определена.`);
    });

    console.log(`[DEBUG evaluateCondition] JS условие: "${jsCondition}"`);
    
    try {
        const evaluated = eval(jsCondition);
        console.log(`[DEBUG evaluateCondition] Результат eval: ${evaluated}`);
        return !!evaluated;
    } catch (e) {
        consoleOutput += `[Ошибка условия] Не удалось вычислить условие: ${conditionText}. Ошибка: ${e.message}\n`;
        outputDisplay.innerHTML = consoleOutput.replace(/\n/g, '<br>');
        messageElement.textContent = `Ошибка в условии: ${e.message}`;
        throw new Error("Condition Error");
    }
}

let whileLoopStack = []; 
let forLoopStack = [];
let isBreakingLoop = false;
let isContinuingLoop = false;

function resetGameExecutionState() {
    isSkippingBlock = false;
    currentBlockIndentation = 0;
    ifConditionMetInBlock = false;
    currentExecutionFlags.isConditional = false;
    currentExecutionFlags.usedLevelVariable = false;
    currentExecutionFlags.usedIf = false;      // НОВОЕ
    currentExecutionFlags.usedLower = false; 
    currentExecutionFlags.usedReplace = false;
    currentExecutionFlags.usedUpper = false;
    currentExecutionFlags.usedIsAlpha = false;
    currentExecutionFlags.usedIsDigit = false;
    currentExecutionFlags.usedCount = false;
    currentExecutionFlags.usedJoin = false;
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
        const stringMultiplyPattern = /(['"])(.*?)\1\s*\*\s*(.+)|(.+)\s*\*\s*(['"])(.*?)\5/;
        const match = expression.match(stringMultiplyPattern);
        
        if (match) {
            let str, numExpr;
            
            if (match[1]) {
                str = match[2];
                numExpr = match[3];
            } else {
                str = match[6];
                numExpr = match[4];
            }
            
            numExpr = numExpr.replace(/([a-zA-Z_]\w*)/g, (match, varName) => {
                if (pythonVariables.hasOwnProperty(varName)) {
                    const val = pythonVariables[varName];
                    return typeof val === 'string' ? `'${val}'` : val;
                }
                return match;
            });
            
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
            // Обработка строковых методов
            const isArithmeticOrNumber = /[+\-*/%]/.test(expression) || /^\d+(\.\d+)?$/.test(expression); 
            
            // Проверяем, есть ли в выражении вызов метода строки
            const hasStringMethod = /\.(upper|lower|replace|isdigit|isalpha|split|join)\(/.test(expression);
	    const hasInOperator = /\s+in\s+/.test(expression) || /\s+not\s+in\s+/.test(expression);
            
            if (hasStringMethod || hasInOperator) {
                // Используем логику из handlePrintForEntity для вычисления строковых методов
                // Временно создаем функцию evaluateExpression для обработки
                const evaluateExpressionForAssignment = (expr) => {
                    console.log(`[EVAL_ASSIGN] Обработка выражения: ${expr}`);
                    
                    // Функция для обработки всех строковых методов
                    const processStringMethods = (expr) => {
                        console.log(`[STRING_METHODS_ASSIGN] Обработка: ${expr}`);
                        let result = expr;
                        
                        // 1. Обработка .upper()
                        const upperPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.upper\s*\(\s*\)/gi;
                        let match;
                        
                        while ((match = upperPattern.exec(expr)) !== null) {
                            const target = match[1];
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .upper()`);
                            }
                            
                            const upperStr = strValue.toUpperCase();
                            result = result.replace(match[0], `'${upperStr}'`);
                            console.log(`[UPPER_ASSIGN] ${target}.upper() = "${upperStr}"`);
                            
                            // Устанавливаем флаг для уровня 6.7
                            if (currentLevelData && currentLevelData.id === '6.7') {
                                currentExecutionFlags.usedUpper = true;
                                console.log("[DEBUG] Зафиксировано использование .upper() для уровня 6.7");
                            }
                        }
                        
                        // 2. Обработка .lower()
                        const lowerPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.lower\s*\(\s*\)/gi;
                        while ((match = lowerPattern.exec(expr)) !== null) {
                            const target = match[1];
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .lower()`);
                            }
                            
                            const lowerStr = strValue.toLowerCase();
                            result = result.replace(match[0], `'${lowerStr}'`);
                            console.log(`[LOWER_ASSIGN] ${target}.lower() = "${lowerStr}"`);
                            
                            if (currentLevelData && currentLevelData.id === '6.3') {
                                currentExecutionFlags.usedLower = true;
                                console.log("[DEBUG] Зафиксировано использование .lower() для уровня 6.3");
                            }
                        }
                        
                        // 3. Обработка .replace('старое', 'новое')
                        const replacePattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.replace\s*\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/gi;
                        while ((match = replacePattern.exec(expr)) !== null) {
                            const target = match[1];
                            const oldStr = match[2];
                            const newStr = match[3];
                            
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .replace()`);
                            }
                            
                            const replacedStr = strValue.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
                            result = result.replace(match[0], `'${replacedStr}'`);
                            console.log(`[REPLACE_ASSIGN] ${target}.replace("${oldStr}", "${newStr}") = "${replacedStr}"`);
                            
                            if (currentLevelData && currentLevelData.id === '6.4') {
                                currentExecutionFlags.usedReplace = true;
                                console.log("[DEBUG] Зафиксировано использование .replace() для уровня 6.4");
                            }
                        }
                        
                        // 4. Обработка .isdigit()
                        const isdigitPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.isdigit\s*\(\s*\)/gi;
                        while ((match = isdigitPattern.exec(expr)) !== null) {
                            const target = match[1];
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .isdigit()`);
                            }
                            
                            const isDigit = /^\d+$/.test(strValue);
                            result = result.replace(match[0], isDigit ? 'True' : 'False');
                            console.log(`[ISDIGIT_ASSIGN] ${target}.isdigit() = ${isDigit}`);
                            
                            if (currentLevelData && currentLevelData.id === '6.8') {
                                currentExecutionFlags.usedIsDigit = true;
                                console.log("[DEBUG] Зафиксировано использование .isdigit() для уровня 6.8");
                            }
                        }
                        
                        // 5. Обработка .isalpha()
                        const isalphaPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.isalpha\s*\(\s*\)/gi;
                        while ((match = isalphaPattern.exec(expr)) !== null) {
                            const target = match[1];
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .isalpha()`);
                            }
                            
                            const isAlpha = /^[A-Za-zА-Яа-я]+$/.test(strValue);
                            result = result.replace(match[0], isAlpha ? 'True' : 'False');
                            console.log(`[ISALPHA_ASSIGN] ${target}.isalpha() = ${isAlpha}`);
                            
                            if (currentLevelData && currentLevelData.id === '6.8') {
                                currentExecutionFlags.usedIsAlpha = true;
                                console.log("[DEBUG] Зафиксировано использование .isalpha() для уровня 6.8");
                            }
                        }
                        
                        // 6. Обработка .split('разделитель')
                        const splitPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.split\s*\(\s*['"]([^'"]*)['"]\s*\)/gi;
                        while ((match = splitPattern.exec(expr)) !== null) {
                            const target = match[1];
                            const delimiter = match[2];
                            
                            let strValue;
                            
                            if ((target.startsWith("'") && target.endsWith("'")) || 
                                (target.startsWith('"') && target.endsWith('"'))) {
                                strValue = target.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(target)) {
                                const varValue = pythonVariables[target];
                                if (typeof varValue === 'string') {
                                    strValue = varValue;
                                } else {
                                    strValue = String(varValue);
                                }
                            } else {
                                throw new Error(`Переменная ${target} не определена для .split()`);
                            }
                            
                            const splitArray = strValue.split(delimiter);
                            result = result.replace(match[0], JSON.stringify(splitArray));
                            console.log(`[SPLIT_ASSIGN] ${target}.split("${delimiter}") = ${JSON.stringify(splitArray)}`);
                        }
                        
                        // 7. Обработка len()
                        const lenPattern = /len\s*\(\s*['"]([^"']*)['"]\s*\)|len\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi;
                        let lenMatch;
                        while ((lenMatch = lenPattern.exec(result)) !== null) {
                            let strValue;
                            if (lenMatch[1] !== undefined) {
                                strValue = lenMatch[1];
                            } else {
                                const varName = lenMatch[2];
                                if (pythonVariables.hasOwnProperty(varName)) {
                                    const varValue = pythonVariables[varName];
                                    if (typeof varValue === 'string') {
                                        strValue = varValue;
                                    } else if (Array.isArray(varValue)) {
                                        const len = varValue.length;
                                        result = result.replace(lenMatch[0], len);
                                        currentExecutionFlags.usedLen = true;
                                        console.log("[LEN_ASSIGN] len(" + varName + ") = " + len + " (массив)");
                                        lenPattern.lastIndex = 0;
                                        continue;
                                    } else {
                                        strValue = String(varValue);
                                    }
                                } else {
                                    throw new Error(`Переменная ${varName} не определена для len()`);
                                }
                            }
                            const length = strValue.length;
                            result = result.replace(lenMatch[0], length);
                            currentExecutionFlags.usedLen = true;
                            console.log("[LEN_ASSIGN] len(" + (lenMatch[1] ? `"${lenMatch[1]}"` : lenMatch[2]) + ") = " + length);
                            lenPattern.lastIndex = 0;
                        }
                        
                        // 8. Обработка .join(разделитель)
                        const joinPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\.join\s*\(\s*([^)]+)\s*\)/gi;
                        while ((match = joinPattern.exec(expr)) !== null) {
                            const delimiter = match[1];
                            const arrayExpr = match[2];
                            
                            let delimiterStr;
                            
                            if ((delimiter.startsWith("'") && delimiter.endsWith("'")) || 
                                (delimiter.startsWith('"') && delimiter.endsWith('"'))) {
                                delimiterStr = delimiter.slice(1, -1);
                            } else if (pythonVariables.hasOwnProperty(delimiter)) {
                                const varValue = pythonVariables[delimiter];
                                if (typeof varValue === 'string') {
                                    delimiterStr = varValue;
                                } else {
                                    delimiterStr = String(varValue);
                                }
                            } else {
                                throw new Error(`Разделитель ${delimiter} не определен для .join()`);
                            }
                            
                            let arrayValue;
                            try {
                                const processedArrayExpr = arrayExpr.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_]\w*)/g, 
                                    (m, single, double, varName) => {
                                        if (single !== undefined) return `"${single}"`;
                                        if (double !== undefined) return `"${double}"`;
                                        if (pythonVariables.hasOwnProperty(varName)) {
                                            const val = pythonVariables[varName];
                                            if (Array.isArray(val)) {
                                                return JSON.stringify(val);
                                            }
                                            return typeof val === 'string' ? `"${val}"` : val;
                                        }
                                        return m;
                                    });
                                
                                if (processedArrayExpr.startsWith('[') && processedArrayExpr.endsWith(']')) {
                                    try {
                                        arrayValue = JSON.parse(processedArrayExpr);
                                    } catch (e) {
                                        throw new Error(`Неверный формат списка: ${arrayExpr}`);
                                    }
                                } else {
                                    const varMatch = arrayExpr.match(/^([a-zA-Z_]\w*)$/);
                                    if (varMatch && pythonVariables.hasOwnProperty(varMatch[1])) {
                                        const val = pythonVariables[varMatch[1]];
                                        if (Array.isArray(val)) {
                                            arrayValue = val;
                                        } else {
                                            throw new Error(`Переменная ${varMatch[1]} не является списком`);
                                        }
                                    } else {
                                        throw new Error(`Неверный формат списка для .join(): ${arrayExpr}`);
                                    }
                                }
                            } catch (error) {
                                throw new Error(`Ошибка в .join(): ${error.message}`);
                            }
                            
                            if (!Array.isArray(arrayValue)) {
                                throw new Error(`Ожидается список для .join(), получено: ${typeof arrayValue}`);
                            }
                            
                            const joinedStr = arrayValue.join(delimiterStr);
                            result = result.replace(match[0], `'${joinedStr}'`);
                            console.log(`[JOIN_ASSIGN] ${delimiter}.join(${JSON.stringify(arrayValue)}) = "${joinedStr}"`);
			    if (currentLevelData && currentLevelData.id === '6.9') {
    				currentExecutionFlags.usedJoin = true;
    				console.log("[DEBUG] Зафиксировано использование .join() для уровня 6.9");
			    }
                        }
			// 9. Обработка оператора in
			const inPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\s+in\s+(['"][^"']*["']|[a-zA-Z_]\w*)/gi;
			while ((match = inPattern.exec(expr)) !== null) {
    				const left = match[1];
    				const right = match[2];
    
    				let leftValue, rightValue;
    
    				// Получаем левое значение
    				if ((left.startsWith("'") && left.endsWith("'")) || 
        				(left.startsWith('"') && left.endsWith('"'))) {
        				leftValue = left.slice(1, -1);
    				} else if (pythonVariables.hasOwnProperty(left)) {
        				const varValue = pythonVariables[left];
        				leftValue = typeof varValue === 'string' ? varValue : String(varValue);
    				} else {
        				throw new Error(`Переменная ${left} не определена для оператора in`);
    				}
    
    				// Получаем правое значение
    				if ((right.startsWith("'") && right.endsWith("'")) || 
        				(right.startsWith('"') && right.endsWith('"'))) {
        				rightValue = right.slice(1, -1);
    				} else if (pythonVariables.hasOwnProperty(right)) {
        				const varValue = pythonVariables[right];
        				rightValue = typeof varValue === 'string' ? varValue : String(varValue);
    				} else {
        				throw new Error(`Переменная ${right} не определена для оператора in`);
    				}
    
    				const result = rightValue.includes(leftValue) ? 'True' : 'False';
    				expr = expr.replace(match[0], result);
    				inPattern.lastIndex = 0; // Сбросить индекс поиска
			}

			// 10. Обработка оператора not in
			const notInPattern = /(['"][^"']*["']|[a-zA-Z_]\w*)\s+not\s+in\s+(['"][^"']*["']|[a-zA-Z_]\w*)/gi;
			while ((match = notInPattern.exec(expr)) !== null) {
    				const left = match[1];
    				const right = match[2];
    
    				let leftValue, rightValue;
    
    				// Получаем левое значение
    				if ((left.startsWith("'") && left.endsWith("'")) || 
        				(left.startsWith('"') && left.endsWith('"'))) {
        				leftValue = left.slice(1, -1);
    				} else if (pythonVariables.hasOwnProperty(left)) {
        				const varValue = pythonVariables[left];
        				leftValue = typeof varValue === 'string' ? varValue : String(varValue);
    				} else {
        				throw new Error(`Переменная ${left} не определена для оператора not in`);
    				}
    
    				// Получаем правое значение
    				if ((right.startsWith("'") && right.endsWith("'")) || 
        				(right.startsWith('"') && right.endsWith('"'))) {
        				rightValue = right.slice(1, -1);
    				} else if (pythonVariables.hasOwnProperty(right)) {
        				const varValue = pythonVariables[right];
        				rightValue = typeof varValue === 'string' ? varValue : String(varValue);
    				} else {
        				throw new Error(`Переменная ${right} не определена для оператора not in`);
    				}
    
    				const result = rightValue.includes(leftValue) ? 'False' : 'True';
    				expr = expr.replace(match[0], result);
    				notInPattern.lastIndex = 0; // Сбросить индекс поиска
			}
                        
                        return result;
                    };
                    
                    let processed = processStringMethods(expr);
                    console.log(`[EVAL_ASSIGN] После обработки методов: ${processed}`);
                    
                    // Заменяем переменные и строковые литералы
                    processed = processed.replace(/'([^']*)'|"([^"]*)"|([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, stringLiteralSingle, stringLiteralDouble, variableName) => {
                        if (stringLiteralSingle !== undefined) return `'${stringLiteralSingle}'`;
                        if (stringLiteralDouble !== undefined) return `'${stringLiteralDouble}'`;
                        if (pythonVariables.hasOwnProperty(variableName)) {
                            const varValue = pythonVariables[variableName];
                            return typeof varValue === 'string' ? `'${varValue}'` : varValue;
                        }
                        throw new Error(`Переменная ${variableName} не определена.`);
                    });

                    console.log(`[EVAL_ASSIGN] После замены переменных: ${processed}`);

                    // Обработка умножения строк
                    const processStringMultiplication = (expr) => {
                        const stringMultiplyPattern = /(['"])(.*?)\1\s*\*\s*(.+)|(.+)\s*\*\s*(['"])(.*?)\5/g;
                        let result = expr;
                        let match;
                        
                        while ((match = stringMultiplyPattern.exec(expr)) !== null) {
                            let str, numExpr;
                            
                            if (match[1]) {
                                str = match[2];
                                numExpr = match[3];
                            } else {
                                str = match[6];
                                numExpr = match[4];
                            }
                            
                            let num;
                            try {
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

                    processed = processStringMultiplication(processed);
                    console.log(`[EVAL_ASSIGN] После умножения строк: ${processed}`);

                    // Разбиваем на части по + и вычисляем
                    const parts = processed.split(/\s*\+\s*/);
                    if (parts.length > 1) {
                        let result = '';
                        for (let part of parts) {
                            if ((part.startsWith("'") && part.endsWith("'")) || 
                                (part.startsWith('"') && part.endsWith('"'))) {
                                result += part.slice(1, -1);
                            } else {
                                try {
                                    const evalPart = part.replace(/True/g, 'true')
                                        .replace(/False/g, 'false')
                                        .replace(/and/g, '&&')
                                        .replace(/or/g, '||')
                                        .replace(/not/g, '!');
                                    
                                    const value = eval(evalPart);
                                    result += String(value);
                                } catch (e) {
                                    result += part;
                                }
                            }
                        }
                        console.log(`[EVAL_ASSIGN] Результат конкатенации: ${result}`);
                        return result;
                    } else {
                        const evalExpr = processed.replace(/True/g, 'true')
                            .replace(/False/g, 'false')
                            .replace(/and/g, '&&')
                            .replace(/or/g, '||')
                            .replace(/not/g, '!');
                        
                        const value = eval(evalExpr);
                        const result = typeof value === 'string' ? value : String(value);
                        console.log(`[EVAL_ASSIGN] Результат вычисления: ${result}`);
                        return result;
                    }
                };
                
                value = evaluateExpressionForAssignment(expression);
            } else {
                // Обычное выражение без строковых методов
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
                
                value = eval(evaluatedExpression);

                if (isArithmeticOrNumber && !isNaN(Number(value)) && value !== '') {
                    value = Number(value);
                }
            }
        }

    } catch (error) {
        messageElement.textContent = `Ошибка присвоения: Некорректное выражение: ${expression} (Подробности: ${error.message})`;
        return false;
    }

    pythonVariables[varName] = value;
    
    const displayValue = typeof value === 'string' ? `'${value}'` : value;
    messageElement.textContent = `Переменной ${varName} присвоено значение.`;
    return true;
}

function parseForLoop(line) {
    // Обрабатываем range(len(переменная))
    const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(len\s*\(\s*\w+\s*\)|\d+|\w+)(?:\s*,\s*(len\s*\(\s*\w+\s*\)|\d+|\w+))?(?:\s*,\s*(len\s*\(\s*\w+\s*\)|\d+|\w+))?\s*\)\s*:$/);
    if (!forMatch) return null;

    const varName = forMatch[1];
    
    // Функция для вычисления значения (число, переменная или len(переменная))
    const parseRangeValue = (expr) => {
        if (!expr || expr === '') return undefined;
        
        // Проверяем на len(переменная)
        const lenMatch = expr.match(/len\s*\(\s*(\w+)\s*\)/);
        if (lenMatch) {
            const varName = lenMatch[1];
            if (pythonVariables.hasOwnProperty(varName)) {
                const value = pythonVariables[varName];
                if (typeof value === 'string') {
                    // Устанавливаем флаг usedLen
                    if (currentLevelData && (currentLevelData.id === '6.5' || currentLevelData.id === '6.6')) {
                        currentExecutionFlags.usedLen = true;
                        console.log("[DEBUG] Зафиксировано использование len() в range для уровня", currentLevelData.id);
                    }
                    return value.length;
                } else if (Array.isArray(value)) {
                    if (currentLevelData && (currentLevelData.id === '6.5' || currentLevelData.id === '6.6')) {
                        currentExecutionFlags.usedLen = true;
                        console.log("[DEBUG] Зафиксировано использование len() в range для уровня", currentLevelData.id);
                    }
                    return value.length;
                }
                return String(value).length;
            } else {
                throw new Error(`Переменная ${varName} не определена в len()`);
            }
        }
        
        // Проверяем на число
        if (!isNaN(expr)) {
            return parseInt(expr);
        }
        
        // Проверяем на переменную
        if (pythonVariables.hasOwnProperty(expr)) {
            const value = pythonVariables[expr];
            if (typeof value === 'number') {
                return value;
            }
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                return numValue;
            }
            throw new Error(`Переменная ${expr} не является числом`);
        }
        
        throw new Error(`Некорректное выражение в range: ${expr}`);
    };
    
    let start, end, step;
    
    // Определяем количество аргументов range
    if (forMatch[3] === undefined && forMatch[4] === undefined) {
        // range(len(var)) или range(число)
        start = 0;
        end = parseRangeValue(forMatch[2]);
        step = 1;
    } else if (forMatch[4] === undefined) {
        // range(start, end) или range(start, len(var))
        start = parseRangeValue(forMatch[2]);
        end = parseRangeValue(forMatch[3]);
        step = 1;
    } else {
        // range(start, end, step)
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
    } else {
        lastPrintedResult = null;
        printedExpression = null;
        resetGameExecutionState();
        window.wasForLoopExecuted = false;
        wasForLoopExecuted = false;
        consoleOutput += "\n--- Выполнение кода ---\n";
        console.log(`[DEBUG executeCode] Запуск выполнения кода, переменные:`, pythonVariables);
        window.consoleOutputBuffer = "";
        
        if (currentLevelData && currentLevelData.id === '6.1' && currentLevelData.initialVariables) {
            pythonVariables = { ...currentLevelData.initialVariables };
        } else {
            const levelVariables = {};
            if (currentLevelData && currentLevelData.levelVariable) {
                levelVariables[currentLevelData.levelVariable] = pythonVariables[currentLevelData.levelVariable];
            }
            pythonVariables = { 'n': 1, ...levelVariables };
        }
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
        
        const isElse = trimmedLine.startsWith('else:');
        const isElif = trimmedLine.startsWith('elif ') || trimmedLine.startsWith('elif(');
        const isIf = trimmedLine.startsWith('if ') || trimmedLine.startsWith('if(');
        const isWhile = trimmedLine.startsWith('while ') || trimmedLine.startsWith('while(');
        const isFor = /^for\s+\w+\s+in\s+range\s*\(/.test(trimmedLine);
        
        const isControlFlowOperator = isElse || isElif || isIf || isWhile || isFor;

        // Обработка движения (для совместимости)
        if (trimmedLine.includes('move = int(input())')) {
            const steps = prompt("move = int(input()): Введите количество шагов:");
            if (!fakeMoveInput(parseInt(steps))) return;
            continue;
        } else if (trimmedLine.includes('turn = input()')) {
            const newDirection = prompt("turn = input(): Введите направление (вправо, влево, вверх, вниз):");
            if (!fakeTurnInput(newDirection)) return;
            continue;
        }
        
        // Обработка break/continue
        if (!isSkippingBlock) {
            if (trimmedLine === 'break') {
                if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
                    isBreakingLoop = true;
                    continue;
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'break' вне цикла.`;
                    return;
                }
            } else if (trimmedLine === 'continue') {
                if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
                    isContinuingLoop = true;
                    continue;
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'continue' вне цикла.`;
                    return;
                }
            }
        }
        
        // ВАЖНОЕ ИСПРАВЛЕНИЕ: Правильная обработка выхода из блоков
        let needsForcedExit = false;
        if (lineIndentation < currentBlockIndentation) {
            needsForcedExit = true;
        }

        // Если выходим из блока или есть break/continue
        if (lineIndentation < currentBlockIndentation || isBreakingLoop || isContinuingLoop || needsForcedExit) {
            let poppedBlock;
            let jumpedBack = false;

            const parentBlock = controlFlowStack[controlFlowStack.length - 1];
            const isElseOrElifOnSameLevel = (isElse || isElif) && parentBlock && parentBlock.type === 'if' && parentBlock.indentation === lineIndentation;
            
            if (!isElseOrElifOnSameLevel) {
                // Обработка continue
                if (isContinuingLoop && (whileLoopStack.length > 0 || forLoopStack.length > 0)) {
                    const currentLoop = whileLoopStack.length > 0 ? whileLoopStack[whileLoopStack.length - 1] : forLoopStack[forLoopStack.length - 1];
                    if (currentLoop) {
                        isContinuingLoop = false;
                        i = currentLoop.startLineIndex;
                        jumpedBack = true;
                    }
                }
                
                // Выходим из блоков
                while (controlFlowStack.length > 1 && lineIndentation <= controlFlowStack[controlFlowStack.length - 1].indentation) {
                    poppedBlock = controlFlowStack[controlFlowStack.length - 1];
                    
                    // Если это цикл
                    if (poppedBlock.type === 'while' || poppedBlock.type === 'for') {
                        const loopStack = poppedBlock.type === 'while' ? whileLoopStack : forLoopStack;
                        
                        if (loopStack.length === 0) {
                            controlFlowStack.pop();
                            continue;
                        }
                        
                        const currentLoopState = loopStack[loopStack.length - 1];
                        
                        if (!currentLoopState) {
                            controlFlowStack.pop();
                            continue;
                        }
                        
                        // Обработка break
                        if (isBreakingLoop) {
                            isBreakingLoop = false;
                            controlFlowStack.pop();
                            loopStack.pop();
                            break;
                        }
                        
                        let shouldRepeat = false;
                        
                        // Проверяем условие продолжения цикла
                        if (poppedBlock.type === 'while') {
                            try {
                                shouldRepeat = evaluateCondition(currentLoopState.condition);
                            } catch(e) {
                                messageElement.textContent = `Ошибка в условии цикла WHILE: ${e.message}`;
                                return;
                            }
                        } else {
                            // ДЛЯ ЦИКЛА FOR: сначала увеличиваем счетчик, потом проверяем
                            currentLoopState.current += currentLoopState.step;
                            pythonVariables[currentLoopState.varName] = currentLoopState.current;
                            shouldRepeat = currentLoopState.current < currentLoopState.end;
                        }
                        
                        if (shouldRepeat) {
                            i = currentLoopState.startLineIndex;
                            isReturningToLoopBody = true;
                            jumpedBack = true;
                            break;
                        } else {
                            // Цикл завершен
                            controlFlowStack.pop();
                            loopStack.pop();
                        }
                    } else {
                        // Для нецикловых блоков
                        controlFlowStack.pop();
                    }
                    
                    if (jumpedBack) break;
                }
                
                if (jumpedBack) {
                    continue;
                }
                
                // Обновляем состояние после выхода из блоков
                const updatedParentBlock = controlFlowStack[controlFlowStack.length - 1];
                
                if (updatedParentBlock.type !== 'if' && updatedParentBlock.type !== 'while' && updatedParentBlock.type !== 'for') {
                    if (lineIndentation === 0 && !isElse && !isElif) {
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
                
                if (lineIndentation !== currentBlockIndentation) {
                    continue;
                }
            }
        }
        
        // Обработка операторов управления
        if (isIf || isElif || isElse || isWhile || isFor) {
            if (!trimmedLine.endsWith(':')) {
                messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Ожидается двоеточие (:) в конце оператора.`;
                return;
            }
            
            // Обработка возврата в тело цикла
            if ((isWhile || isFor) && isReturningToLoopBody) {
                isReturningToLoopBody = false;
                let shouldExecuteBlock = false;
                
                if (isWhile) {
                    const currentWhile = whileLoopStack[whileLoopStack.length - 1];
                    if (currentWhile) {
                        try {
                            shouldExecuteBlock = evaluateCondition(currentWhile.condition);
                        } catch(e) {
                            messageElement.textContent = `Ошибка в условии цикла WHILE: ${e.message}`;
                            return;
                        }
                    }
                } else {
                    const currentFor = forLoopStack[forLoopStack.length - 1];
                    if (currentFor) {
                        shouldExecuteBlock = currentFor.current < currentFor.end;
                        // Обновляем переменную цикла
                        if (shouldExecuteBlock) {
                            pythonVariables[currentFor.varName] = currentFor.current;
                        }
                    }
                }
                
                isSkippingBlock = !shouldExecuteBlock;
                currentBlockIndentation = lineIndentation + 4;
                
                // Обновляем состояние блока в стеке
                if (controlFlowStack.length > 0) {
                    const currentBlock = controlFlowStack[controlFlowStack.length - 1];
                    currentBlock.isSkipping = isSkippingBlock;
                }
                continue;
            }
            
            // Определяем, нужно ли выполнять блок
            let shouldExecuteBlock = false;
            let conditionText = '';
            let blockType = 'if';
            
            const currentLevel = controlFlowStack[controlFlowStack.length - 1];
            const isRootLevel = controlFlowStack.length === 1;
            const isNewNestedBlock = lineIndentation > currentLevel.indentation || (isRootLevel && lineIndentation === 0);
            const containerSkipping = isNewNestedBlock 
                ? currentLevel.isSkipping 
                : (controlFlowStack.length > 1 ? controlFlowStack[controlFlowStack.length - 2].isSkipping : false);
            
            if (containerSkipping && lineIndentation > 0) {
                shouldExecuteBlock = false;
            } else if (isIf) {
                conditionText = trimmedLine.replace(/^if\s+/, '').replace(/\s*:\s*$/, '').trim();
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    ifConditionMetInBlock = shouldExecuteBlock;
                    updateIfChainState(lineIndentation, shouldExecuteBlock);
                    if (currentLevelData && (currentLevelData.id === '6.3' || currentLevelData.id === '6.4' || currentLevelData.id === '6.5' || currentLevelData.id === '6.6' || currentLevelData.id === '6.7' || currentLevelData.id === '6.8')) {
                        currentExecutionFlags.usedIf = true;
                    }
		    // ДОБАВИТЬ: Вывод отладки для проверки условия
            	    console.log(`[DEBUG] Условие if: "${conditionText}" = ${conditionResult}`);
            	    console.log(`[DEBUG] Переменные:`, pythonVariables);
                } catch (e) {
                    // ИЗМЕНИТЬ: Не return, а пропустить блок
            	    console.log(`[DEBUG] Ошибка в условии if: ${e.message}`);
            	    shouldExecuteBlock = false;
            	    ifConditionMetInBlock = false;
                }
                blockType = 'if';
            } else if (isElif) {
                if (!ifConditionMetInBlock) {
                    conditionText = trimmedLine.replace(/^elif\s+/, '').replace(/\s*:\s*$/, '').trim();
                    try {
                        const conditionResult = evaluateCondition(conditionText);
                        shouldExecuteBlock = conditionResult;
                        if (shouldExecuteBlock) {
                            ifConditionMetInBlock = true;
                        }
                        updateIfChainState(lineIndentation, shouldExecuteBlock);
                    } catch (e) {
                        return;
                    }
                } else {
                    shouldExecuteBlock = false;
                }
                blockType = 'if';
            } else if (isElse) {
                const parentBlock = controlFlowStack[controlFlowStack.length - 1];
                
                if (parentBlock && parentBlock.type === 'if' && parentBlock.indentation === lineIndentation) {
                    shouldExecuteBlock = !parentBlock.conditionMet && ifChainState.currentLevel === lineIndentation && !ifChainState.hasExecuted;
                    
                    if (shouldExecuteBlock) {
                        updateIfChainState(lineIndentation, true);
                    }
                    
                    blockType = 'if';
                } else {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: 'else' без соответствующего 'if'.`;
                    return;
                }
            } else if (isWhile) {
                conditionText = trimmedLine.replace(/^(while)\s*\(*/, '').replace(/\)*:$/, '').trim();
                blockType = 'while';
                try {
                    const conditionResult = evaluateCondition(conditionText);
                    shouldExecuteBlock = conditionResult;
                    
                    if (shouldExecuteBlock && isNewNestedBlock) {
                        const newWhile = {
                            indentation: lineIndentation,
                            condition: conditionText,
                            startLineIndex: i + 1, // Начинаем с следующей строки
                            ifElseState: { hasExecutedIf: false }
                        };
                        whileLoopStack.push(newWhile);
                    }
                } catch (e) {
                    return;
                }
                ifConditionMetInBlock = false;
            } else if (isFor) {
                const forLoopData = parseForLoop(trimmedLine);
                if (!forLoopData) {
                    messageElement.textContent = `Ошибка синтаксиса на строке ${i+1}: Некорректный формат цикла for. Ожидается: for переменная in range(...):`;
                    return;
                }

                blockType = 'for';
                if (currentLevelData && (currentLevelData.id === '6.6' || currentLevelData.id === '6.8')) {
                    currentExecutionFlags.usedFor = true;
                }
                
                shouldExecuteBlock = forLoopData.current < forLoopData.end;
                if (shouldExecuteBlock && !containerSkipping) wasForLoopExecuted = true;

                if (shouldExecuteBlock && isNewNestedBlock) {
                    pythonVariables[forLoopData.varName] = forLoopData.current;
                    
                    const newFor = {
                        indentation: lineIndentation,
                        varName: forLoopData.varName,
                        current: forLoopData.current,
                        end: forLoopData.end,
                        step: forLoopData.step,
                        startLineIndex: i + 1, // Начинаем с следующей строки
                        ifElseState: { hasExecutedIf: false }
                    };
                    forLoopStack.push(newFor);
                }
            }
            
            isSkippingBlock = containerSkipping || !shouldExecuteBlock;
            currentBlockIndentation = lineIndentation + 4;
            
            const newBlockState = {
                indentation: lineIndentation,
                conditionMet: blockType === 'if' ? ifConditionMetInBlock : false,
                isSkipping: isSkippingBlock,
                type: blockType,
                startLineIndex: i,
                condition: conditionText,
                ifChainExecuted: false
            };
            
            if (isNewNestedBlock) {
                controlFlowStack.push(newBlockState);
                ifConditionMetInBlock = shouldExecuteBlock;
            } else {
                controlFlowStack[controlFlowStack.length - 1] = newBlockState;
            }
            
            continue;
        }
        
        // Проверка вложенности
        if (currentBlockIndentation > 0 && lineIndentation !== currentBlockIndentation) {
            messageElement.textContent = `Ошибка вложенности на строке ${i+1}: Ожидается ${currentBlockIndentation} пробелов, найдено ${lineIndentation}.`;
            return;
        }

        // Пропускаем блок если нужно
        if (isSkippingBlock) {
            continue;
        }
        
        currentExecutionFlags.isConditional = (lineIndentation === currentBlockIndentation && currentBlockIndentation > 0);

        // Обработка обычных команд
        if (trimmedLine.startsWith('print')) {
            const match = trimmedLine.match(/^print\s*\((.+?)\s*\)$/);
            if (match) {
                if (printedExpression === null) {
                    printedExpression = match[1].trim();
                }
            } else {
                messageElement.textContent = `Ошибка синтаксиса: Некорректный формат print(). Ожидается: print(выражение).`;
                return;
            }
            
            if (!handlePrintForEntity(trimmedLine)) return;
        } else if (trimmedLine.includes('=')) {
            if (!handleAssignment(trimmedLine)) return;
        } else {
            messageElement.textContent = `Ошибка синтаксиса! Неизвестная команда: "${trimmedLine}"`;
            return;
        }
    }
    
    // Сохраняем состояние цикла
    if (lines.length > startIndex) {
        window.wasForLoopExecuted = wasForLoopExecuted;
    }
    
    // Проверяем, нужно ли продолжить выполнение циклов
    if (whileLoopStack.length > 0 || forLoopStack.length > 0) {
        let shouldRestart = false;
        
        while ((whileLoopStack.length > 0 || forLoopStack.length > 0) && controlFlowStack.length > 1) {
            const poppedBlock = controlFlowStack[controlFlowStack.length - 1];
            if (poppedBlock.type === 'while' || poppedBlock.type === 'for') {
                const loopStack = poppedBlock.type === 'while' ? whileLoopStack : forLoopStack;
                
                if (loopStack.length === 0) {
                    controlFlowStack.pop();
                    continue;
                }
                
                const currentLoopState = loopStack[loopStack.length - 1];
                
                if (!currentLoopState) {
                    controlFlowStack.pop();
                    continue;
                }
                
                let shouldRepeat = false;
                
                if (!isBreakingLoop) {
                    try {
                        if (poppedBlock.type === 'while') {
                            shouldRepeat = evaluateCondition(currentLoopState.condition);
                        } else {
                            // Для цикла for: сначала увеличиваем, потом проверяем
                            currentLoopState.current += currentLoopState.step;
                            pythonVariables[currentLoopState.varName] = currentLoopState.current;
                            shouldRepeat = currentLoopState.current < currentLoopState.end;
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
                    break;
                } else {
                    controlFlowStack.pop();
                    loopStack.pop();
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
    handleTargetInteraction();
    messageElement.textContent = "Код успешно выполнен. Проверьте консоль и положение.";
    drawGame();
}

// --- СПРАВОЧНИК ДЛЯ ЗАНЯТИЯ 6 ---

const REFERENCE_DATA = {
    6: {  // Занятие 6
        title: "Справочник: Занятие 6",
        content: `
            <h3>🍳 Работа со строками</h3>
            <p><code>.count('символ')</code> — подсчитывает количество вхождений символа в строку.</p>
            <p><code>.lower()</code> — преобразует все символы строки в нижний регистр.</p>
            <p><code>.upper()</code> — преобразует все символы строки в верхний регистр.</p>
            <p><code>.replace('старое', 'новое')</code> — заменяет подстроку в строке.</p>
            <p><code>.isdigit()</code> — проверяет, состоит ли строка только из цифр.</p>
            <p><code>.isalpha()</code> — проверяет, состоит ли строка только из букв.</p>
            <p><code>.split(',')</code> — разбивает строку на список по разделителю.</p>
            <p><code>'разделитель'.join(список)</code> — объединяет список в строку через разделитель.</p>
            
            <h3>🧮 Конкатенация строк</h3>
            <p><code>"строка1" + "строка2"</code> — соединение строк.</p>

            <h3>📤 Взаимодействие</h3>
            <p><code>print("Слово")</code> - взаимодействие с объектами</p>
            <p><b>Луи (Стажер):</b> <code>print("Данные кухни")</code> - получить данные</p>
            <p><b>Марио (Шеф):</b> <code>print("Спросить")</code> - получить приветственное слово</p>
            <p><b>Жюри:</b> <code>print("ПриветственноеСлово")</code> - затем передать результат</p>
            
            <h3>⚖️ Условный оператор if</h3>
            <p><code>if условие:</code> — выполнить блок кода, если условие истинно.</p>
            <p><code>elif условие:</code> — если предыдущие условия ложны, а это истинно.</p>
            <p><code>else:</code> — если все условия ложны.</p>
            
            <h3>🔁 Циклы</h3>
            <p><code>for переменная in последовательность:</code> — цикл по элементам.</p>
            <p><code>while условие:</code> — цикл, пока условие истинно.</p>
            <p><code>break</code> — выход из цикла.</p>
            <p><code>continue</code> — переход к следующей итерации.</p> 
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

// Обработчики для модального окна с вопросами
document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('check-answer-btn');
    const returnBtn = document.getElementById('return-to-level-btn');
    
    if (checkBtn) {
        checkBtn.addEventListener('click', checkAnswer);
    }
    
    if (returnBtn) {
        returnBtn.addEventListener('click', closeQuestionModal);
    }
    
    const closeBtn = document.getElementById('question-close');
    if (closeBtn) {
        // Не вешаем обработчик - крестик скрыт и не работает
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.onclick = window.hideIntroAndStart; 
    }
    
    updateReferenceContent();
});