export interface ModemConfig {
    comPort: string;
    pin: null | number;
    smsMode: 'text' | 'pdu';
    extendedErrorReports: boolean;
}