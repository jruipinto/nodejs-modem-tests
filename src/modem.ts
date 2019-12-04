//import { modemConfig } from '../config/default.json';
import { ModemConfig } from './models/modem-config.model';
import SerialPort from 'serialport';
import { ModemTask } from './models/modem-task.model';
const Readline = require('@serialport/parser-readline')

export class Modem {

    private static taskStack: ModemTask[];

    private static port: SerialPort;
    private static parser: any;
    private static status = {
        atOK: true,
        error: false
    }

    constructor(private modemCfg: ModemConfig) {
        Modem.port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, (err) => {
            if (err) {
                console.log(`Error on opening port`, err.message)
            }
        });

        Modem.port.on('error', (err) => {
            if (err) {
                Modem.status.error = true;
                console.log(err);
            }
        });

        Modem.parser = Modem.port.pipe(new Readline());
        Modem.parser.on('data', (data) => {

            console.log(`Modem says: ${data}`);
        })

        Modem.port.write(`at\r`);
        Modem.port.write(`at+cmgf=1\r`);
        Modem.port.write(`at+cnmi=1,1,0,1,0\r`);
        Modem.port.write(`at+csmp=49,167,0,0\r`);

    }

    private static addTask(task: ModemTask) {
        Modem.taskStack = [...Modem.taskStack, task];
    }

    sendTextMessage(recipientNumberNumber: number, text: string) {
        Modem.port.write(`at+cmgs="${recipientNumberNumber}"\r`, (err) => {
            if (err) {
                console.log(err);
            }
        });
        Modem.port.write(`${text}\x1A`, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    forceWrite(input: string) {
        Modem.port.write(input, function (err) {
            if (err) {
                console.log('Error on write: ', err.message);
                return;
            }
        });
    }

}
















// //const modemCfg: ModemConfig = modemConfig;

// // const port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, function (err: Error) {
// //     if (err) {
// //         return console.log(`Error on opening ${modemCfg.port}:`, err.message)
// //     }
// // })
// const parser = new Readline();
// const portWrite = bindCallback(port.write);
// const parserOn = port.pipe(parser);

// export const modem = {

//     status: {
//         atOK: false,
//         error: false
//     },

//     sendTextMessage: (recipientNumberNumber: number, text: string) => {
//         if (!modem.status.atOK || modem.status.error) {
//             setTimeout(() => {
//                 if (!modem.status.atOK || modem.status.error) {
//                     console.log('modemStatus:' + modem.status)
//                     return false
//                 }
//                 port.write(`at+cmgs="${recipientNumberNumber}"\r`, function (err) {
//                     if (err) {
//                         return console.log('Error on sms header: ', err.message)
//                     }

//                     port.write(`${text}\x1A`, function (err) {
//                         if (err) {
//                             return console.log('Error on sms text: ', err.message)
//                         }
//                         console.log('SMS generated sucessfully')
//                     })
//                 })
//             }, 5000);
//         }
//     },

//     init: (modemCfg: ModemConfig) => {

//         const port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, function (err: Error) {
//             if (err) {
//                 return console.log(`Error on opening ${modemCfg.port}:`, err.message)
//             }
//         })

//         const parser = new Readline()
//         port.pipe(parser)

//         parser.on('data', (line: string) => {
//             if (line === 'OK') {
//                 modem.status.atOK = true
//                 console.log('modemStatus.atOK = true')
//             }
//             console.log(`Modem says: ${line}`)
//         })
//         port.on('error', function (err) {
//             modem.status.error = true
//             console.log('Error: ', err.message)
//         })
//         // port.write(`at+cmgf=1\r`, function (err) {// configuring to text mode (at+cmgf=1 is text)
//         //     setTimeout(() => {
//         //         setTimeout(() => {
//         //             port.write('at+cnmi=1,1,0,1,0\r', function (err) { }) // configuring notifications
//         //         }, 2000)
//         //     }, 2000)
//         // })
//         // port.write(`at\r`, function (err) {
//         //     if (err) {
//         //         modem.status.atOK = false;
//         //         console.log('Error on write: ', err.message)
//         //         return
//         //     }
//         // })
//     },

//     forceWrite: (input: string) => {
//         // port.write(input, function (err) {
//         //     if (err) {
//         //         modem.status.atOK = false;
//         //         console.log('Error on write: ', err.message)
//         //         return
//         //     }
//         // })
//         portWrite(input).subscribe(
//             next => null,
//             err => {
//                 modem.status.atOK = false;
//                 console.log('Error on write: ', err.message)
//             },
//             complete => console.log('forceWrite complete')
//         )
//     }

// }

