const fs = require('fs');
const path = require('path');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'join-shop',
    description: 'Add you to the shop',
    category: 'general',
    usage: '',
    permissionLevel: 0,
    async execute(message, args) {
        // Пътят до файла shop-coin.json в текущата директория
        const filePath = path.resolve(__dirname, '../shop-coin.json');
        const userId = message.author.id;
        let data = {};

        try {
            // Четене на файла shop-coin.json
            if (fs.existsSync(filePath)) {
                data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } else {
                // Ако файла не съществува, създаваме празен обект
                fs.writeFileSync(filePath, '{}');
            }
        } catch (err) {
            console.error('Error reading shop-coin.json:', err);
        }

        if (data[userId]) {
            // Потребителят е в базата данни
            message.channel.send('**You are on database**');
        } else {
            // Потребителят не е в базата данни, добавяне на информация
            // Генериране на случайни пари между 10 и 69
            const randomCoins = Math.floor(Math.random() * (69 - 10 + 1)) + 10;

            data[userId] = {
                name: message.author.username,
                id: userId,
                coins: randomCoins,
                inventory: [] // Инициализация на инвентар (може да е празен масив)
            };

            try {
                // Запис на промените във файл shop-coin.json
                fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

                // Използваме MessageEmbed за да създадем вградено съобщение
                const embed = new MessageEmbed()
                    .setColor('#00b0f4')
                    .setAuthor(' ABN | SHOP ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
                    .setDescription('')
                    .addField('**Added to database with**', `${randomCoins} coins`);

                // Изпращаме вграденото съобщение в канала
                message.channel.send({ embeds: [embed] });
            } catch (err) {
                console.error('Error writing to shop-coin.json:', err);
            }
        }
    }
};
