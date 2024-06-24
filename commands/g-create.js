const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'g-create',
    description: 'Starts a giveaway.',
    aliases: [],
    usage: '<time> <prize>',
    permissionLevel: 2, // Permission level: Moderator or higher
    category: 'giveaway',

    async execute(message, args, client) {
        if (!message.member.permissions.has('ADMINISTRATOR') && !message.member.roles.cache.some(role => ['Moderator', 'Admin'].includes(role.name))) {
            return message.reply('You do not have permission to use this command.');
        }

        // Check if enough arguments are provided
        if (args.length < 2) {
            return message.reply('Please provide duration and prize for the giveaway.');
        }

        // Parse time from argument (e.g., 1w2d3h4m)
        let time = args[0];
        if (!time) {
            return message.reply('Please provide a valid time duration (e.g., 1w2d3h4m).');
        }

        // Parse prize from argument
        let prize = args.slice(1).join(' ');
        if (!prize) {
            return message.reply('Please provide a valid prize for the giveaway.');
        }

        // Function to convert time string to seconds
        const parseTimeToSeconds = (timeString) => {
            let totalSeconds = 0;
            const weeks = timeString.match(/(\d+)\s*w/);
            const days = timeString.match(/(\d+)\s*d/);
            const hours = timeString.match(/(\d+)\s*h/);
            const minutes = timeString.match(/(\d+)\s*m/);

            if (weeks) totalSeconds += parseInt(weeks[1]) * 7 * 24 * 60 * 60;
            if (days) totalSeconds += parseInt(days[1]) * 24 * 60 * 60;
            if (hours) totalSeconds += parseInt(hours[1]) * 60 * 60;
            if (minutes) totalSeconds += parseInt(minutes[1]) * 60;

            return totalSeconds;
        };

        // Convert time string to seconds
        let durationInSeconds = parseTimeToSeconds(time);
        if (durationInSeconds <= 0) {
            return message.reply('Invalid duration. Please provide a valid time duration (e.g., 1w2d3h4m).');
        }

        // Function to start the giveaway
        const startGiveaway = async (channel, durationInSeconds, prize) => {
            const giveawayEmbed = new MessageEmbed()
                .setTitle('🎉 Giveaway 🎉')
                .setColor('#0099ff')
                .setDescription(`React with 🎉 to enter!\n**Prize:** ${prize}\n**Time:** ${time}`);

            const msg = await channel.send({ embeds: [giveawayEmbed] });
            await msg.react('🎉');

            // Collector for reactions
            const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
            const collector = msg.createReactionCollector({ filter, time: durationInSeconds * 1000 });

            let participants = [];

            collector.on('collect', (reaction, user) => {
                participants.push(user);
            });

            collector.on('end', () => {
                if (participants.length > 0) {
                    const winner = participants[Math.floor(Math.random() * participants.length)];
                    channel.send(`🎉 Congratulations ${winner}! You won the giveaway for ${prize}! 🎉`);
                } else {
                    channel.send(`🎉 Giveaway ended with no participants. Better luck next time! 🎉`);
                }
            });
        };

        // Start the giveaway in the current channel
        await startGiveaway(message.channel, durationInSeconds, prize);
    },
};
