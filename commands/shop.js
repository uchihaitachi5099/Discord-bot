const fs = require('fs');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

// Функция за зареждане на данни от JSON файл
function loadData(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
}

module.exports = {
    name: 'shop',
    description: 'Open the shop with items',
    category: 'general',
    async execute(message, args) {
        // Пътища до JSON файловете
        const shopFilePath = './shop.json';
        const shopCoinsFilePath = './shop-coin.json';

        // Зареждаме информацията за магазина и парите на потребителя
        const shopItems = loadData(shopFilePath);
        const userCoinsData = loadData(shopCoinsFilePath);
        const userCoins = userCoinsData[message.author.id]?.coins || 0;

        // Създаваме ново вградено съобщение
        const embed = new MessageEmbed()
            .setColor('#00b0f4')
            .setTitle(' ABN | SHOP ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')
            .setDescription('Welcome to the shop! Please select an item:');

        // Генерираме бутони за всеки артикул от магазина
        const buttonRow = new MessageActionRow();
        Object.keys(shopItems).forEach(item => {
            const itemDetails = shopItems[item];
            const button = new MessageButton()
                .setCustomId(item) // Уникален идентификатор за бутона, базиран на името на артикула
                .setLabel(`${itemDetails.name} - ${itemDetails.price} coins`) // Надпис на бутона
                .setStyle('PRIMARY'); // Стил на бутона

            buttonRow.addComponents(button);
        });

        // Добавяме бутоните към вграденото съобщение
        const msg = await message.channel.send({
            embeds: [embed],
            components: [buttonRow],
        });

        // Функция за обработка на натискането на бутоните
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 300000 }); // 300000 милисекунди = 5 минути

        collector.on('collect', async (interaction) => {
            const itemName = interaction.customId;
            const itemDetails = shopItems[itemName];

            // Проверка дали потребителя има достатъчно монети
            if (userCoins < itemDetails.price) {
                await interaction.reply({ content: `You don't have enough coins to buy ${itemDetails.name}.`, ephemeral: true });
            } else {
                // Извършваме купуването
                await interaction.reply({ content: `You bought ${itemDetails.name} for ${itemDetails.price} coins!`, ephemeral: true });

                // Намаляваме броя на монетите на потребителя
                userCoinsData[message.author.id].coins -= itemDetails.price;

                // Добавяме купения артикул в инвентара на потребителя
                if (!userCoinsData[message.author.id].inventory) {
                    userCoinsData[message.author.id].inventory = [];
                }
                userCoinsData[message.author.id].inventory.push({
                    name: itemDetails.name,
                    item: itemName,
                    price: itemDetails.price,
                    purchasedAt: new Date().toLocaleString() // Добавяне на дата и час на закупуване
                });

                // Записваме промените във файл
                fs.writeFileSync(shopCoinsFilePath, JSON.stringify(userCoinsData, null, 4));
            }
        });

        collector.on('end', async () => {
            // Премахваме бутоните от съобщението
            await msg.edit({
                embeds: [embed.setDescription('The shop is closed now. Please come back later!')],
                components: []
            });
        });
    },
};
