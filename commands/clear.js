const { Message } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Clears a specified number of messages from the channel.',
    category: 'admin',
    usage: '<number>',
    permissionLevel: 2,
    async execute(message = new Message(), args) {


        // Check if a number of messages to delete is provided
        const amount = parseInt(args[0]);
        if (isNaN(amount)) {
            return message.reply('Please provide a valid number of messages to delete.');
        } else if (amount <= 0 || amount > 100) {
            return message.reply('You can only delete between 1 and 100 messages at a time.');
        }

        try {
            // Delete messages
            const fetched = await message.channel.messages.fetch({ limit: amount });
            message.channel.bulkDelete(fetched);

            // Notify about the deletion
            message.channel.send(`Deleted ${fetched.size} messages.`).then(msg => {
                setTimeout(() => msg.delete(), 3000); // Delete the notification message after 5 seconds
            });
        } catch (error) {
            console.error('Error clearing messages:', error);
            message.channel.send('Failed to clear messages. Please try again later.');
        }
    },
};