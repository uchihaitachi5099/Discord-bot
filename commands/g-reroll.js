const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'g-reroll',
    description: 'Rerolls a giveaway for a new winner.',
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
            return message.reply('Please provide message ID of the giveaway to reroll.');
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

        // Function to reroll the giveaway
        const rerollGiveaway = async (msg) => {
            // Logic to determine new winner
            const newWinner = 'NewRandomUser'; // Replace with actual logic to determine new winner

            const embed = new MessageEmbed()
                .setTitle('🎉 Giveaway Rerolled 🎉')
                .setColor('#0099ff')
                .setDescription(`**New Winner:** ${newWinner}`);

            await msg.edit({ embeds: [embed] });
        };

        // Reroll the giveaway
        await rerollGiveaway(msg);
        message.reply('Giveaway rerolled successfully!');
    },
};