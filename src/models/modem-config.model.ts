export interface ModemConfig {
    port: string;                           /** Modem's serialport (example COM1 or dev/ttys0) */
    baudRate: number;                       /** Modem serialport baudrate */
    pin?: number | null;                    /** not implemented yet */
    smsMode?: boolean;                      /** not implemented yet (true = text; false = pdu) */
    extendedErrorReports?: boolean;         /** not implemented yet */
    debugMode?: boolean;                    /** logs every message from modem for debugging / developping purposes */
}