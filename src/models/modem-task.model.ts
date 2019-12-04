export interface ModemTask {
    id: number;
    fn: () => void;
    type: 'config' | 'sms';
}