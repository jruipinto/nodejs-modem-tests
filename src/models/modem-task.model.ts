export interface ModemTask {
    id: number;
    fn: (receivedData: string) => void;
    trigger: string | 'OK\r' | '\r';
}