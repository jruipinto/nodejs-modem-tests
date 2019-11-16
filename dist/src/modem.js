"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var default_json_1 = require("../config/default.json");
var SerialPort = require('serialport');
var Readline = require('@serialport/parser-readline');
var modemCfg = default_json_1.modemConfig;
var port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, function (err) {
    if (err) {
        return console.log("Error on opening " + modemCfg.port + ":", err.message);
    }
});
exports.modem = {
    status: {
        atOK: false,
        error: false
    },
    sendTextMessage: function (recipientNumberNumber, text) {
        port.write("at+cmgs=\"" + recipientNumberNumber + "\"\r", function (err) {
            if (err) {
                return console.log('Error on sms header: ', err.message);
            }
            setTimeout(port.write(text + "\u001A", function (err) {
                if (err) {
                    return console.log('Error on sms text: ', err.message);
                }
                console.log('SMS generated sucessfully');
            }), 200);
        });
    },
    init: function () {
        var parser = new Readline();
        port.pipe(parser);
        parser.on('data', function (line) { return console.log("> " + line); });
        port.on('error', function (err) {
            exports.modem.status.error = true;
            console.log('Error: ', err.message);
        });
        port.write('at\r', function (err) {
            if (err) {
                exports.modem.status.atOK = false;
                console.log('Error on write: ', err.message);
                return;
            }
            console.log('modemStatus.atOK = true');
            exports.modem.status.atOK = true;
        });
    }
};
