const fs = require('fs');
const { Permissions } = require('discord.js');
const { aliases, permissionLevel } = require('./help');

// Функция за зареждане на данни от JSON файл
function loadData(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
}

module.exports = {
    name: 'edit-point',
    description: 'Add or remove points from a user',
    usage: 'edit-point <@user> <+/-amount>',
    aliases: ['point'],
    permissionLevel: 4,
    category: 'admin',
    execute(message, args) {
        // Проверка за необходимите аргументи
        if (args.length !== 2) {
            return message.reply('Please provide a user mention and a valid point operation (+/-amount).');
        }

        // Извличане на потребителския обект от съобщението
        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Unable to find the mentioned user.');
        }


        // Парсване на втория аргумент (+/-amount)
        let operation = args[1][0]; // + или -
        const amount = parseInt(args[1].slice(1), 10); // извличане на числото след оператора (+ или -)

        // Ако не е посочен оператор, да се приеме, че е плюс
        if (!['+', '-'].includes(operation)) {
            operation = '+';
        }

        // Валидация на втория аргумент
        if (isNaN(amount)) {
            return message.reply('Invalid amount. Please use <+/-amount>.');
        }

        // Път до JSON файла
        const shopCoinsFilePath = './shop-coin.json';

        // Зареждаме данните от файла
        const userCoinsData = loadData(shopCoinsFilePath);

        // Проверка дали съществуват точки за този потребител
        if (!userCoinsData[member.user.id]) {
            return message.reply(`${member.user.tag} does not have any points in the database.`);
        }

        // Добавяне или махане на точки в зависимост от операцията
        if (operation === '+') {
            userCoinsData[member.user.id].coins += amount;
            message.channel.send(`Added ${amount} points to ${member.user.tag}.`);
        } else if (operation === '-' && userCoinsData[member.user.id].coins < amount) {
            return message.reply('User does not have enough points to subtract.');
        } else if (operation === '-') {
            userCoinsData[member.user.id].coins -= amount;
            message.channel.send(`Removed ${amount} points from ${member.user.tag}.`);
        }

        // Записваме промените във файл
        fs.writeFileSync(shopCoinsFilePath, JSON.stringify(userCoinsData, null, 4));
    },
};
