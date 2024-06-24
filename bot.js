const { Client, Intents, Collection, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { token, prefix } = require('./config.json');
const fs = require('fs').promises;
const path = require('path');
const data = require('./data.json');
const { exec } = require('child_process');

const ticketCategoryId = '1252727210276814909';
const statusFilePath = './status.json';
const openTicketsFilePath = './open-ticket.json';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.commands = new Collection();

let ticketStatuses = {};
let openTickets = {};

async function loadTicketStatuses() {
    try {
        const data = await fs.readFile(statusFilePath, 'utf-8');
        ticketStatuses = JSON.parse(data);
    } catch (error) {
        console.error('Error loading ticket statuses:', error);
    }
}

async function saveTicketStatuses() {
    try {
        await fs.writeFile(statusFilePath, JSON.stringify(ticketStatuses, null, 2));
    } catch (error) {
        console.error('Error saving ticket statuses:', error);
    }
}

async function loadOpenTickets() {
    try {
        const data = await fs.readFile(openTicketsFilePath, 'utf-8');
        openTickets = JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, create an empty object
            openTickets = {};
            await saveOpenTickets(); // Save the empty object to create the file
        } else {
            console.error('Error loading open tickets:', error);
        }
    }
}

async function saveOpenTickets() {
    try {
        await fs.writeFile(openTicketsFilePath, JSON.stringify(openTickets, null, 2));
    } catch (error) {
        console.error('Error saving open tickets:', error);
    }
}

function getPermissionLevel(member) {
    try {
        const rolesData = data.roles;

        if (!rolesData) {
            // If rolesData is undefined or null, return 0
            return 0;
        }

        // Check if rolesData.OWNER exists and member has the role
        if (rolesData.OWNER && member.roles.cache.has(rolesData.OWNER)) {
            return 5;
        } else if (rolesData['HEAD-ADMIN'] && member.roles.cache.has(rolesData['HEAD-ADMIN'])) {
            return 4;
        } else if (rolesData.ADMIN && member.roles.cache.has(rolesData.ADMIN)) {
            return 3;
        } else if (rolesData.MODERATOR && member.roles.cache.has(rolesData.MODERATOR)) {
            return 2;
        } else if (rolesData.HELPER && member.roles.cache.has(rolesData.HELPER)) {
            return 1;
        } else {
            return 0; // Default case if no matching role found
        }
    } catch (error) {
        console.error('Error in getPermissionLevel:', error);
        return 0; // Return 0 in case of any error
    }
}

async function initialize() {
    await loadTicketStatuses();
    await loadOpenTickets();

    try {
        const commandFiles = await fs.readdir(path.join(__dirname, 'commands'));

        for (const file of commandFiles) {
            if (file.endsWith('.js')) {
                const command = require(path.join(__dirname, 'commands', file));
                client.commands.set(command.name, command);
            }
        }

        await client.login(token);
        console.log(`${client.user.tag} is alive!`);
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}

initialize();

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.find(cmd =>
        cmd.name === commandName ||
        (cmd.aliases && cmd.aliases.includes(commandName))
    );
       // Check if the command is "setup"
       if (commandName === 'setup') {
        try {
            // Execute setup.js as an external process
            exec('node setup.js', (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing setup.js:', error);
                    message.reply('Възникна грешка при изпълнението на командата!');
                    return;
                }
                console.log(stdout);
                console.error(stderr);
                message.channel.send('Setup command executed successfully!');
                setTimeout(() => {
                    try {
                        fs.unlinkSync('setup.js');
                        console.log('Deleted setup.js');
                    } catch (err) {
                        console.error('Error deleting setup.js:', err);
                    }
                }, 1000); // 1000 милисекунди = 1 секунда
            });
        } catch (error) {
            console.error(error);
            message.reply('Възникна грешка при изпълнението на командата!');
        }
        return; // Exit early if the command is "setup"
    }


    if (!command) return;



    // For other commands, perform permission checks
    const permissionLevel = getPermissionLevel(message.member);
    if (permissionLevel < command.permissionLevel) {
        return message.reply(`Нямате достатъчно разрешение (Вие сте Level: ${permissionLevel}, а ви трябва Level: ${command.permissionLevel}) за изпълнението на тази команда.`);
    }

    const rolesData = data.roles;
    const isStaff = [
        rolesData.OWNER,
        rolesData['HEAD-ADMIN'],
        rolesData.ADMIN,
        rolesData.MODERATOR,
        rolesData.HELPER
    ].some(roleID => message.member.roles.cache.has(roleID));

    if (!isStaff) {
        return message.reply('Тази команда може да бъде изпълнена само от членове на стаф.');
    }

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('Възникна грешка при изпълнението на командата!');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const rolesData = data.roles;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;

        const permissionOverwrites = [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL'],
            },
            {
                id: member.user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
            }
        ];

        // Add staff roles to permission overwrites if they exist
        ['MODERATOR', 'OWNER', 'HEAD-ADMIN', 'ADMIN', 'HELPER'].forEach(roleName => {
            const roleId = rolesData[roleName];
            if (roleId) {
                permissionOverwrites.push({
                    id: roleId,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'],
                });
            }
        });

        const ticketChannel = await guild.channels.create(`ticket-${member.user.username}`, {
            type: 'GUILD_TEXT',
            parent: ticketCategoryId,
            permissionOverwrites: permissionOverwrites,
        });

        openTickets[ticketChannel.id] = {
            creatorId: member.user.id,
            claimedBy: null
        };
        await saveOpenTickets();

        const ticketEmbed = new MessageEmbed()
            .setColor('#00b0f4')
            .setTitle(`Ticket: ${member.user.username}`)
            .setDescription('Thank you for creating a ticket. Support will be with you shortly.');

        const manageButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setStyle('SUCCESS')
            );

        await ticketChannel.send({ embeds: [ticketEmbed], components: [manageButtons] });
        await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
    } else if (interaction.customId === 'claim_ticket') {
        const ticketChannel = interaction.channel;

        if (openTickets[ticketChannel.id]?.claimedBy) {
            return interaction.reply({ content: 'This ticket has already been claimed.', ephemeral: true });
        }

        // Check if ticketChannel.id exists in openTickets
        if (openTickets[ticketChannel.id]) {
            // Update claimedBy
            openTickets[ticketChannel.id].claimedBy = interaction.user.id;
            await saveOpenTickets();
            // Modify permissions to allow interaction.user to send messages
            await ticketChannel.permissionOverwrites.edit(interaction.user, { SEND_MESSAGES: true, VIEW_CHANNEL: true });
            await interaction.reply({ content: `Ticket claimed by ${interaction.user.username}`, ephemeral: true });
        } else {
            console.error(`Ticket ${ticketChannel.id} not found in openTickets.`);
            await interaction.reply({ content: 'Ticket not found.', ephemeral: true });
        }
    } else if (interaction.customId === 'close_ticket') {
        const ticketChannel = interaction.channel;

        const confirmEmbed = new MessageEmbed()
            .setColor('#ff0000')
            .setTitle('Close Ticket')
            .setDescription('Are you sure you want to close this ticket?');

        const confirmButtons = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('confirm_close_ticket')
                    .setLabel('Yes')
                    .setStyle('DANGER'),
                new MessageButton()
                    .setCustomId('cancel_close_ticket')
                    .setLabel('No')
                    .setStyle('SECONDARY')
            );

        await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], ephemeral: true });
    } else if (interaction.customId === 'confirm_close_ticket') {
        const ticketChannel = interaction.channel;
        delete openTickets[ticketChannel.id];
        await saveOpenTickets();
        await ticketChannel.delete();
    } else if (interaction.customId === 'cancel_close_ticket') {
        await interaction.reply({ content: 'Ticket close cancelled.', ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    const ticketData = openTickets[message.channel.id];
    if (ticketData && ticketData.claimedBy && ticketData.claimedBy !== message.author.id) {
        message.delete();
    }
});

client.login(token);
