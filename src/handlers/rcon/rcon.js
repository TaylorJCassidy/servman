import net from'net';
import logger from '../../utils/logger.js'

const log = logger('rcon');
const SERVERDATA_RESPONSE_VALUE = 0;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_AUTH = 3;
const UNKNOWN_REQUEST = 'Unknown request 0';
const MAX_INT32 = 2147483647;

export default function(host, port, password) {
    let socket;
    let connected = false;

    function disconnect() {
        log(`RCON connection with ${host}:${port} closed`)
        socket.removeAllListeners('data');
        socket.removeAllListeners('error');
        socket = null;
        connected = false;
    }

    function connect() {
        return new Promise((resolve, reject) => {
            if (connected) return resolve();
            const id = Math.floor(Math.random() * MAX_INT32);
            socket = net.createConnection(port, host, () => {
                log(`RCON connection opened with ${host}:${port}`)
                socket.write(createRequest(SERVERDATA_AUTH, id, password))
            });
    
            socket.once('data', (data) => {
                const res = readResponse(data);
                if (res.type == SERVERDATA_AUTH_RESPONSE && res.id == id) {
                    log('Authenticated')
                    connected = true;
                    socket.removeAllListeners('error');
                    resolve();
                }
                else {
                    log('Failed authenticated', 'error')
                    socket.destroy();
                    reject(new Error('Auth failed'));
                }
            });

            socket.once('close', () => {
                disconnect();
            })
    
            socket.once('error', (err) => {
                log(`Failed to open RCON connection with ${host}:${port} with error: ${err}`, 'error')
                reject(err);
            });
        })
    }

    return {
        sendCommand: (body) => {
            return new Promise(async (resolve, reject) => {
                log(`Sending command ${body} to ${host}:${port}`)
                connect()
                    .then(() => {
                        const id = Math.floor(Math.random() * MAX_INT32);
                        
                        let response = '';
                        socket.on('data', (data) => {
                            const res = readResponse(data);
                            if (res.type == SERVERDATA_RESPONSE_VALUE && res.id == id) {
                                if (res.body == UNKNOWN_REQUEST) {
                                    log(`Got response: ${response}`)
                                    resolve(response);
                                }
                                else response += res.body;
                            }
                        });
            
                        socket.once('error', (err) => {
                            log(`Failed to send command ${body} to ${host}:${port} with error: ${err}`, 'error')
                            socket.destroy();
                            reject(err);
                        });
            
                        socket.write(createRequest(SERVERDATA_EXECCOMMAND, id, body));
                        socket.write(createRequest(SERVERDATA_RESPONSE_VALUE, id, ''))
                    })
                    .catch(reject)
            })
        },
        close: () => {
            socket.destroy();
        }
    };
}

function createRequest(type, id, body) {
	// Size, in bytes, of the whole packet. 
	const size = Buffer.byteLength(body) + 14;
	const buffer = Buffer.alloc(size);

	buffer.writeInt32LE(size - 4, 0);
	buffer.writeInt32LE(id, 4);
	buffer.writeInt32LE(type, 8);
	buffer.write(body, 12, size - 2, 'ascii');
	buffer.writeInt16LE(0, size - 2);

	return buffer;
};

function readResponse(buffer) {
	return {
		size: buffer.readInt32LE(0),
		id: buffer.readInt32LE(4),
		type: buffer.readInt32LE(8),
		body: buffer.toString('ascii', 12, buffer.length - 2)
    };
};