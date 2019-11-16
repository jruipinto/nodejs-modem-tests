"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modem_1 = require("./modem");
modem_1.modem.init();
modem_1.modem.sendTextMessage(910138725, 'teste de modem novo');
