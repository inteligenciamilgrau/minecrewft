const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');

module.exports = {
    followPig: (bot) => {
        try {
            bot.loadPlugin(pathfinder);
            const movements = new Movements(bot);
            bot.pathfinder.setMovements(movements);

            const followNearestPig = () => {
                // Find the nearest pig entity
                const pig = bot.nearestEntity(entity => entity.name === 'pig');

                if (pig) {
                    const goal = new goals.GoalFollow(pig, 1); // Follow the pig within a 1-block range
                    bot.pathfinder.setGoal(goal, true); // true to avoid recalculating the path every tick
                    //bot.chat('Following the nearest pig!');
                } else {
                    bot.chat('No pigs nearby to follow.');
                }
            };

            setInterval(() => {
                followNearestPig();
                console.log('Searching for a pig...');
            }, 5000); // Check for pigs every 5 seconds

        } catch (err) {
            console.error('Error following pig:', err);
            bot.chat('Error occurred while trying to follow a pig.');
        }
    },
    stop: (bot) => {
        bot.pathfinder.setGoal(null); // Stop pathfinding
        console.log('Stopped following pigs.');
        bot.chat('Stopped following pigs.');
    }
};
