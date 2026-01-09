// api.js - обновленная версия с проверкой пройденных уровней
const API_URL = 'https://script.google.com/macros/s/AKfycby7-PMwDOy11PysIDD0DSLkAcB7nq_fugQx6o92RPSYRRd-35Cp9XeC6noO-artX7XT/exec';
const SCRIPT_PASSWORD = 'teacher123';

// Основная функция сохранения прогресса
async function saveStudentProgress(studentData, lessonNumber, currentLevel, earnedExp) {
  try {
    // ВАЖНО: Проверяем на клиенте, был ли уровень уже пройден
    // Это предотвратит лишние запросы на сервер
    const completedKey = `completed_levels_lesson${lessonNumber}`;
    let completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
    
    if (completedLevels.includes(currentLevel.toString())) {
      console.log(`Уровень ${currentLevel} урока ${lessonNumber} уже пройден, опыт не начислен`);
      return { 
        success: true, 
        experienceAdded: false,
        message: "Уровень уже пройден ранее" 
      };
    }
    
    // Отправляем данные на сервер
    const dataToSend = {
      action: 'save',
      password: SCRIPT_PASSWORD,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      grade: studentData.grade,
      classLetter: studentData.classLetter,
      subgroup: studentData.subgroup,
      currentLesson: lessonNumber,
      currentLevel: currentLevel,
      experience: earnedExp
    };
    
    console.log("Отправляю данные на сервер:", dataToSend);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(dataToSend)
    });
    
    const result = await response.json();
    console.log("Ответ от сервера:", result);
    
    // Если сервер подтвердил добавление опыта, обновляем localStorage
    if (result.success && result.experienceAdded) {
      // Добавляем уровень в пройденные
      completedLevels.push(currentLevel.toString());
      localStorage.setItem(completedKey, JSON.stringify(completedLevels));
      
      // Обновляем общий опыт
      const totalExp = parseInt(localStorage.getItem('total_experience') || '0');
      localStorage.setItem('total_experience', (totalExp + earnedExp).toString());
      
      // Обновляем опыт урока
      const lessonExpKey = `experience_lesson${lessonNumber}`;
      const lessonExp = parseInt(localStorage.getItem(lessonExpKey) || '0');
      localStorage.setItem(lessonExpKey, (lessonExp + earnedExp).toString());
      
      console.log(`Опыт сохранен: урок ${lessonNumber} +${earnedExp}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Ошибка при сохранении прогресса:', error);
    return { success: false, error: error.toString() };
  }
}

// Функция загрузки прогресса
async function loadStudentProgress(studentData, lessonNumber) {
  try {
    // Загружаем из localStorage
    const completedKey = `completed_levels_lesson${lessonNumber}`;
    const lessonExpKey = `experience_lesson${lessonNumber}`;
    
    const completedLevels = JSON.parse(localStorage.getItem(completedKey) || '[]');
    const lessonExperience = parseInt(localStorage.getItem(lessonExpKey) || '0');
    const totalExperience = parseInt(localStorage.getItem('total_experience') || '0');
    
    // Также можно запросить данные с сервера для синхронизации
    const serverData = await fetchStudentFromServer(studentData);
    
    if (serverData && serverData.success) {
      // Синхронизируем с серверными данными
      localStorage.setItem('total_experience', serverData.totalExperience || '0');
      localStorage.setItem(lessonExpKey, serverData.experiencePerLesson[`lesson${lessonNumber}`] || '0');
      
      // Синхронизируем пройденные уровни
      if (serverData.completedLevels && serverData.completedLevels[`lesson${lessonNumber}`]) {
        localStorage.setItem(completedKey, JSON.stringify(serverData.completedLevels[`lesson${lessonNumber}`]));
      }
    }
    
    return {
      success: true,
      lessonExperience: lessonExperience,
      totalExperience: totalExperience,
      completedLevels: completedLevels,
      isLevelCompleted: function(level) {
        return completedLevels.includes(level.toString());
      }
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Вспомогательная функция для загрузки данных с сервера
async function fetchStudentFromServer(studentData) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'get',
        password: SCRIPT_PASSWORD,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        grade: studentData.grade,
        classLetter: studentData.classLetter
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки с сервера:', error);
    return null;
  }
}
