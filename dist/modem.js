"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serial_port_1 = require("./serial-port");
exports.modem = {
    status: {
        atOK: false,
        error: false
    },
    sendTextMessage: function (recipientNumberNumber, text) {
        serial_port_1.port.write("at+cmgs=\"" + recipientNumberNumber + "\"\r", function (err) {
            if (err) {
                return console.log('Error on sms header: ', err.message);
            }
            serial_port_1.port.write(text + "\u001A", function (err) {
                if (err) {
                    return console.log('Error on sms text: ', err.message);
                }
                console.log('SMS generated sucessfully');
            });
        });
    },
    init: function () {
        serial_port_1.port.write('at\r', function (err) {
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
