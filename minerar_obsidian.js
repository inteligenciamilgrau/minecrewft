const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');

module.exports = {
    mineCryingObsidian: (bot) => {
        try {
            bot.loadPlugin(pathfinder);
            const movements = new Movements(bot);
            bot.pathfinder.setMovements(movements);

            const mineBlock = async (block) => {
                try {
                    await bot.dig(block);
                    //bot.chat('Crying Obsidian minerada!');
                } catch (err) {
                    console.error('Erro ao minerar a Crying Obsidian:', err);
                    bot.chat('Erro ao minerar a Crying Obsidian.');
                }
            };

            const findAndMineCryingObsidian = () => {
                const cryingObsidian = bot.findBlock({
                    matching: (block) => block.name === 'crying_obsidian',
                    maxDistance: 64
                });

                if (cryingObsidian) {
                    const goal = new goals.GoalBlock(cryingObsidian.position.x, cryingObsidian.position.y, cryingObsidian.position.z);
                    bot.pathfinder.setGoal(goal);

                    bot.once('goal_reached', () => {
                        mineBlock(bot.blockAt(cryingObsidian.position));
                    });
                } else {
                    bot.chat('Nenhuma Crying Obsidian encontrada nas proximidades.');
                }
            };

            setInterval(() => {
                findAndMineCryingObsidian();
                console.log('Procurando por Crying Obsidian...');
            }, 5000); // Verifica a cada 5 segundos

        } catch (err) {
            console.error('Erro ao tentar minerar Crying Obsidian:', err);
            bot.chat('Ocorreu um erro ao tentar minerar Crying Obsidian.');
        }
    },
    stop: (bot) => {
        bot.pathfinder.setGoal(null); // Para o pathfinding
        console.log('Parou de minerar Crying Obsidian.');
        bot.chat('Parou de minerar Crying Obsidian.');
    }
};
