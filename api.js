// api.js - функции для работы с Google Sheets

// URL вашего Google Apps Script веб-приложения
const API_URL = 'https://script.google.com/macros/s/AKfycbwF5BhsgiI-XjQpn8lJVGA7Ntk0Bwx-L0gmRETiwbAslh2HhqFsPdMS1NUz4ptEIy4h/exec';
const SCRIPT_PASSWORD = 'teacher123';

// Функция для отправки данных ученика на сервер (без ожидания ответа)
async function saveStudentToServer(studentData) {
    try {
        // Создаем данные для отправки
        const dataToSend = {
            action: 'save',
            password: SCRIPT_PASSWORD,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            classLetter: studentData.classLetter,
            subgroup: studentData.subgroup,
            currentPart: studentData.currentPart || 1,
            currentLevel: studentData.currentLevel || 0,
            lastLogin: new Date().toISOString()
        };

        // Отправляем запрос БЕЗ ОЖИДАНИЯ (no-cors режим)
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        }).catch(error => {
            console.log('Данные отправлены в фоновом режиме:', error ? 'с ошибкой' : 'успешно');
        });

        return true;

    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        return false;
    }
}

// Функция для получения данных ученика с сервера
async function getStudentFromServer(studentData) {
    try {
        const dataToSend = {
            action: 'get',
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            classLetter: studentData.classLetter
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return null;
    }
}

// Функция для получения всех учеников (для учителя)
async function getAllStudents() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getAll' })
        });

        const result = await response.json();
        return result;

    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return null;
    }
}