const fs = require('fs');
const { MessageActionRow, MessageButton, Message } = require('discord.js');
const language = require('../language.json');

module.exports = {
    name: 'addstaff',
    description: 'Add staff to staff list and database',
    aliases: ['astaff', 'as'],
    permissionLevel: 4,
    category: 'admin',
    async execute(message = new Message(), args) {
        // Get mentioned user
        const user = message.mentions.users.first();
        if (!user) {
            return message.channel.send(language.user_mention_error);
        }

        // Get mentioned member
        const member = message.guild.members.cache.get(user.id);
        if (!member) {
            return message.channel.send(language.member_not_found_error);
        }

        // Load data from data.json
        const dataFilePath = './data.json';
        let data = {};
        if (fs.existsSync(dataFilePath)) {
            data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
        } else {
            return message.channel.send(language.data_file_not_found_error);
        }

        // Check if the member already exists in data.json staff list
        const existingStaffEntry = data.staff.find(entry => entry.id === member.id);
        if (existingStaffEntry) {
            const currentRole = existingStaffEntry.role;
            return message.reply(`User ${user.username} is already a ${currentRole}. Use \`!promote\` to change roles.`);
        }

        // Prompt user to select a role using buttons
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('headAdminButton')
                    .setLabel('Head Admin')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('adminButton')
                    .setLabel('Admin')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('moderatorButton')
                    .setLabel('Moderator')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('helperButton')
                    .setLabel('Helper')
                    .setStyle('PRIMARY')
            );

        const promptMessage = await message.channel.send({ content: `Please select a role for ${user.username}:`, components: [row] });

        // Await button interaction
        const filter = i => i.user.id === message.author.id;
        const collector = promptMessage.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async interaction => {
            let roleId;
            let roleName;
            if (interaction.customId === 'headAdminButton') {
                roleId = data.roles['HEAD-ADMIN'];
                roleName = 'Head-Admin';
            } else if (interaction.customId === 'adminButton') {
                roleId = data.roles['ADMIN'];
                roleName = 'Admin';
            } else if (interaction.customId === 'moderatorButton') {
                roleId = data.roles['MODERATOR'];
                roleName = 'Moderator';
            } else if (interaction.customId === 'helperButton') {
                roleId = data.roles['HELPER'];
                roleName = 'Helper';
            }

            if (!roleId) {
                return interaction.reply({ content: language.role_not_found_error, ephemeral: true });
            }

            const selectedRole = message.guild.roles.cache.get(roleId);
            if (!selectedRole) {
                return interaction.reply({ content: language.role_not_found_error, ephemeral: true });
            }

            // Assign selected role to the member
            await member.roles.add(selectedRole);

            // Update prompt message with the success message
            await promptMessage.edit({
                content: `Congratulations ${user}! You have been assigned the role ${selectedRole}.`,
                components: [],
            });

            // Update data.json with new staff information
            updateStaffData(member, roleName, data);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                promptMessage.edit({ content: 'Role selection timeout. Please try again and select a role within 15 seconds.', components: [] });
            }
        });
    },
};

async function updateStaffData(member, roleName, data) {
    try {
        // Add new entry to staff list
        data.staff.push({
            id: member.id,
            role: roleName,
        });

        // Write updated data back to file
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 4));
        console.log(`Updated staff data for ${member.user.username}`);
    } catch (error) {
        console.error('Error updating staff data:', error);
    }
}
