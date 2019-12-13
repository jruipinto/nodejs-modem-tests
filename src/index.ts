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
    modem.forceWrite(`${line}\r\x1A`);
});

modem.onReceivedSMS().subscribe(sms => console.log('SMS Received:', sms));

modem.sendSMS({ phoneNumber: 910138725, text: 'teste de modem' })
    .subscribe(data => console.log('Delivery Report:', data));

modem.sendSMS({ phoneNumber: 910138725, text: 'teste de modem novo' })
    .subscribe(data => console.log('Delivery Report:', data));
