import net from "net";

const SERVERDATA_RESPONSE_VALUE = 0;
const SERVERDATA_EXECCOMMAND = 2;
const SERVERDATA_AUTH_RESPONSE = 2;
const SERVERDATA_AUTH = 3;
const UNKNOWN_REQUEST = 'Unknown request 0';
const MAX_INT32 = 2147483647;

export default async function(host, port, password) {
    let socket;

    const sendCommand = (body) => {
        return new Promise((resolve, reject) => {
            const id = Math.floor(Math.random() * MAX_INT32);

            let response = '';
            socket.on('data', (data) => {
                const res = readResponse(data);
                if (res.type == SERVERDATA_RESPONSE_VALUE && res.id == id) {
                    if (res.body == UNKNOWN_REQUEST) resolve(response);
                    else response += res.body;
                }
            })

            socket.once('error', reject);

            socket.write(createRequest(SERVERDATA_EXECCOMMAND, id, body));
            socket.write(createRequest(SERVERDATA_RESPONSE_VALUE, id, ''))
        })
    }

    return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * MAX_INT32);
        socket = net.createConnection(port, host, () => {
            socket.write(createRequest(SERVERDATA_AUTH, id, password))
        });

        socket.once('data', (data) => {
            const res = readResponse(data);
            if (res.type != SERVERDATA_AUTH_RESPONSE) return reject(new Error('Bad response'));
            if (res.id == -1) return reject(new Error('Auth failed'));
            if (res.id == id) return resolve({sendCommand});
            else reject(new Error("Unknown error"));
        });

        socket.once('error', (err) => {
            reject(err)
        });
    })
};

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