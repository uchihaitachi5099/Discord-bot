const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'g-end',
    description: 'Ends an ongoing giveaway.',
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
            return message.reply('Please provide message ID of the giveaway to end.');
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

        // Function to end the giveaway
        const endGiveaway = async (msg) => {
            // Logic to determine winner if needed
            const winner = 'RandomUser'; // Replace with actual logic to determine winner

            const embed = new MessageEmbed()
                .setTitle('🎉 Giveaway Ended 🎉')
                .setColor('#0099ff')
                .setDescription(`**Winner:** ${winner}\n**Prize:** Prize`);

            await msg.edit({ embeds: [embed] });
        };

        // End the giveaway
        await endGiveaway(msg);
        message.reply('Giveaway ended successfully!');
    },
};