const config = require('./config.json');
const http = require('http');
const logger = require('./utils/logger.js')

const log = logger('server')

module.exports = function startServer(jobs) {
    http.createServer((req, res) => {
        log('Got request for url: ' + req.url)
        const pathAndParams = req.url.split('?');
        const path = pathAndParams[0];
        const params = new URLSearchParams(pathAndParams[1]);
        const pathArgs = path.substring(1).split('/');

        if (pathArgs.length == 2 && pathArgs[0] == 'jobs' && jobs.has(pathArgs[1])) {
            const job = jobs.get(pathArgs[1])
            log(`Triggered ${job.name} job via endpoint`)
            job.endpoint(params);
            res.writeHead(200, "Job started");
            res.end()
        } else {
            res.writeHead(404, "Not found");
            res.end();
        }
    }).listen(config.serverPort)
}