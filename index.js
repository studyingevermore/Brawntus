// Load up the discord.js library
const Discord = require("discord.js");

// Meet the client
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

//
var farm = Number('0');

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Brawnty booted up, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(`with your mom's ${client.guilds.size} servers`);
    client.user.setUsername("Brawntus");
});

// Auto-apply the role of "tester" to newcomers (FOR BOT-HOME SERVER)
client.on('guildMemberAdd', (guildMember) => {
   guildMember.addRole(guildMember.guild.roles.find(role => role.name === "tester"));
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});
// set message listener 
client.on('message', message => {
    switch(message.content.toUpperCase()) {
        case '?RESET':
            // Check permissions
			      if(!message.member.roles.some(r=>["Admin", "Mod"].includes(r.name)) )
			      return message.reply("Sorry, you don't have permissions to use this!");
            // Refresh bot if user requesting has required privileges
            resetBot(message.channel);
            break;
    }
});

client.on('message', message => {
    switch(message.content.toUpperCase()) {
        case '?KILL':
            // Check permissions
			      if(!message.member.roles.some(r=>["Admin", "Mod"].includes(r.name)) )
			      return message.reply("Sorry, you don't have permissions to use this!");
            // Kill bot if user requesting has required privileges
            killBot(message.channel);
            break;
    }
});

// Turn bot off (destroy), then turn it back on
function resetBot(channel) {
    // Send channel a message that you're refreshing the bot 
    channel.send('Refreshing...')
    .then(msg => client.destroy())
    .then(() => client.login(config.token))
    // Send message saying that the refresh was successful
	  .then(msg => channel.send('Reboot complete.'));
}

function killBot(channel) {
    // send channel a message that you're killing bot [optional]
    channel.send('Goodbye.')
    .then(msg => client.destroy());
}

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // Ignore other bots straight up
  if(message.author.bot) return;
  
  // Ignore any message that doesn't start with the prefix in the config file.
  if(message.content.indexOf(config.prefix) !== 0) return;
  
  // Separate our "command" name, and our "arguments" for the command. 
  // e.g., if we have the message "+say Is this the real life?" 
  // , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  // Shift to lowercase for simplicity
  const command = args.shift().toLowerCase();
  
  // A few simple commands
  
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if(command === "say") {
    // This makes the bot say something and delete the message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if(command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() to understand this bit: 
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/some?
    if(!message.member.roles.some(r=>["Admin", "Mod"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if(command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if(!message.member.roles.some(r=>["Admin"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Please mention a valid member of this server");
    if(!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if(!reason) reason = "No reason provided";
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if(command === "purge") {
    // This command removes all messages from all users in the channel, up to 100.
    // Only an Admin or Mod should be able to do this.
    if(!message.member.roles.some(r=>["Admin", "Mod"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    // get the delete count, as an actual number.
    const deleteCount = parseInt(args[0], 10);
    
    // Ooooh nice, combined conditions. <3
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    // So we get our messages, and delete them. Simple enough, right?
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }
  
  if (command === "funny") {
    	// Post funny images
	number = 37;
    	imageNumber = Math.floor (Math.random() * number) + 1;
    	message.channel.send ({files: ["./images/" + imageNumber + ".png"]});
  }
	
  if (command === "hug") {
		let member = message.mentions.members.first();
		   message.channel.send(`${client.user} gave ${member.user} a hug!`, {
            file: "https://cdn.discordapp.com/attachments/555879664724213777/555913373619847172/tenor_5.gif"
			});
	}
  if (command === "+help") {
	// let member = message.mentions.members.first();
		message.reply(`**Current Commands:**\n\t++help - list commands.\n\t+ban - ban a user from the server (@ required), can give a reason or leave blank. **[ADMIN ONLY]**\n\t+kick - kick a user from the server (@ required), can give a reason or leave blank. **[ADMIN/MOD ONLY]**\n\t+purge - purge a certain amount of messages from the current channel (greater than 2, but less than 100). **[ADMIN/MOD ONLY]**\n\t+hug *@somebody* - have ${client.user} hug somebody.\n\t+say - have the bot say something.\n\t+funny - have ${client.user} post a funny image.\n\t+ping - get your current ping and ${client.user} 's current ping.`)
  }

});

client.login(config.token);
