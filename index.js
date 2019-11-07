const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const path = 'COM144'
const port = new SerialPort(path, { baudRate: 230400 }, function (err) {
    if (err) {
        return console.log(`Error on opening ${path}:`, err.message)
    }
})

const parser = new Readline()
port.pipe(parser)

parser.on('data', line => console.log(`> ${line}`))
port.on('error', function (err) {
    console.log('Error: ', err.message)
})
port.write('at\r', function (err) {
    if (err) {
        return console.log('Error on write: ', err.message)
    }
    console.log('message written')
})
port.write('at+cmgs="918867376"\r', function (err) {
    if (err) {
        return console.log('Error on write sms header: ', err.message)
    }
    port.write('teste de modem\x1A', function (err) {
        if (err) {
            return console.log('Error on write sms text: ', err.message)
        }
        console.log('message written')
    })
})
//> ROBOT ONLINE