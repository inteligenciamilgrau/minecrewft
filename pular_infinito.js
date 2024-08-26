const mineflayer = require('mineflayer');

module.exports = {
    jumpBot: (bot) => {
        let jumpInterval;
        const bob = bot.players['BobIMG'];

        const jump = () => {
            try {
                bot.setControlState('jump', true);
                setTimeout(() => {
                    bot.setControlState('jump', false);
                    console.log('Jumped successfully!');
                }, 500);
            } catch (err) {
                console.error('Error jumping:', err);
            }
        };

        if (bob) {
            const bobEntity = bob.entity;
            bot.lookAt(bobEntity.position.offset(0, bobEntity.height, 0), true);
            //bot.chat('Looking at BobIMG!');
        } else {
            bot.chat('BobIMG not found!');
        }

        jumpInterval = setInterval(jump, 1000);

        // Clear intervals when the bot stops
        bot.on('end', () => {
            clearInterval(jumpInterval);
            lookAt();
            console.log('Pulando!');
        });
    },
    stop: (bot) => {
        bot.setControlState('jump', false);
        console.log('Stopped jumping.');
    }
};