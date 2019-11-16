"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var modemCfg = __importStar(require("../config/default.json"));
var SerialPort = require('serialport');
exports.port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, function (err) {
    if (err) {
        return console.log("Error on opening " + modemCfg.port + ":", err.message);
    }
});
