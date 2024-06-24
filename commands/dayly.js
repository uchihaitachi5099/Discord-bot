const fs = require('fs').promises;
const path = require('path');
const { MessageEmbed } = require('discord.js');

const dailyFilePath = path.resolve(__dirname, '../daily.json');

async function loadDailyData() {
    try {
        const data = await fs.readFile(dailyFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        } else {
            console.error('Error reading daily.json:', error);
            throw error;
        }
    }
}

async function saveDailyData(dailyData) {
    try {
        await fs.writeFile(dailyFilePath, JSON.stringify(dailyData, null, 4));
    } catch (error) {
        console.error('Error writing to daily.json:', error);
        throw error;
    }
}

function getCurrentDate() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

module.exports = {
    name: 'daily',
    description: 'Claim your daily reward',
    category: 'general',
    usage: '',
    permissionLevel: 0,
    async execute(message) {
        const userId = message.author.id;
        const dailyData = await loadDailyData();
        const today = getCurrentDate();

        if (!dailyData[userId]) {
            dailyData[userId] = {
                lastClaimed: today,
                streak: 1,
                points: 50
            };
        } else {
            const userDailyData = dailyData[userId];

            if (userDailyData.lastClaimed === today) {
                return message.reply('You have already claimed your daily reward for today.');
            }

            const lastClaimedDate = new Date(userDailyData.lastClaimed);
            const currentDate = new Date(today);
            const daysDifference = Math.floor((currentDate - lastClaimedDate) / (1000 * 60 * 60 * 24));

            if (daysDifference === 1) {
                userDailyData.streak += 1;
                userDailyData.points += userDailyData.streak > 7 ? 100 : 50;
            } else {
                userDailyData.streak = 1;
                userDailyData.points = 50;
            }

            userDailyData.lastClaimed = today;
        }

        await saveDailyData(dailyData);

        const embed = new MessageEmbed()
        .setColor('#00b0f4')
        .setTitle(' ABN | SHOP ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
        .setDescription(`You have claimed your daily reward of ${dailyData[userId].points} points.`)
            .addField('Streak', `${dailyData[userId].streak} days`);

        message.channel.send({ embeds: [embed] });
    }
};
