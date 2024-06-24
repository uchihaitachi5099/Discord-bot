const fs = require('fs').promises;
const path = require('path');
const { MessageEmbed } = require('discord.js');

const shopFilePath = path.resolve(__dirname, '../shop.json');

async function loadShop() {
    try {
        const data = await fs.readFile(shopFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If the file does not exist, return an empty object
            return {};
        } else {
            console.error('Error reading shop.json:', error);
            throw error;
        }
    }
}

async function saveShop(shop) {
    try {
        await fs.writeFile(shopFilePath, JSON.stringify(shop, null, 4));
    } catch (error) {
        console.error('Error writing to shop.json:', error);
        throw error;
    }
}

module.exports = {
    name: 'edit-shop',
    description: 'Edit the shop items',
    category: 'moderator',
    usage: '',
    permissionLevel: 2,
    async execute(message, args) {
        const subCommand = args[0];
        const shop = await loadShop();

        if (subCommand === 'show') {
            const embed = new MessageEmbed()
            .setColor('#00b0f4')
            .setTitle(' ABN | SHOP ', 'https://prod.cloud.rockstargames.com/crews/sc/6720/72701442/publish/emblem/emblem_128.png')


            for (const [id, item] of Object.entries(shop)) {
                embed.addField(`ID: ${id}`, `Name: ${item.name}, Price: ${item.price}`);
            }

            message.channel.send({ embeds: [embed] });
        } else if (subCommand === 'edit') {
            const itemId = args[1];
            const fieldToEdit = args[2];
            const newValue = args.slice(3).join(' ');

            if (!shop[itemId]) {
                return message.reply(`Item with ID ${itemId} does not exist.`);
            }

            if (fieldToEdit === 'name') {
                shop[itemId].name = newValue;
            } else if (fieldToEdit === 'price') {
                const newPrice = parseInt(newValue, 10);
                if (isNaN(newPrice)) {
                    return message.reply('Price must be a valid number.');
                }
                shop[itemId].price = newPrice;
            } else {
                return message.reply('Invalid field to edit. Use "name" or "price".');
            }

            await saveShop(shop);
            message.reply(`Item with ID ${itemId} has been updated.`);
        } else if (subCommand === 'add') {
            const newId = Object.keys(shop).length + 1;
            const newName = args[1];
            const newPrice = parseInt(args[2], 10);

            if (!newName || isNaN(newPrice)) {
                return message.reply('Please provide a valid name and price.');
            }

            shop[newId] = {
                name: newName,
                price: newPrice
            };

            await saveShop(shop);
            message.reply(`New item added with ID ${newId}.`);
        } else {
            message.reply('Invalid subcommand. Use "show", "edit", or "add".');
        }
    }
};
