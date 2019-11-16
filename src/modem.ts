import { modemConfig } from '../config/default.json';
import { ModemConfig } from './models/modem-config.model';
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const modemCfg: ModemConfig = modemConfig;

const port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, function (err: Error) {
    if (err) {
        return console.log(`Error on opening ${modemCfg.port}:`, err.message)
    }
})

export const modem = {

    status: {
        atOK: false,
        error: false
    },

    sendTextMessage: (recipientNumberNumber: number, text: string) => {
        port.write(`at+cmgs="${recipientNumberNumber}"\r`, function (err) {
            if (err) {
                return console.log('Error on sms header: ', err.message)
            }
            setTimeout(
                port.write(`${text}\x1A`, function (err) {
                    if (err) {
                        return console.log('Error on sms text: ', err.message)
                    }
                    console.log('SMS generated sucessfully')
                }),
                200
            )
        })
    },

    init: () => {
        const parser = new Readline()
        port.pipe(parser)

        parser.on('data', (line: string) => console.log(`> ${line}`))
        port.on('error', function (err) {
            modem.status.error = true
            console.log('Error: ', err.message)
        })
        port.write('at\r', function (err) {
            if (err) {
                modem.status.atOK = false;
                console.log('Error on write: ', err.message)
                return
            }
            console.log('modemStatus.atOK = true')
            modem.status.atOK = true
        })
    }


}