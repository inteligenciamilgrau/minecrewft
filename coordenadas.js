const mineflayer = require('mineflayer');

module.exports = {
    sendCoordinates: (bot) => {
        try {
            setInterval(() => {
                const { x, y, z } = bot.entity.position;
                const coordinates = `Coordinates: X: ${Math.floor(x)}, Y: ${Math.floor(y)}, Z: ${Math.floor(z)}`;
                bot.chat(coordinates);
                console.log('Sent coordinates to chat.');
            }, 5000);
        } catch (err) {
            console.error('Error sending coordinates:', err);
            bot.chat('An error occurred while sending coordinates.');
        }
    },
    stop: (bot) => {
        clearInterval();
        console.log('Stopped sending coordinates.');
    }
};