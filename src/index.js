import cron from "node-cron"
import rcon from "./handlers/rcon.js"

rcon("192.168.1.16", "43205", "password")
    .then(async ({sendCommand}) => {
        console.log(await sendCommand('stop'));
    })
    .catch(err => {
        console.log(err)
    })

