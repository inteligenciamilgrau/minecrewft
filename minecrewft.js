const https = require('https');
const dotenv = require('dotenv');
const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');

dotenv.config();

const DELAY_BETWEEN_MESSAGES = 2000; // 1 second delay
const chatHistory = new Map();
const PORT = 53451;
let name_default = 'ManagerCraft';
const runningModules = new Map();
const bots = new Map();

function getModulePathByName(filename) {
    return path.join(__dirname, filename + '.js');
}

async function chatWithOpenAI(bot, prompt, useJsonResponse = false) {
    const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    };

    const messages = [{ role: "system", content: "You are a helpful Minecraft assistant." }];
    for (const { prompt, response } of chatHistory.get(bot.username) || []) {
        messages.push({ role: "user", content: prompt });
        messages.push({ role: "assistant", content: response });
    }
    messages.push({ role: "user", content: prompt });

    const body = JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.1,
        max_tokens: 16384,
        ...(useJsonResponse && { response_format: { "type": "json_object" } }),
    });

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const response = JSON.parse(data);
                if (response.error) {
                    reject(response.error.message);
                } else if (response.choices && response.choices.length > 0) {
                    resolve(response.choices[0].message.content.trim());
                } else {
                    reject('Sorry, I couldn\'t generate a response.');
                }
            });
        });

        req.on('error', (e) => {
            console.error('Error:', e);
            reject('Sorry, I couldn\'t generate a response.');
        });

        req.write(body);
        req.end();
    });
}

async function stopModule(bot, modulePath) {
    try {
        const customModule = runningModules.get(modulePath);
        if (customModule) {
            const functionName = Object.keys(customModule)[0];
            if (typeof customModule[functionName] === 'function' && typeof customModule[functionName].stop === 'function') {
                await customModule[functionName].stop(bot);
            } else if (typeof customModule.stop === 'function') {
                await customModule.stop(bot);
            }
            console.log(`Stopped module: ${modulePath}`);
            bot.chat(`Stopped module: ${modulePath}`);
        }

        // Ensure all intervals and listeners related to this module are cleared
        clearModuleRelatedIntervalsAndListeners(customModule);

        delete require.cache[require.resolve(modulePath)];
        runningModules.delete(modulePath);
    } catch (err) {
        console.error(`Error stopping module ${modulePath}:`, err);
        bot.chat(`Error stopping module: ${modulePath}`);
    }
}

function clearModuleRelatedIntervalsAndListeners(customModule) {
    if (customModule && customModule.intervals) {
        customModule.intervals.forEach(clearInterval);
    }
    if (customModule && customModule.listeners) {
        customModule.listeners.forEach(listener => bot.removeListener(listener.event, listener.handler));
    }
}

async function forceResetBot(bot) {
    try {
        bot.quit('Resetting bot...');
        bot.removeAllListeners();
        await new Promise(resolve => setTimeout(resolve, 1000));
        createBot(bot.username);
        console.log(`Bot ${bot.username} has been reset and reconnected.`);
    } catch (err) {
        console.error(`Error during bot ${bot.username} reset:`, err);
    }
}

async function clearBotActions(bot) {
    try {
        bot.clearControlStates();
        if (bot.pathfinder) {
            bot.pathfinder.setGoal(null);
        }
        chatHistory.get(bot.username).length = 0;
        for (let i = 1; i < 99999; i++) {
            clearInterval(i);
        }
        console.log(`Cleared all actions for bot ${bot.username}.`);
        bot.chat(`Cleared all actions.`);
    } catch (err) {
        console.error(`Error clearing actions for bot ${bot.username}:`, err);
        bot.chat(`Error clearing actions: ${err}`);
    }
}

async function chatWithGPT(bot, prompt) {
    //bot.chat("entrou " + bot.username + " " + prompt)
    if(bot.username != name_default){
        //bot.chat("saiu")
        console.log("Saiu " + bot.username)
        return;
    }
    if (prompt.toLowerCase().startsWith('clear ')) {
        const botName = prompt.slice(6).trim();
        
        const bot = bots.get(botName);
        if (bot) {
            for (const [modulePath] of runningModules) {
                await stopModule(bot, modulePath);
            }
            bot.chat('Cleared all running custom modules.');
            console.log('Running modules before clear:', Array.from(runningModules.keys()));
            await forceResetBot(bot);
        } else {
            bot.chat(`Bot ${botName} not found.`);
        }
        return;

    } else if (prompt.toLowerCase().startsWith('bot ')) {
        const botName = prompt.slice(4).trim();
        //bot.chat(bot.username + " - " + botName)
        
        createBot(botName);
        bot.chat(`Created new bot: ${botName}`);

    } else if (prompt.toLowerCase().startsWith('criar ')) {
        const parts = prompt.slice(6).trim().split(' ');
        const botName = parts[0];
        const filename = parts[1];
        const description = parts.slice(2).join(' ');
        const filePath = getModulePathByName(filename);

        const bot = bots.get(botName);
        if (!bot) {
            bot.chat(`Bot ${botName} not found.`);
            return;
        }

        if (runningModules.has(filePath)) {
            await stopModule(bot, filePath);
        }

        const exampleCode_1 = `
            const mineflayer = require('mineflayer');
            module.exports = {
                jumpBot: (bot) => {
                    try {
                        bot.setControlState('jump', true);
                        setTimeout(() => {
                            bot.setControlState('jump', false);
                            console.log('Jumped successfully!');
                        }, 500);
                    } catch (err) {
                        console.error('Error jumping:', err);
                    }
                },
                stop: (bot) => {
                    bot.setControlState('jump', false);
                    console.log('Stopped jumping.');
                }
            };
        `;

        const exampleCode_2 = `const mineflayer = require('mineflayer');
        const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

        module.exports = {
            followBob: (bot) => {
                try {
                    bot.loadPlugin(pathfinder);
                    const movements = new Movements(bot);
                    bot.pathfinder.setMovements(movements);
                    const followBob = () => {
                        const bob = bot.players['BobIMG'];
                        if (bob) {
                            const goal = new goals.GoalFollow(bob.entity, 1);
                            bot.pathfinder.setGoal(goal);
                        } else {
                            console.log('BobIMG not found!');
                        }
                    };
                    followBob();
                    
                } catch (err) {
                    console.error('Error following BobIMG:', err);
                }
            },
            stop: (bot) => {
                bot.pathfinder.setGoal(null);
                console.log('Stopped following BobIMG.');
            }
        };`;

        try {
            const response = await chatWithOpenAI(bot, `Generate a Mineflayer JavaScript code in JSON format with a "code" key that ${description}. Don't forget to import the required dependencies. Create a step log and a log error to display inside chat window each 5 seconds while do their job. Here's two examples of a working code that makes the bot jump:
            Example 1 - ${exampleCode_1} - Example 2 - ${exampleCode_2}`, useJsonResponse = true);
            const fileContent = JSON.parse(response).code;
            bot.chat('File content:', fileContent);
            fs.writeFileSync(filePath, fileContent);
            console.log(`Created file: ${filename}`);
            bot.chat(`Created file: ${filename}`);

            delete require.cache[require.resolve(filePath)];
            const customModule = require(filePath);
            const functionName = Object.keys(customModule)[0];
            customModule[functionName](bot);
            runningModules.set(filePath, customModule);
        } catch (err) {
            console.error('Error generating code or running the file:', err);
            bot.chat('Error creating or running the file: ' + err);
        }
    } else if (prompt.toLowerCase().startsWith('run ')) {
        const parts = prompt.slice(4).trim().split(' ');
        const botName = parts[0];

        const filename = parts[1];
        const bot = bots.get(botName);
        if (!bot) {
            bot.chat(`Bot ${botName} not found.`);
            return;
        }

        const filePath = getModulePathByName(filename);

        if (runningModules.has(filePath)) {
            await stopModule(bot, filePath);
        }

        try {
            delete require.cache[require.resolve(filePath)];
            const customModule = require(filePath);
            const functionName = Object.keys(customModule)[0];
            customModule[functionName](bot);
            runningModules.set(filePath, customModule);
            bot.chat(`Started running ${filename}`);
        } catch (err) {
            console.error('Error running the file:', err);
            bot.chat('Error running the file: ' + err);
        }
    } 
    else if (bot.username == name_default){
        try {
            const response = await chatWithOpenAI(bot, prompt);
            const sentences = response.split(/(?<=[.!?])/);
            for (const sentence of sentences) {
                if (sentence.trim() !== '') {
                    bot.chat(sentence.trim());
                    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
                }
            }
            const chatLog = chatHistory.get(bot.username) || [];
            chatLog.push({ prompt, response });
            chatHistory.set(bot.username, chatLog);
        } catch (error) {
            console.error('Error:', error);
            bot.chat('Sorry, I couldn\'t generate a response.');
        }
    }
}

function createBot(botName) {
    const bot = mineflayer.createBot({
        host: 'localhost',
        port: PORT,
        username: botName
    });


    bot.on('chat', async (username, message) => {

        //if (username !== bot.username) {
        if (username == "BobIMG") {
            console.log(`[${bot.username}] [${username}] ${message}`);
            await chatWithGPT(bot, message);
        }
    });

    bot.on('error', (err) => {
        console.error(`Bot ${bot.username} error:`, err);
    });

    bot.on('end', () => {
        console.log(`Bot ${bot.username} connection ended.`);
    });

    bots.set(botName, bot);
    chatHistory.set(botName, []);
}

// Create an initial bot
createBot(name_default);
