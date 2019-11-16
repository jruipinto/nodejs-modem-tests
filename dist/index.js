"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serial_port_1 = require("./serial-port");
var modem_1 = require("./modem");
var Readline = require('@serialport/parser-readline');
var parser = new Readline();
serial_port_1.port.pipe(parser);
parser.on('data', function (line) { return console.log("> " + line); });
serial_port_1.port.on('error', function (err) {
    modem_1.modem.status.error = true;
    console.log('Error: ', err.message);
});
modem_1.modem.init();
modem_1.modem.sendTextMessage(910138725, 'teste de modem novo');
// port.write('at\r', function (err) {
//     if (err) {
//         modem.status.atOK = false;
//         console.log('Error on write: ', err.message)
//         return
//     }
//     console.log('modemStatus.atOK = true')
//     modem.status.atOK = true
// })
// port.write('at+cmgs="910"\r', function (err) {
//     if (err) {
//         return console.log('Error on sms header: ', err.message)
//     }
//     port.write('teste de modem\x1A', function (err) {
//         if (err) {
//             return console.log('Error on sms text: ', err.message)
//         }
//         console.log('SMS sent')
//     })
// })
//> ROBOT ONLINE
