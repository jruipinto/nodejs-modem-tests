import * as modemConfig from './config.json';
import { ModemConfig } from './modem-config.model.js';

export default {

    status: {
        atOK: false,
        error: false
    },
    sendTextMessage: (recipientNumber, text) => { },
    init: (modemConfig: ModemConfig) => { }


}