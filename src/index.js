const {
    Client,
    MessageEmbed
} = require('discord.js');

const token = require('./token');
const {
    devName,
    inviteLink,
    prefix,
    commands,
    color
} = require('./constants');

const fs = require('fs');
const path = require('path');
const { log } = require('console');

const audioFilesFolder = path.join(__dirname, '../audio');
const bot = new Client();

let audioFiles = [];
let botName = '';
let command = '';
let listEmbed;
let helpEmbed;
let listDescriptionText = '';

const processedCommands = commands.map(command => {
    return {
        name: prefix + command.name,
        desc: command.desc
    }
})

const formatEmbed = (embed) => {
    return embed
        .setAuthor(
            botName,
            bot.user.avatarURL(),
            inviteLink)
        .setColor(color)
}

let servers = {};

bot.login(token);

bot.on('ready', () => {

    botName = bot.user.username;
    console.log(`${botName} | ${bot.guilds.cache.array().length} servers`);

    const setActivity = () => {
        bot.user.setActivity(prefix + 'help', {
            type: 'LISTENING'
        });
    }

    setActivity();

    setInterval(() => {
        setActivity()
    }, 3600000);

    bot.guilds.cache.array().forEach(server => {
        servers[server.id] = true;
        console.log(server.name);
    })

    helpEmbed = formatEmbed(new MessageEmbed()).setTitle('Commands');
    updateHelpEmbed();
    
    listEmbed = formatEmbed(new MessageEmbed()).setTitle('Available Sounds');
    fileLoader();

    setInterval(fileLoader, 60000);
});

bot.on('guildCreate', (server) => {
    servers[server.id] = true;
    console.log(server.name);
})

bot.on('message', (msg) => {
    command = '';
    if (msg.content.charAt(0) === prefix) {
        command = msg.content.substring(1);
    }

    if (command === 'stop') {
        let vc = msg.member.voice.channel;
        if (vc) {
            vc.leave();
            servers[msg.guild.id] = true;
        }

    } else if (command === 'help') {
        msg.channel.send(helpEmbed.setFooter(`Requested by ${msg.author.tag}`, msg.author.avatarURL()).setTimestamp());

    } else if (command === 'list') {
        msg.channel.send(listEmbed.setFooter(`Requested by ${msg.author.tag}`, msg.author.avatarURL()).setTimestamp());

    } else if (audioFiles.includes(command + ".mp3")) {
        if (servers[msg.guild.id]) {
            let vc = msg.member.voice.channel;
            if (!vc) {
                return msg.reply('You need to be in a voice channel for me to play.');
            }
            vc
                .join()
                .then((con) => {
                    servers[msg.guild.id] = false;
                    con.play(`${audioFilesFolder}/${command}.mp3`).on("finish", () => {
                        servers[msg.guild.id] = true;
                    })
                })
                .catch(console.error);

        } else {
            msg.reply('I am already playing at a channel.');
        }

    } else if (command === 'invite') {
        msg.reply(inviteLink);
    }
});

function fileLoader() {
    fs.readdir(audioFilesFolder, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        listDescriptionText = '';

        files.forEach(function (name) {
            let filename = name.split('.mp3')[0];
            audioFiles.push(name)
            listDescriptionText += `\`${prefix}${filename}\`\n\n`;
            listEmbed.setDescription(listDescriptionText + `\n\n Developer: \`${devName}\``);
        });
    });
}

function updateHelpEmbed() {
    let descriptionText = '';
    for (let command of processedCommands) {
        descriptionText += `\`${command.name} :\`  ${command.desc}\n\n`
    }
    descriptionText += `\n\n Developer: \`${devName}\``;
    helpEmbed.setDescription(descriptionText);
}