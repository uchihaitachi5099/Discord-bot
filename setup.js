const fs = require('fs');
const { Message } = require('discord.js');
const language = require('./language.json');

module.exports = {
    name: 'setup',
    description: 'Setup command to configure the bot',
    Level: 0,
    async execute(message = new Message(), args) {
        // Проверка дали data.json вече съществува
        if (fs.existsSync('data.json')) {
            message.channel.send(language.setup_already_done);
            return;
        }

        const guild = message.guild;
        const owner = await guild.fetchOwner();

        // Създаване на OWNER ролята, ако липсва
        let role = guild.roles.cache.find(role => role.name === 'OWNER');
        if (!role) {
            role = await guild.roles.create({
                name: 'OWNER',
                color: 'purple', // Можете да промените цвета според вашите предпочитания
                reason: 'Setup command',
            });
        }

        // Преместване на OWNER ролята над HEAD-ADMIN, ако тя вече не е над нея
        const headAdminRole = guild.roles.cache.find(role => role.name === 'HEAD-ADMIN');
        if (headAdminRole && role.comparePositionTo(headAdminRole) < 0) {
            await role.setPosition(headAdminRole.position - 1);
        }

        // Създаване на HEAD-ADMIN ролята, ако липсва
        role = guild.roles.cache.find(role => role.name === 'HEAD-ADMIN');
        if (!role) {
            role = await guild.roles.create({
                name: 'HEAD-ADMIN',
                color: 'dark-red',
                reason: 'Setup command',
            });
        }

        // Създаване на ADMIN ролята, ако липсва
        role = guild.roles.cache.find(role => role.name === 'ADMIN');
        if (!role) {
            role = await guild.roles.create({
                name: 'ADMIN',
                color: 'red',
                reason: 'Setup command',
            });
        }

        // Създаване на MODERATOR ролята, ако липсва
        role = guild.roles.cache.find(role => role.name === 'MODERATOR');
        if (!role) {
            role = await guild.roles.create({
                name: 'MODERATOR',
                color: 'blue',
                reason: 'Setup command',
            });
        }

        // Създаване на HELPER ролята, ако липсва
        role = guild.roles.cache.find(role => role.name === 'HELPER');
        if (!role) {
            role = await guild.roles.create({
                name: 'HELPER',
                color: 'green',
                reason: 'Setup command',
            });
        }

        // Записване на конфигурацията във файл
        const config = {
            guildId: guild.id,
            ownerId: owner.id,
            roles: {
                'OWNER': guild.roles.cache.find(role => role.name === 'OWNER').id,
                'HEAD-ADMIN': guild.roles.cache.find(role => role.name === 'HEAD-ADMIN').id,
                'ADMIN': guild.roles.cache.find(role => role.name === 'ADMIN').id,
                'MODERATOR': guild.roles.cache.find(role => role.name === 'MODERATOR').id,
                'HELPER': guild.roles.cache.find(role => role.name === 'HELPER').id,
            },
        };

        // Записване на конфигурационния файл
        fs.writeFileSync('data.json', JSON.stringify(config, null, 4));

        // Изтриване на setup.js файла след успешно изпълнение
        fs.unlinkSync(__filename);

        message.channel.send(language.setup_complete);
    },
};
