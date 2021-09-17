const Discord = require('discord.js');
const { MessageEmbed, MessageButton, MessageActionRow, WebhookClient } = require('discord.js');
const config = require('./botconfig/config.json');
const ee = require('./botconfig/embed.json');
const enmap = require('enmap');
const jsdom = require('jsdom');
const fs = require('fs');
const { measureMemory } = require('vm');
const { JSDOM } = jsdom;
const dom = new JSDOM();
const document = dom.window.document;
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING
    ],
    allowedMentions: {
        parse: ["users", "roles"], repliedUser: false
    },
    partials: ["CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION", "USER"]
});
client.slashCommands = new Discord.Collection();

client.stats = new enmap({
    name: 'stats'
});
client.tr = new enmap({
    name: 'tr'
})
client.setup = new enmap({
    name: 'setup'
})
client.antispam = new enmap({
    name: 'antispam'
})


client.on('ready', () => {
    client.stats.ensure("counter", 0);
    client.tr.ensure("ff", 0);
    console.log('Bot is Online!');
    let state = 0;
    setInterval(() => {
        state++;
        if (state === 1) client.user.setActivity(`${config.prefix}help`, { type: "LISTENING" });
        else if (state === 2) client.user.setActivity('www.ticket-tool.eu', { type: "PLAYING" });
        else if (state === 3) {
            client.user.setActivity(`on ${client.stats.get("counter")} Tickets`, { type: "WATCHING" });
            state = 0;
        }
    }, 15 * 1000);
    require('./server/server')(client)
    console.log((Date.now() / 1000).toFixed(0))
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'help') {
        const embed = new MessageEmbed()
            .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
            .setDescription(`\`Ticket-System\`\n\n> ${config.prefix}setup\n\n> ${config.prefix}edit-setup`)
            .setColor(ee.color)
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } else if (interaction.commandName === 'ping') {
        const embed = new MessageEmbed()
            .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
            .setDescription(`The Ping is ${client.ws.ping} ms`)
            .setColor(ee.color)
        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
            description: 'ping pong!'
        });
    } else if (interaction.commandName === 'invite') {
        const embed = new MessageEmbed()
            .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
            .setDescription(`Click **[here](https://discord.com/api/oauth2/authorize?client_id=776880644990435338&permissions=8&scope=applications.commands%20bot)** to invite The Bot`)
            .setColor(ee.color)
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } else if (interaction.commandName === 'info') {
        const embed = new MessageEmbed()
            .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
            .setDescription(`${client.user.tag} is on ${client.guilds.cache.size} Server and he can see ${client.users.cache.size} Users`)
            .addField('Support Tickets', `I create ${client.stats.get("counter")} Support Tickets`)
            .setColor(ee.color)
        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
});

client.on("messageCreate", async message => {
    client.setup.ensure(message.guild.id, {
        ticketmessage: "\`Support will be with you shortl.\nTo close this ticket react with\` **🔒**"
    })
    let msgArray = message.content.split(" "); // Splits the message content with space as a delimiter
    let cmd = msgArray[0].replace(config.prefix, ""); // Gets the first element of msgArray and removes the prefix
    let args = msgArray.slice(1); // Remove the first element of msgArray/command and this basically returns the arguments

    if (message.author.bot || !message.guild) return
    if (message.content.startsWith(`${config.prefix}help`)) {
        const embed = new MessageEmbed()
            .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
            .setDescription(`\`Ticket-System\`\n\n> ${config.prefix}setup\n\n> ${config.prefix}edit-setup\n\n`)
            .setColor(ee.color)
        await message.channel.send({
            embeds: [embed],
            ephemeral: true
        });
    }
    if (message.content.startsWith(`${config.prefix}setup`)) {
        if (!message.channel.parent) {
            let embed = new MessageEmbed().setColor(ee.error)

            embed.setTitle(`🔴 | Your text channel has no category!`)
            return message.channel.send({ embeds: [embed] });
        }
        const embed2 = new MessageEmbed()
            .setTitle(`😁 | Are you sure you want the setup ? `)
            .setColor(ee.color)
            .setDescription(`I will set \`${message.channel.parent.name}\` as the category, \`${message.channel.name}\` as the text channel\nYou cant edit the Setup with \`${config.prefix}edit-setup\``)
        let yes = 'yes'
        let no = 'no'
        let row = new MessageActionRow().addComponents(
            new MessageButton().setLabel(yes).setStyle("SUCCESS").setCustomId("ja"),
            new MessageButton().setLabel(no).setStyle("SECONDARY").setCustomId("nein")
        )
        message.channel.send({ embeds: [embed2], components: [row] }).then(async (msg) => {
            let filter = (interaction) => interaction.user.id === message.author.id;
            let collector = await message.channel.createMessageComponentCollector({ filter, max: 1, time: 30000 });
            collector.on("collect", async (interaction) => {
                if (interaction.customId === 'ja') {
                    interaction.message.delete()
                    const embed = new MessageEmbed()
                        .setColor(ee.color)
                        .setAuthor(message.guild.name, message.guild.iconURL({
                            dynamic: true
                        }))
                        .setDescription(
                            "__**How to make a ticket**__\n" +


                            "> Click on the reaction that relates to your need\n" +

                            "> Once the ticket is made you will be able to type in there"

                        )

                    const bt = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('oäfesihseäpfjpwoejfüpfküpskfeüßpsefgrg78778rg78rg75dfväofupweifuhpwoefupw0euf')
                                .setLabel('🎫 Create Ticket!')
                                .setStyle('PRIMARY'),
                        );

                    message.channel.send({
                        embeds: [embed],
                        components: [bt]
                    });

                    const webhookClient = new WebhookClient({ url: 'https://discord.com/api/webhooks/888427638627106867/boXrozqswIdYEss1MbUDggaGbtq5xLdbTZR27ufuY01Lj1f6ph5qgUwj2f8sw7_eEdc3' });

                    const ff = new MessageEmbed()
                        .setTitle('NEW SETUP')
                        .setColor(ee.color)
                        .setDescription(`**Server Name**: \`${message.guild.name} (${message.guild.id})\`\n\n**Channel Id**: \`${message.channel.id}\``)
                        .setFooter('LOG | Ticket-Tool', client.user.avatarURL({ dynamic: true }))
                        .setTimestamp()

                    webhookClient.send({
                        embeds: [ff]
                    });
                } else if (interaction.customId === 'nein') {
                    interaction.message.delete()
                }
            })
        })
    }
    if (cmd === `edit-ticketmessage`) {
        if (!message.member.permissions.has(Discord.Permissions.FLAGS.MANAGE_GUILD)) {
            const embed = new MessageEmbed()
                .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
                .setDescription(`You Dont have the Permission to do that!!!`)
                .setColor(ee.error)

            message.reply({
                embeds: [embed],
                ephemeral: true
            })
        }
        if (!message.guild.me.permissions.has(Discord.Permissions.FLAGS.MANAGE_CHANNELS) || !message.guild.me.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) {
            const embed = new MessageEmbed()
                .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
                .setDescription(`Please Give me permissions: \`MANAGE_GUILD\` & \`MANAGE_CHANNELS\` & \`MANAGE_MESSAGES\`\n\nThats are the permissions to use 100% the Bot`)
                .setColor(ee.error)
            message.reply({
                embeds: [embed],
                ephemeral: true
            })
        }
        console.log(args)
        if (!args[0]) {
            const embed = new MessageEmbed()
                .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
                .setDescription(`Please enter a message example: \`${config.prefix}edit-ticketmessage <text>\``)
                .setColor(ee.error)
            return message.reply({
                embeds: [embed],
                ephemeral: true
            })
        }



    }
});

client.on("interactionCreate", async (interaction) => {
    client.antispam.ensure(`${interaction.guild.id}-${interaction.user.id}`, {
        user: false
    })
    client.setup.ensure(interaction.guild.id, {
        ticketmessage: "\`Support will be with you shortl.\nTo close this ticket react with\` **🔒**"
    })
    if (interaction.isButton()) {
        await interaction.deferUpdate();
        if (interaction.customId === 'oäfesihseäpfjpwoejfüpfküpskfeüßpsefgrg78778rg78rg75dfväofupweifuhpwoefupw0euf') {
            const ticketname = `ticket-${interaction.member.user.username.toLowerCase()}`
            const channels = interaction.guild.channels.cache.map(cha => cha);
            let alreadyticket = client.antispam.get(`${interaction.guild.id}-${interaction.user.id}`, "user")
            if (client.antispam.get(`${interaction.guild.id}-${interaction.user.id}`, "user") === true) {
                const ff = new MessageEmbed()
                    .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }))
                    .setDescription(`You already have a Ticket: ${alreadyticket}`)
                    .setFooter(client.user.tag, client.user.avatarURL({ dynamic: true }))
                    .setColor(ee.color)
                return interaction.followUp({
                    ephemeral: true,
                    embeds: [ff]
                })
            }

            client.stats.inc("counter");
            const ch = await interaction.guild.channels.create(ticketname, {
                type: 'GUILD_TEXT',
                topic: `ticket-${interaction.user.id}`,
                parent: interaction.channel.parentId,
                permissionOverwrites: [{
                    id: interaction.guild.id,
                    allow: ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS'],
                    deny: ['VIEW_CHANNEL', 'CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'ADD_REACTIONS', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS', 'MENTION_EVERYONE', 'EMBED_LINKS', 'ATTACH_FILES']
                },
                {
                    id: client.user.id,
                    allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
                },
                {
                    id: interaction.member.user.id,
                    allow: ['VIEW_CHANNEL']
                }]
            })
            client.antispam.set(`${interaction.guild.id}-${interaction.user.id}`, true, "user")
            let nsg
            nsg = client.setup.get(interaction.guild.id, "ticketmessage")
            const embed = new MessageEmbed()
                .setDescription(nsg)
                .setColor(ee.color)
                .setTimestamp()
                .setAuthor(interaction.guild.name, interaction.guild.iconURL({
                    dynamic: true
                }));

            const del = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('dpfijosepofjpseojfsp#äoejhgr#pdorgjvpdofvj0eüpfiüep#fikaowüjefdpowhjfpofsjhe0pß')
                        .setLabel('🔒 Close Ticket!')
                        .setStyle('DANGER'),
                );
            ch.send({
                content: `Welcome <@${interaction.user.id}>`,
                embeds: [embed],
                components: [del]
            }).then(interaction.followUp({
                content: 'Created Ticket!',
                ephemeral: true
            }))
            console.log(`Created channel: ${ch.name}`);
        } else if (interaction.customId === 'dpfijosepofjpseojfsp#äoejhgr#pdorgjvpdofvj0eüpfiüep#fikaowüjefdpowhjfpofsjhe0pß') {

            const sh = interaction.channel
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('rgtpijhuredg+pihrgp+ihsräglfihsdälvfknsäoligfrhbäoiurghwäouigrhäloiehfälikhfe')
                        .setLabel('🔒 delete Ticket!')
                        .setStyle('DANGER'),
                    new MessageButton()
                        .setCustomId('gäjogf#pwojfüpefkpihgvüorigh+9hzergf+wp9eoufhp#ofjdö#ojfhfeiehf0ow9efhzßd09fuoewjfpjf')
                        .setLabel('✌ i need mor help')
                        .setStyle('SECONDARY')
                );
            const embed = new MessageEmbed()
                .setAuthor(client.user.tag, client.user.avatarURL({ dynamic: true }), 'https://www.ticket-tool.eu')
                .setDescription(`Do you really want to close the ticket?`)
                .setColor(ee.color)
            sh.send({
                embeds: [embed],
                components: [row]
            })

        } else if (interaction.customId === 'rgtpijhuredg+pihrgp+ihsräglfihsdälvfknsäoligfrhbäoiurghwäouigrhäloiehfälikhfe') {
            let messageCollection = new Discord.Collection();
            let channelMessages = await interaction.channel.messages.fetch({//fetch the last 100 messages
                limit: 100
            }).catch(err => console.log(err)); //catch any error
            let msglimit = 500
            messageCollection = messageCollection.concat(channelMessages); //add them to the Collection
            let tomanymsgs = 1; //some calculation for the messagelimit
            if (Number(msglimit) === 0) msglimit = 100; //if its 0 set it to 100
            let messagelimit = Number(msglimit) / 100; //devide it by 100 to get a counter
            if (messagelimit < 1) messagelimit = 1; //set the counter to 1 if its under 1
            while (channelMessages.size === 100) { //make a loop if there are more then 100 messages in this channel to fetch
                if (tomanymsgs === messagelimit) break; //if the counter equals to the limit stop the loop
                tomanymsgs += 1; //add 1 to the counter
                let lastMessageId = channelMessages.lastKey(); //get key of the already fetched messages above
                channelMessages = await interaction.channel.messages.fetch({ limit: 100, before: lastMessageId }).catch(err => console.log(err)); //Fetch again, 100 messages above the already fetched messages
                if (channelMessages) //if its true
                    messageCollection = messageCollection.concat(channelMessages); //add them to the collection
            }
            let msgs = [...messageCollection.values()].reverse()
            try {
                return new Promise(async (ful) => {
                    await fs.readFile(require('path').join(__dirname, 'template.html'), 'utf8', async function (err, data) {
                        if (data) {
                            fs.mkdir(`views/tr/${interaction.guild.id}`, (err, dir) => {
                                if (err) console.log("Error:", err);
                            })
                            delay(20)
                            fs.mkdir(`views/tr/${interaction.guild.id}/${interaction.channel.id}`, (err, dir) => {
                                if (err) console.log("Error:", err);
                            })

                            delay(40)
                            const datei = `views/tr/${interaction.guild.id}/${interaction.channel.id}/index.html`
                            await fs.writeFile(require('path').join(__dirname, `${datei}`), data, async function (err) {
                                if (err) return console.log(err)
                                let info = document.createElement('div')
                                info.className = 'info';
                                let iconClass = document.createElement('div')
                                iconClass.className = 'info__guild-icon-container';
                                let guild__icon = document.createElement('img')
                                guild__icon.className = 'info__guild-icon'
                                guild__icon.setAttribute('src', interaction.guild.iconURL())
                                iconClass.appendChild(guild__icon)
                                info.appendChild(iconClass)

                                let info__metadata = document.createElement('div')
                                info__metadata.className = 'info__metadata'

                                let guildName = document.createElement('div')
                                guildName.className = 'info__guild-name'
                                let gName = document.createTextNode(interaction.guild.name);
                                guildName.appendChild(gName)
                                info__metadata.appendChild(guildName)

                                let channelName = document.createElement('div')
                                channelName.className = 'info__channel-name'
                                let cName = document.createTextNode(interaction.channel.name);
                                channelName.appendChild(cName)
                                info__metadata.appendChild(channelName)

                                let messagecount = document.createElement('div')
                                messagecount.className = 'info__channel-message-count'
                                // messagecount.appendChild(document.createTextNode(`Fetched ${numberOfMessages} Messages:`))
                                messagecount.appendChild(document.createTextNode(`Fetched Messages: ${msgs.length}`))
                                info__metadata.appendChild(messagecount)
                                info.appendChild(info__metadata)
                                let hr = document.createElement('hr')
                                info__metadata.appendChild(hr)
                                await fs.appendFile(require('path').join(__dirname, `${datei}`), info.outerHTML, async function (err) {
                                    if (err) return console.log(err)
                                    msgs.forEach(async msg => {
                                        let parentContainer = document.createElement("div");
                                        parentContainer.className = "parent-container";
                                        let avatarDiv = document.createElement("div");
                                        avatarDiv.className = "avatar-container";
                                        let img = document.createElement('img');
                                        img.setAttribute('src', msg.author.displayAvatarURL());
                                        img.className = "avatar";
                                        avatarDiv.appendChild(img);

                                        parentContainer.appendChild(avatarDiv);

                                        let messageContainer = document.createElement('div');
                                        messageContainer.className = "message-container";

                                        let nameElement = document.createElement("span");
                                        let name = document.createTextNode(msg.author.tag);
                                        nameElement.appendChild(name);
                                        messageContainer.append(nameElement);

                                        if (msg.content.startsWith("```")) {
                                            let m = msg.content.replace(/```/g, "");
                                            let codeNode = document.createElement("code");
                                            let textNode = document.createTextNode(m);
                                            codeNode.appendChild(textNode);
                                            messageContainer.appendChild(codeNode);
                                        }
                                        else {
                                            let msgNode = document.createElement('span');
                                            let textNode = document.createTextNode(msg.content);
                                            msgNode.append(textNode);
                                            messageContainer.appendChild(msgNode);
                                        }
                                        parentContainer.appendChild(messageContainer);
                                        await fs.appendFile(require('path').join(__dirname, `${datei}`), parentContainer.outerHTML, function (err) {
                                            if (err) return console.log(err)
                                        })
                                    });
                                    fs.readFile(require('path').join(__dirname, `${datei}`), (err, data) => {
                                        if (err) console.log(err)
                                        ful(data)
                                    })
                                    delay(2)
                                    let dj = interaction.channel.topic.replace('ticket-', '')
                                    const embed = new MessageEmbed()
                                        .setAuthor(client.user.tag, client.user.avatarURL({ format: "png", dynamic: true, size: 64 }), 'https://ticket-tool.eu')
                                        .setColor(ee.color)
                                        .addField('Ticket Owner', `<@${dj}>`, true)
                                        .addField('Ticket Name', `${interaction.channel.name}`, true)
                                        .addField('Direct Link', `**[Clicke here](https://ticket-tool.eu/tr/${interaction.guild.id}/${interaction.channel.id})**`)


                                        .setFooter(client.user.tag, client.user.avatarURL({ format: "png", dynamic: true, size: 64 }))
                                    // interaction.channel.send({
                                    //     embeds: [embed],
                                    //     files: [`views/${interaction.guild.id}${interaction.channel.id}.html`]
                                    // })
                                    let msg = interaction.message;
                                    for (let button of msg.components[0].components) button.setDisabled(true);
                                    let row2 = new MessageActionRow().addComponents(
                                        new MessageButton()
                                            .setLabel('Delete Now')
                                            .setStyle("DANGER")
                                            .setCustomId("fepwäiefpowisefhpoihjefpidhjfnvpsodjfv#sefoüujwe#f9oujgp#oijusegp#fosjueg#sodojfvpsihfepiosf")
                                    )
                                    await msg.edit({
                                        embeds: [embed],
                                        components: [msg.components[0], row2],
                                        files: [`views/tr/${interaction.guild.id}/${interaction.channel.id}/index.html`]
                                    });
                                    const webhookClient = new WebhookClient({ url: 'https://discord.com/api/webhooks/888427638627106867/boXrozqswIdYEss1MbUDggaGbtq5xLdbTZR27ufuY01Lj1f6ph5qgUwj2f8sw7_eEdc3' });
                                    webhookClient.send({
                                        files: [`views/tr/${interaction.guild.id}/${interaction.channel.id}/index.html`],
                                        embeds: [embed],
                                    })
                                })
                            })
                        }
                    })

                })

            } catch (err) {
                return console.log(String(err))
            }



        } else if (interaction.customId === 'gäjogf#pwojfüpefkpihgvüorigh+9hzergf+wp9eoufhp#ofjdö#ojfhfeiehf0ow9efhzßd09fuoewjfpjf') {

            interaction.message.delete()

        } else if (interaction.customId === 'fepwäiefpowisefhpoihjefpidhjfnvpsodjfv#sefoüujwe#f9oujgp#oijusegp#fosjueg#sodojfvpsihfepiosf') {
            if (interaction.channel.deletable) {
                let dj = interaction.channel.topic.replace('ticket-', '')
                client.antispam.set(`${interaction.guild.id}-${dj}`, false, "user")
                interaction.channel.delete()
            }
        }
    }
});


client.login(config.token);
function delay(ms) {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(2);
        }, ms);
      });
    } catch (err) {
      console.log(err)
    }
  };
