export interface ModemConfig {
    port: string;
    baudRate: number;
    pin: null | number;
    smsMode: boolean; /* true = text; false = pdu */
    extendedErrorReports: boolean;
}