const rcon = require('../handlers/rcon.js');
const logger = require('../utils/logger.js');

const log = logger('minecraft');

module.exports = {
    name: "minecraft",
    cron: exec,
    endpoint: exec
}

async function exec(params = null) {
    try {
        log('Starting Minecraft backup job...')
        await stopServer(process.env.MINECRAFT_HOSTNAME, process.env.MINECRAFT_PORT, process.env.MINECRAFT_PASSWORD);
    } catch(err) {
        log('Failed Minecraft backup job with error ' + err, 'error')
    }
}

function stopServer(host, port, password) {
    return new Promise(async (resolve, reject) => {
        const rc = rcon(host, port, password);
        let time = 10;

        const countdown = async () => {
            try {
                if (time == 0) {
                    clearInterval(interval);
                    await rc.sendCommand('stop')
                }
                else {
                    await rc.sendCommand(`say Server restarting in ${time--} minute(s)`)
                    resolve();
                }
            } catch(err) {
                clearInterval(interval);
                reject(err);
            }
        }

        countdown();
        const interval = setInterval(countdown, 60000)
    });
}

