export interface ModemTask {
    id: number;
    fn: () => void;
    trigger: string | 'OK' | '> ';
}