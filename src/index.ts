//import { modem } from './modem'
import { Modem } from './modem';
import { modemConfig } from '../config/default.json';


const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const mdm = new Modem(modemConfig);

rl.on('line', (line: any) => {

    const arg = line.split(', ');
    if (arg[0] === 'send') {
        mdm.sendTextMessage(arg[1], arg[2]);
        return
    }

    mdm.forceWrite(`${line}\r\x1A`);
})


mdm.sendTextMessage(910138725, 'teste de modem novo');


// modem.init(modemConfig)
// // modem.sendTextMessage(910138725, 'teste de modem novo')

// const readline = require('readline');
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// })

// rl.on('line', (line) => {
//     modem.forceWrite(`${line}\r\x1A`)
// })