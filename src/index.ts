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
        modem.sendSMS({ phoneNumber: arg[1], text: arg[2] })
            .subscribe(data => {
                console.log('Delivery Report:', data);
            });
        return
    }
    console.log('to send a message over the cmd please write it like the following: send, <phoneNumber>, <message>')
});

modem.onReceivedSMS().subscribe(sms => console.log('SMS Received:\r\n', sms, '\r\n'));

let i: number = 0
let count: number = 0;
while (i < 3) {
    console.log(`sending ${i}...`);
    console.log('\r\n');
    modem.sendSMS({ phoneNumber: 910138725, text: `teste de modem ${i}` })
        .subscribe(data => {
            console.log('Delivery Report:\r\n', data);
            console.log(count);
            console.log('\r\n');
            count = count + 1;
        });
    i = i + 1;
}
