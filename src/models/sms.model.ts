export interface SMS {
    phoneNumber: string | number;        /** The subscriber number of the person who sent the message */
    text: string;                        /** The actual message data in plain text */
}
