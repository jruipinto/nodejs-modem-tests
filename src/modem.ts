import { Subject, BehaviorSubject } from 'rxjs';
import { tap, filter, concatMap, take } from 'rxjs/operators';
import { clone } from 'ramda';
import { ModemConfig } from './models/modem-config.model';
import { ModemTask } from './models/modem-task.model';
import SerialPort from 'serialport';
const Readline = require('@serialport/parser-readline');

const handleError = (err) => {
    if (err) {
        console.log(err.message);
    }
};
const notNull = <T>(value: T | null): value is T => value !== null;

export class Modem {

    private static taskStack: ModemTask[] = [];
    private static tasksTotal = 0;

    private static port: SerialPort;
    private static parser: any;
    private static status = {
        error: false,
        debugMode: false
    }

    private static data$: Subject<string> = new Subject();
    private static error$: Subject<string> = new Subject();

    constructor(private modemCfg: ModemConfig) {
        Modem.port = new SerialPort(modemCfg.port, { baudRate: modemCfg.baudRate }, handleError);
        Modem.status.debugMode = modemCfg.debugMode ? true : false;

        Modem.port.on('error', err => {
            if (err) {
                Modem.error$.next(err);
            }
        });
        Modem.error$.pipe(
            tap(err => {
                Modem.status.error = true;
                console.log('Modem error:', err);
            })
        ).subscribe();

        Modem.parser = Modem.port.pipe(new Readline());
        Modem.parser.on('data', receivedData => {
            if (receivedData) {
                Modem.data$.next(receivedData);
            }
        });
        Modem.data$.pipe(
            tap(receivedData => {
                if (Modem.status.debugMode) {
                    console.log('\r\n\r\n------');
                    console.log(receivedData);
                    console.log('Tasks left: ', Modem.taskStack);
                }
            }),
            tap(receivedData => {
                if (Modem.taskStack && Modem.taskStack[0] && (encodeURI(Modem.taskStack[0].trigger) === encodeURI(receivedData.split(':')[0]))) {
                    if (Modem.status.debugMode) {
                        console.log('Meet task: ', Modem.taskStack[0].id);
                    }
                    const taskFunction = clone(Modem.taskStack[0].fn);
                    Modem.taskStack = clone(Modem.taskStack.slice(1));
                    taskFunction(receivedData);
                }
            })
        ).subscribe();

        // init modem
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`at+cmgf=1\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`at+cnmi=1,1,0,1,0\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`at+csmp=49,167,0,0\r`, handleError)
        });

    }

    private static addTask(task: ModemTask) {
        Modem.taskStack = [...Modem.taskStack, task];
        if (Modem.taskStack && Modem.taskStack.length && Modem.taskStack.length > 1) {
            return;
        }
        Modem.port.write(`\x1bat\r`, handleError);
    }

    private static generateID() {
        Modem.tasksTotal = Modem.tasksTotal + 1;
        return Modem.tasksTotal;

    }

    sendSMS(recipientNumberNumber: number, text: string) {
        const smsInfo$: BehaviorSubject<any> = new BehaviorSubject(null);
        let cmgsNumber: number;

        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`at+cmgs="${recipientNumberNumber}"\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: '\r',
            fn: () => Modem.port.write(`${text}\x1A`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: '+CMGS',
            fn: receivedData => smsInfo$.next(receivedData)
        });

        return smsInfo$.pipe(
            filter(notNull),
            filter(data => data.split(':')[0] === '+CMGS'),
            tap(data => { cmgsNumber = parseInt(data.split(':')[1], 10); }),
            concatMap(() => Modem.data$),
            filter(data => data.split(':')[0] === '+CDS'),
            filter(data => parseInt(data.split(',')[1]) === cmgsNumber),
            take(1)
        );
    }

    onReceivedSMS() {
        return Modem.data$.pipe(
            filter(notNull),
            filter(data => data.split(':')[0] === '+CMTI')
        )
    }

    forceWrite(input: string) {
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(input, handleError)
        });
    }

}