const fs = require('fs').promises;
const { MessageActionRow, MessageButton, Message } = require('discord.js');
const language = require('../language.json');

module.exports = {
    name: 'promote',
    description: 'Promote or demote a member to/from a new role',
    category: 'admin',
    permissionLevel: 4,
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
        try {
            const fileContent = await fs.readFile(dataFilePath, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (error) {
            return message.channel.send(language.data_file_not_found_error);
        }

        // Check if member is in data.json staff list
        const existingStaffEntry = data.staff.find(entry => entry.id === member.id);
        if (!existingStaffEntry) {
            return message.channel.send(language.not_in_database_error);
        }

        // Create buttons based on current roles
        const currentRole = existingStaffEntry.role;
        const roles = ['Head-Admin', 'Admin', 'Moderator', 'Helper']; // Remove 'OWNER' role

        const row = new MessageActionRow();
        roles.forEach(role => {
            const roleId = data.roles[role.toUpperCase()];
            if (role !== currentRole && roleId) { // Check if roleId exists
                row.addComponents(
                    new MessageButton()
                        .setCustomId(`${role}Button`)
                        .setLabel(role)
                        .setStyle('PRIMARY')
                );
            }
        });

        row.addComponents(
            new MessageButton()
                .setCustomId('removeButton')
                .setLabel('Remove')
                .setStyle('DANGER')
        );

        // Prompt user to select a role using buttons
        const promptMessage = await message.channel.send({ content: `Please select a role for ${user.username}:`, components: [row] });

        // Await button interaction
        const filter = i => i.user.id === message.author.id;
        const collector = promptMessage.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async interaction => {
            let roleName;

            if (interaction.customId === 'removeButton') {
                // Remove all staff roles from the member
                roles.forEach(async role => {
                    const roleId = data.roles[role.toUpperCase()];
                    if (roleId) {
                        const roleToRemove = message.guild.roles.cache.get(roleId);
                        if (roleToRemove && member.roles.cache.has(roleToRemove.id)) {
                            await member.roles.remove(roleToRemove);
                        }
                    }
                });

                // Update data.json with removed staff roles
                await updateStaffData(member, 'Default', data);

                // Stop collector and edit message
                await promptMessage.edit({ content: `Removed all staff roles from ${user.username}.`, components: [] });
                return collector.stop('removedAllRoles');
            }

            // Handle promote/demote based on selected role button
            roleName = interaction.customId.replace('Button', '');
            const roleId = data.roles[roleName.toUpperCase()];
            if (!roleId) {
                console.error(`Role ID for '${roleName}' not found in data.`);
                return interaction.reply({ content: language.role_not_found_error, ephemeral: true });
            }

            const selectedRole = message.guild.roles.cache.get(roleId);
            if (!selectedRole) {
                console.error(`Role '${roleName}' not found in guild.`);
                return interaction.reply({ content: language.role_not_found_error, ephemeral: true });
            }

            try {
                // Remove previous staff role if it exists
                if (currentRole !== 'Default') {
                    const prevRoleId = data.roles[currentRole.toUpperCase()];
                    const prevRole = message.guild.roles.cache.get(prevRoleId);
                    if (prevRole && member.roles.cache.has(prevRole.id)) {
                        await member.roles.remove(prevRole);
                    }
                }

                // Add the selected role
                await member.roles.add(selectedRole);

                // Update data.json with new staff information
                await updateStaffData(member, roleName, data);
                await promptMessage.edit({
                    content: `Congratulations ${user}! You have been promoted/demoted to ${selectedRole}.`,
                    components: [],
                });
            } catch (error) {
                console.error('Error setting roles:', error);
                interaction.reply({ content: 'Failed to update roles. Please try again later.', ephemeral: true });
            }
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
        // Remove the staff entry if all roles are removed
        if (roleName === 'Default') {
            // Remove the staff entry for the member
            data.staff = data.staff.filter(entry => entry.id !== member.id);
        } else {
            // Update existing entry with new role
            const existingStaffIndex = data.staff.findIndex(entry => entry.id === member.id);
            if (existingStaffIndex !== -1) {
                data.staff[existingStaffIndex].role = roleName;
            } else {
                // If somehow the member's entry doesn't exist, create a new one
                data.staff.push({ id: member.id, role: roleName });
            }
        }

        // Write updated data back to file
        await fs.writeFile('./data.json', JSON.stringify(data, null, 4));
        console.log(`Updated staff data for ${member.user.username}`);
    } catch (error) {
        console.error('Error updating staff data:', error);
    }
}
