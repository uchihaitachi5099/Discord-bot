const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const data = require('../data.json'); // Зареждаме данните от data.json

module.exports = {
    name: 'help',
    description: 'Shows information about available commands.',
    category: 'general',
    aliases: ['commands', 'h'],
    permissionLevel: 0,
    async execute(message, args, client) {
        const guildId = '1216459866160234668'; // ID на сървъра, от който ще използваме емотиконите
        const guild = client.guilds.cache.get(guildId);

        if (args.length === 0) {
            const embed = await generateHelpEmbed(client, guild, message.member);
            message.channel.send({ embeds: [embed] });
        } else {
            const embed = await generateHelpEmbed(client, guild, message.member, args[0]);
            message.channel.send({ embeds: [embed] });
        }
    }
};

async function generateHelpEmbed(client, guild, member, commandName) {
    const embed = new MessageEmbed()
        .setColor('#00b0f4')
        .setAuthor('ABN | Commands List ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
        .setDescription('Use `!help <command>` to get more info on a specific command.');

    const categorizedCommands = {
        admin: [],
        general: [],
        giveaway: [],
        moderation: []
    };

    const commandsDir = path.join(__dirname, '..', 'commands');

    try {
        const files = await fs.promises.readdir(commandsDir);
        const jsFiles = files.filter(file => file.endsWith('.js'));

        for (const file of jsFiles) {
            const filePath = path.join(commandsDir, file);
            const command = require(filePath);

            switch (command.category) {
                case 'admin':
                    categorizedCommands.admin.push(command);
                    break;
                case 'moderation':
                    categorizedCommands.moderation.push(command);
                    break;
                case 'giveaway':
                    categorizedCommands.giveaway.push(command);
                    break;
                default:
                    categorizedCommands.general.push(command);
                    break;
            }
        }

        const userLevel = getUserLevel(member);

        // Добавяне на подробна информация за конкретна команда, ако е посочена
        if (commandName) {
            const cmd = categorizedCommands.admin.concat(categorizedCommands.general, categorizedCommands.giveaway, categorizedCommands.moderation)
                .find(cmd => cmd.name === commandName || (cmd.aliases && cmd.aliases.includes(commandName)));

            if (cmd) {
                embed.setAuthor('ABN | Commands List ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png');
                embed.setTitle(`Command: ${cmd.name}`);
                embed.setDescription(cmd.description);
                if (cmd.aliases && cmd.aliases.length > 0) {
                    embed.addField('Aliases', cmd.aliases.join(', '), true);
                }
                if (cmd.usage) {
                    embed.addField('Usage', cmd.usage, true);
                }
            } else {
                embed.setDescription(`Command "${commandName}" not found.`);
            }
        } else {
            // Добавяне на полетата за категории и команди според нивото на потребителя
            if (userLevel >= 4 && categorizedCommands.admin.length > 0) {
                const adminCategoryEmoji = guild.emojis.cache.find(emoji => emoji.name === 'admin_ca');
                embed.addField(`${adminCategoryEmoji}   ADMIN - (${categorizedCommands.admin.length})`, categorizedCommands.admin.map(cmd => `\`${cmd.name}\``).join(', '));
            }
            if (userLevel >= 3 && categorizedCommands.moderation.length > 0) {
                const moderationCategoryEmoji = guild.emojis.cache.find(emoji => emoji.name === 'moderator');
                embed.addField(`${moderationCategoryEmoji}   Moderation - (${categorizedCommands.moderation.length})`, categorizedCommands.moderation.map(cmd => `\`${cmd.name}\``).join(', '));
            }
            if (userLevel >= 2 && categorizedCommands.giveaway.length > 0) {
                const giveawayCategoryEmoji = guild.emojis.cache.find(emoji => emoji.name === 'manager_giveaway_category');
                embed.addField(`${giveawayCategoryEmoji}   Giveaway - (${categorizedCommands.giveaway.length})`, categorizedCommands.giveaway.map(cmd => `\`${cmd.name}\``).join(', '));
            }
            if (categorizedCommands.general.length > 0) {
                const generalCategoryEmoji = guild.emojis.cache.find(emoji => emoji.name === 'manager_main_category');
                embed.addField(`${generalCategoryEmoji}   General - (${categorizedCommands.general.length})`, categorizedCommands.general.map(cmd => `\`${cmd.name}\``).join(', '));
            }
        }

        // Изчисляване на общия брой на командите
        const totalCommands = categorizedCommands.admin.length + categorizedCommands.general.length + categorizedCommands.giveaway.length + categorizedCommands.moderation.length;

        // Форматиране на текущата дата и време
        const formattedDate = formatDate(new Date());
        embed.setFooter(`${totalCommands} commands •  ${formattedDate}`, 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png');

        return embed;
    } catch (err) {
        console.error('Error reading directory:', err);
        embed.setDescription('Error fetching commands. Please try again later.');
        return embed;
    }
}

function getUserLevel(member) {
    const roles = member.roles.cache;
    const roleIds = {
        owner: '1216461117547610122',
        headAdmin: data.roles['HEAD-ADMIN'],
        admin: data.roles['ADMIN'],
        moderator: data.roles['MODERATOR'],
        helper: data.roles['HELPER']
    };

    if (roles.has(roleIds.owner) || roles.has(roleIds.headAdmin)) {
        return 5;
    } else if (roles.has(roleIds.admin)) {
        return 4;
    } else if (roles.has(roleIds.moderator)) {
        return 3;
    } else if (roles.has(roleIds.helper)) {
        return 2;
    } else {
        return 1;
    }
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}