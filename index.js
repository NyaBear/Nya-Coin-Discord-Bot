const fetch = require("node-fetch");
const { Client } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');


const rest = new REST({ version: '9' }).setToken('token');
const client = new Client({ partials: ['MESSAGE', 'CHANNEL'], intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS'] });


client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).split(/ +/);
    const command = args[0].toLowerCase();

    if (command === 'deploy') {
        if (args[1] === 'track') {
            const data = new SlashCommandBuilder()
                .setName('track')
                .setDescription('A command to track how many confirmations a transaction on the blockchain network has.')
                .addStringOption(option =>
                    option.setName('network')
                        .setDescription('Choose your desired network to track.')
                        .setRequired(true)
                        .addChoice('Bitcoin', 'BTC')
                        .addChoice('Ethereum', 'ETH')
                        .addChoice('Litecoin', 'LTC')
                        .addChoice('Dogecoin', 'DOGE'))
                .addStringOption(option =>
                    option.setName('txid')
                        .setDescription('Enter the txid of the transaction.')
                        .setRequired(true));

            await rest.put(
                Routes.applicationGuildCommands(client.application.id, message.guild.id),
                { body: [data] },
            );
            console.log('Successfully deployed track command.');
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    let network = interaction.options.getString('network');
    let txid = interaction.options.getString('txid');
    await interaction.reply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.`, ephemeral: true })
    await interaction.editReply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.\n\n\☑️ Tracking\n( ${txid} ).`, ephemeral: true })
    main_logic(network, txid, interaction);
});


async function main_logic(network, txid, interaction) {
    let response;
    if (network === 'BTC') response = await fetch(`https://api.blockcypher.com/v1/btc/main/txs/${txid}`);
    if (network === 'ETH') response = await fetch(`https://api.blockcypher.com/v1/eth/main/txs/${txid}`);
    if (network === 'LTC') response = await fetch(`https://api.blockcypher.com/v1/ltc/main/txs/${txid}`);
    if (network === 'DOGE') response = await fetch(`https://api.blockcypher.com/v1/doge/main/txs/${txid}`);
    const result = await response.json().catch(console.error)
    if (result === null) return;
    if (response.status === 404) return await interaction.editReply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.\n\n\☑️ Tracking\n( ${txid} ).\n\n \❌ This txid is incorrect or you have chosen the wrong crypto currency!`, ephemeral: true });

    let confirms = result.confirmations
    await interaction.editReply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.\n\n\☑️ Tracking\n( ${txid} ).\n\n\☑️ This transaction has ( ${confirms} ) confirmations.`, ephemeral: true })
    if (confirms > 6) return await interaction.editReply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.\n\n\☑️ Tracking\n( ${txid} ).\n\n\☑️ This transaction has ( ${confirms} ) confirmations.\n\n\☑️ This transaction has been confirmed!`, ephemeral: true });
    await interaction.editReply({ content: `\☑️ You have chosen to track a transaction on the ${network} network.\n\n\☑️ Tracking\n( ${txid} ).\n\n\☑️ This transaction has ( ${confirms} ) confirmations.\n\n\☑️ This transcation is yet to be confirmed!`, ephemeral: true })
}


client.login('token').catch(e => {
    console.log(e.message)
});
