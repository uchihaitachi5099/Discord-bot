const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Creates a new ticket.',
    permissionLevel: 0, // Промяна на нивото на разрешение, ако е необходимо
    async execute(message, args, client) {
        const ticketEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Ticket System')
            .setDescription('Click the button below to create a new ticket.');

        const createButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('create_ticket')
                    .setLabel('Create Ticket')
                    .setStyle('PRIMARY')
            );

        await message.channel.send({ embeds: [ticketEmbed], components: [createButton] });
    },
};
