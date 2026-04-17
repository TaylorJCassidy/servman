const rcon = require('../handlers/rcon.js');
const logger = require('../utils/logger.js');
const config = require('../config.json');
const { spawn } = require('child_process');

const log = logger('minecraft');

const ONE_MINUTE = 60 * 1000;

module.exports = {
    name: "minecraft",
    cron: exec,
    endpoint: exec
}

async function exec(params = null) {
    try {
        log('Starting Minecraft backup job...')
        await stopServer(process.env.MINECRAFT_HOSTNAME, process.env.MINECRAFT_PORT, process.env.MINECRAFT_PASSWORD);
        await backup();
    } catch(err) {
        log('Failed Minecraft backup job with error ' + err, 'error')
    }
}

function stopServer(host, port, password) {
    return new Promise(async (resolve, reject) => {
        const rc = rcon(host, port, password);
        let time = config.minecraft.shutdownTimerMins;

        const countdown = async () => {
            try {
                if (time == 0) {
                    clearInterval(interval);
                    await rc.sendCommand('stop')
                    resolve();
                }
                else {
                    await rc.sendCommand(`say Server restarting in ${time--} minute(s)`)
                }
            } catch(err) {
                clearInterval(interval);
                reject(err);
            }
        }

        countdown();
        const interval = setInterval(countdown, ONE_MINUTE)
    });
}

function backup() {
    return new Promise(async (resolve, reject) => {
        const date = new Date();
        const dateString = `${date.getUTCFullYear}_${date.getUTCMonth}_${date.getUTCDate}`
        
        const sh = spawn(`sh ${__dirname}/../scripts/create_tarball.sh ${config.minecraft.relativeSaveLocation} world.${dateString} ${config.minecraft.relativeBackupLocation}`)
        
        sh.once('close', (code) => {
            if (code == 0) resolve()
            else errorHandler('Exit code ' + code)
        })

        const errorHandler = (err) => {
            log('Failed to tar directory with error: ' + err, 'error')
            reject();
        }

        sh.once('error', errorHandler);
        sh.stderr.once('data', errorHandler);
    });
}