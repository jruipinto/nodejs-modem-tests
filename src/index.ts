import { Modem } from './modem';
import { modemConfig } from '../config/default.json';


const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const modem = new Modem(modemConfig);

rl.on('line', (line: any) => {

    const arg = line.split(', ');
    if (arg[0] === 'send') {
        modem.sendSMS(arg[1], arg[2]);
        return
    }

    modem.forceWrite(`${line}\r\x1A`);
})

modem.onReceivedSMS().subscribe(console.log);

modem.sendSMS(910138725, 'teste de modem novo')
    .subscribe(data => {
        console.log('success', data);
    });