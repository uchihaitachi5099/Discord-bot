const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Ping command to measure bot latency.',
    async execute(message, args) {
        const embed = new MessageEmbed()
            .setAuthor('ABN | ping', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
            .setColor('#00b0f4')
            .addField('Status', 'Pinging...');

        const msg = await message.channel.send({ embeds: [embed] });

        const ping = msg.createdTimestamp - message.createdTimestamp;

        const embedUpdated = new MessageEmbed()
            .setAuthor('ABN | ping', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
            .setColor('#00b0f4')
            .addField('Status', 'Pong!')
            .addField('Latency', `\`${ping}ms.\``);

        msg.edit({ embeds: [embedUpdated] });
    },
};
