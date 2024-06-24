const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'g-edit',
    description: 'Edits an ongoing giveaway.',
    aliases: [],
    usage: '<messageId> <newDuration> <newPrize>',
    permissionLevel: 2, // Permission level: Moderator or higher
    category: 'giveaway',

    async execute(message, args, client) {
        if (!message.member.permissions.has('ADMINISTRATOR') && !message.member.roles.cache.some(role => ['Moderator', 'Admin'].includes(role.name))) {
            return message.reply('You do not have permission to use this command.');
        }

        // Check if enough arguments are provided
        if (args.length < 3) {
            return message.reply('Please provide message ID, new duration, and new prize for the giveaway.');
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

        // Parse new duration from argument
        let newDuration = args[1];
        if (!newDuration) {
            return message.reply('Please provide a valid new duration.');
        }

        // Parse new prize from argument
        let newPrize = args.slice(2).join(' ');
        if (!newPrize) {
            return message.reply('Please provide a valid new prize for the giveaway.');
        }

        // Function to update the giveaway message
        const updateGiveaway = async (msg, newDuration, newPrize) => {
            const embed = new MessageEmbed()
                .setTitle('🎉 Giveaway 🎉')
                .setColor('#0099ff')
                .setDescription(`React with 🎉 to enter!\n**Prize:** ${newPrize}\n**Time:** ${newDuration}`);

            await msg.edit({ embeds: [embed] });

            // Update the giveaway data (if stored in a database or elsewhere)
            // Update duration and prize
        };

        // Update the giveaway message
        await updateGiveaway(msg, newDuration, newPrize);
        message.reply('Giveaway updated successfully!');
    },
};