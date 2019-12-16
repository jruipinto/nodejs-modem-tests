import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { tap, filter, concatMap, take, map } from 'rxjs/operators';
import { clone } from 'ramda';
import SerialPort from 'serialport';
import { ModemTask, ModemConfig, SMS, DeliveredSMSReport, ReceivedSMS } from './models';
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
                    console.log(receivedData.replace('\r', '<CR>'));
                }
            }),
            tap(receivedData => {
                if (Modem.taskStack && Modem.taskStack[0] && receivedData.includes(Modem.taskStack[0].trigger)) {
                    if (Modem.status.debugMode) {
                        console.log('Meet task: ', Modem.taskStack[0].id);
                    }
                    const taskFunction = clone(Modem.taskStack[0].fn);
                    Modem.taskStack = clone(Modem.taskStack.slice(1));
                    taskFunction(receivedData);
                    if (Modem.status.debugMode) {
                        console.log('Tasks left: ', Modem.taskStack);
                    }
                }
            })
        ).subscribe();

        // init modem
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(`AT+CMGF=1\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(`AT+CNMI=1,1,0,1,0\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(`AT+CNMI=2\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(`AT+CSMP=49,167,0,0\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
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

    sendSMS({ phoneNumber, text }: SMS): Observable<DeliveredSMSReport> {
        const smsInfo$: BehaviorSubject<any> = new BehaviorSubject(null);
        let cmgsNumber: number;

        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(`AT+CMGS="${phoneNumber}"\r`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: '\r',
            fn: () => Modem.port.write(`${text}\x1A`, handleError)
        });
        Modem.addTask({
            id: Modem.generateID(),
            trigger: '+CMGS:',
            fn: receivedData => smsInfo$.next(receivedData)
        });

        return smsInfo$.pipe(
            filter(notNull),
            filter(data => data.includes('+CMGS:')),
            tap(data => { cmgsNumber = parseInt(data.split(':')[1], 10); }),
            concatMap(() => Modem.data$),
            filter(data => data.includes('+CDS:')),
            filter(data => parseInt(data.split(',')[1]) === cmgsNumber),
            map(data => {
                const cds = data
                    .split(': ')[1]
                    .split(',');
                const report: DeliveredSMSReport = {
                    firstOctet: ~~cds[0],
                    id: ~~cds[1],
                    phoneNumber: ~~cds[2].replace('"', '').replace('"', ''),
                    submitTime: cds[4].replace('"', '').replace('"', '') + ',' + cds[5].replace('"', '').replace('"', ''),
                    deliveryTime: cds[6].replace('"', '') + ',' + cds[7].replace('"', ''),
                    st: ~~cds[8]
                }
                return report
            }),
            take(1)
        );
    }

    onReceivedSMS(): Observable<ReceivedSMS> {
        let readingSMS: boolean = false;
        let newSMS: ReceivedSMS = {
            id: 0,
            phoneNumber: '',
            submitTime: '',
            text: ''
        };
        return Modem.data$.pipe(
            tap(data => {
                if (data.includes('+CMTI:')) {
                    newSMS.id = ~~data.split(',')[1]
                    Modem.addTask({
                        id: Modem.generateID(),
                        trigger: 'OK',
                        fn: () => Modem.port.write(`AT+CMGR=${~~data.split(',')[1]}\r`, handleError)
                    });
                }
                if (data.includes('+CMGR:')) {
                    readingSMS = true;
                }
            }),
            filter(data => readingSMS),
            tap(data => {
                if (data.includes('OK\r')) {
                    readingSMS = false;
                }
            }),
            map(data => {
                if (data.includes('OK\r')) {
                    newSMS.text = newSMS.text ? newSMS.text.trim() : '';
                    return newSMS;
                }
                if (data.includes('+CMGR:')) {
                    const cmgr = data.split(',');
                    newSMS.phoneNumber = cmgr[1].replace('"', '').replace('+', '00').replace('"', '');
                    newSMS.submitTime = (cmgr[3].replace('"', '') + ',' + cmgr[4].replace('"', '')).trim();
                    return null;
                }
                newSMS.text = newSMS.text ? newSMS.text + data : data;
                return null;
            }),
            filter(notNull),
            tap(() => {
                newSMS = {
                    id: 0,
                    phoneNumber: '',
                    submitTime: '',
                    text: ''
                }
            }),
            tap(({ id }) => {
                Modem.addTask({
                    id: Modem.generateID(),
                    trigger: 'OK',
                    fn: () => Modem.port.write(`AT+CMGD=${id}\r`, handleError)
                });
            })
        );
    }

    forceWrite(input: string) {
        Modem.addTask({
            id: Modem.generateID(),
            trigger: 'OK',
            fn: () => Modem.port.write(input, handleError)
        });
    }

}