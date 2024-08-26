const mineflayer = require('mineflayer');
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
                    //bot.chat('Following BobIMG...');
                } else {
                    bot.chat('BobIMG not found!');
                }
            };

            setInterval(() => {
                followBob();
                //bot.chat('Step: Following BobIMG...');
            }, 5000);

        } catch (err) {
            bot.chat('Error following BobIMG: ' + err.message);
            console.error('Error following BobIMG:', err);
        }
    },
    stop: (bot) => {
        bot.pathfinder.setGoal(null);
        bot.chat('Stopped following BobIMG.');
        console.log('Stopped following BobIMG.');
    }
};