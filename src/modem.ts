import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { tap, filter, concatMap, take, map } from 'rxjs/operators';
import { clone } from 'ramda';
import { ModemConfig } from './models/modem-config.model';
import { ModemTask } from './models/modem-task.model';
import SerialPort from 'serialport';
import { SMSDeliveryReport } from './models/sms-delivery-report.model';
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
            fn: () => Modem.port.write(`AT+CMGF=1\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`AT+CNMI=1,1,0,1,0\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`AT+CSMP=49,167,0,0\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`AT+CPMS="SM","SM","SM"\r`, handleError)
        });


    }

    private static addTask(task: ModemTask) {
        Modem.taskStack = [...Modem.taskStack, task];
        if (Modem.taskStack && Modem.taskStack.length && Modem.taskStack.length > 1) {
            return;
        }
        Modem.port.write(`\x1bAT\r`, handleError);
    }

    private static generateID() {
        Modem.tasksTotal = Modem.tasksTotal + 1;
        return Modem.tasksTotal;

    }

    sendSMS(recipientNumberNumber: number, text: string): Observable<SMSDeliveryReport> {
        const smsInfo$: BehaviorSubject<any> = new BehaviorSubject(null);
        let cmgsNumber: number;

        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(`AT+CMGS="${recipientNumberNumber}"\r`, handleError)
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
            map(data => {
                const cds = data.split(': ')[0];
                const report: SMSDeliveryReport = {
                    firstOctet: ~~cds[1],
                    id: ~~cds[2],
                    recipient: ~~cds[3],
                    submitTime: new Date(cds[5]),
                    deliveryTime: new Date(cds[6]),
                    st: ~~cds[7]
                }
                return report
            }),
            take(1)
        );
    }

    onReceivedSMS() {
        let cmgrNumber: number;
        return Modem.data$.pipe(
            filter(notNull),
            filter(data => data.split(':')[0] === '+CMTI'),
            tap(data => { cmgrNumber = parseInt(data.split(',')[1]); }),
            concatMap(() => {
                Modem.addTask({
                    id: Modem.generateID(),
                    trigger: 'OK\r',
                    fn: () => Modem.port.write(`AT+CMGR=${cmgrNumber}\r`, handleError)
                });
                return Modem.data$;
            }),
            filter(data => data.split(':')[0] === '+CMGR')
        );
    }

    forceWrite(input: string) {
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK\r',
            fn: () => Modem.port.write(input, handleError)
        });
    }

}