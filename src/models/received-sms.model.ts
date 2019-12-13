import { SMS } from './sms.model';

export interface ReceivedSMS extends SMS {
    submitTime: string | Date;      /** <scts> - arrival time of the message to the SC */
}
