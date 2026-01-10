function getStudentIdentifier() {
const studentData = JSON.parse(localStorage.getItem('currentStudent') || '{}');
if (studentData && studentData.lastName && studentData.firstName && studentData.grade && studentData.classLetter && studentData.subgroup) {
return `${studentData.lastName}_${studentData.firstName}_${studentData.grade}${studentData.classLetter}_${studentData.subgroup}`;
}
return 'anonymous';
}

const LESSON_NUMBER = 4;

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

        // 🔧 ФОРМАТ КАК В УРОКЕ 2: "4.0" (урок.часть)
const partKey = `4.0`;
        
        // 🆕 Обновляем текущие данные ученика
        studentData.currentPart = partKey; // Сохраняем как строку "4.0"
studentData.currentLevel = currentLevel;
studentData.lastLogin = new Date().toISOString();
        
        // 🆕 ВАЖНО: Берем опыт уже обновленный в calculateExperience()
        // НЕ добавляем earnedExp снова, он уже добавлен к totalExperience
        const currentStudentExp = totalExperience; // Используем текущий опыт
        
        // 🆕 Обновляем опыт в данных ученика
        studentData.experience = currentStudentExp;
localStorage.setItem('currentStudent', JSON.stringify(studentData));

        // 🆕 Формируем ключ для завершенных уровней ДЛЯ ЭТОГО УЧЕНИКА (как в уроке 2)
        const studentIdentifier = getStudentIdentifier();
        const completedKey = `completed_levels_${studentIdentifier}_${partKey}`;
        let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
        
        const levelKey = `${partKey}.${currentLevel + 1}`;
        
        // 🆕 Добавляем уровень в пройденные, если еще не добавлен
        if (!completedLevels.includes(levelKey) && earnedExp > 0) {
            completedLevels.push(levelKey);
            localStorage.setItem(completedKey, JSON.stringify(completedLevels));
        }
        
        // 🆕 ВАЖНО: Формируем правильный ключ уровня (как в уроке 2)
        const levelKeyForSheet = `${partKey}.${currentLevel + 1}`;
        
        // Формируем данные для отправки - ТАКИЕ ЖЕ КАК В game-2.js
const dataToSend = {
            action: 'save', // Всегда 'save' как в уроке 2
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
        
        // 🆕 ИСПРАВЛЕНИЕ: Используем тот же URL, что и в lesson2
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
@@ -758,10 +720,15 @@
if (selectedIndex === correctIndex) {
// Правильный ответ
if (questionAttempts === 1) {
            // Первая попытка - +1 опыт
totalExperience += 1;
questionExperienceAwarded = true;
feedbackElement.textContent = `✅ Правильно! +1 опыт за быстрый ответ!`;
feedbackElement.className = 'success';
console.log(`[Опыт] +1 за правильный ответ с первой попытки`);
} else {
@@ -776,7 +743,13 @@
// Неправильный ответ
if (questionAttempts < 3) {
feedbackElement.textContent = `❌ Попробуй еще раз, ты пока не прошел поверку (попытка ${questionAttempts}/3)`;
            feedbackElement.className = 'error';
feedbackElement.style.display = 'block';
returnButton.style.display = 'none'; // Не показываем кнопку

@@ -919,13 +892,16 @@
document.getElementById('experience-display').textContent = displayText;

// Сохраняем в localStorage
    try {
        localStorage.setItem('pythonGameExperience', totalExperience.toString());
} catch (e) {
console.error('Ошибка сохранения опыта:', e);
}
}

// Функция для начала отслеживания уровня
function startLevelTracking() {
levelStartTime = Date.now();
@@ -1018,13 +994,6 @@
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
@@ -1511,7 +1480,7 @@

function showWinModal(isPartComplete = false) {
// 🆕 ДОБАВЬ ЭТУ СТРОКУ:
    const earnedExp = calculateExperience();
const expMessage = isPartComplete 
? `<br><br>🎖️ <strong>Общий опыт за занятие: ${totalExperience}</strong>`
: `<br><br>⭐ Получено опыта: +${earnedExp} (всего: ${totalExperience})`;
