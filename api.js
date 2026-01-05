// api.js - функции для работы с Google Sheets

// URL вашего Google Apps Script веб-приложения
const API_URL = 'https://script.google.com/macros/s/AKfycbzIWux8jtRwi4qreBoq6DI7UM2IOAMPzQ12S-Xer0pBDZhSihVCftDBfTNjWHxkwNpP/exec';
const SCRIPT_PASSWORD = 'teacher123';

// Функция для отправки данных ученика на сервер
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
            experience: studentData.experience || 0,
            lastLogin: new Date().toISOString()
        };

        // Отправляем запрос с правильными заголовками
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(dataToSend)
        });

        // Получаем ответ
        const result = await response.text();
        console.log('Ответ от сервера:', result);
        
        try {
            return JSON.parse(result);
        } catch {
            return { success: true, message: "Данные отправлены" };
        }

    } catch (error) {
        console.error('Ошибка при отправке данных:', error);
        return { success: false, error: error.toString() };
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
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.text();
        return JSON.parse(result);

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
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'getAll',
                password: SCRIPT_PASSWORD 
            })
        });

        const result = await response.text();
        return JSON.parse(result);

    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return null;
    }
}
