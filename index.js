const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const modemStatus = {
    atOK: false,
    error: false
}
const modemConfig = {
    path: 'COM144',
    pin: null,
    textMode: true,
    extendedErrorReports: true
}
const port = new SerialPort(modemConfig.path, { baudRate: 230400 }, function (err) {
    if (err) {
        return console.log(`Error on opening ${modemConfig.path}:`, err.message)
    }
    //initialize modem here...

})

const parser = new Readline()
port.pipe(parser)

parser.on('data', line => console.log(`> ${line}`))
port.on('error', function (err) {
    modemStatus.error = true
    console.log('Error: ', err.message)
})
port.write('at\r', function (err) {
    if (err) {
        modemStatus.atOK = false;
        console.log('Error on write: ', err.message)
        return
    }
    console.log('modemStatus.atOK = true')
    modemStatus.atOK = true
})
port.write('at+cmgs="910"\r', function (err) {
    if (err) {
        return console.log('Error on sms header: ', err.message)
    }
    port.write('teste de modem\x1A', function (err) {
        if (err) {
            return console.log('Error on sms text: ', err.message)
        }
        console.log('SMS sent')
    })
})
//> ROBOT ONLINE