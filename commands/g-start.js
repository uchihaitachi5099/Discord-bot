const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'g-start',
    description: 'Manually starts a scheduled giveaway.',
    aliases: [],
    usage: '<messageId>',
    permissionLevel: 2, // Permission level: Moderator or higher
    category: 'giveaway',

    async execute(message, args, client) {
        if (!message.member.permissions.has('ADMINISTRATOR') && !message.member.roles.cache.some(role => ['Moderator', 'Admin'].includes(role.name))) {
            return message.reply('You do not have permission to use this command.');
        }

        // Check if enough arguments are provided
        if (args.length < 1) {
            return message.reply('Please provide message ID of the scheduled giveaway to start.');
        }

        // Parse message ID from argument
        let messageId = args[0];
        if (!messageId) {
            return message.reply('Please provide a valid message ID.');
        }

        // Fetch the message
        let msg;
        try {
            msg = await message.channel.messages.fetch(messageId);
        } catch (error) {
            return message.reply('Invalid message ID. Make sure the ID belongs to a message in this channel.');
        }

        // Function to start the scheduled giveaway
        const startScheduledGiveaway = async (msg) => {
            // Logic to start the scheduled giveaway
            const embed = new MessageEmbed()
                .setTitle('🎉 Giveaway Started 🎉')
                .setColor('#0099ff')
                .setDescription(`React with 🎉 to enter!\n**Prize:** Prize`);

            await msg.edit({ embeds: [embed] });

            // Start collector for reactions (if needed)
        };

        // Start the scheduled giveaway
        await startScheduledGiveaway(msg);
        message.reply('Scheduled giveaway started successfully!');
    },
};
