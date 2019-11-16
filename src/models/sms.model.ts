export interface SMS {
    index: number;	                    // The memory index number, use this index to read or delete this message.
    status: 'REC READ | REC UNREAD';    // The status of this message.For received messages this can be "REC READ" or "REC UNREAD" depending on whether the messages has been read or listed before.
    from_address: number;	            // The subscriber number of the person who sent the message.
    mr: number | null;	                // The reference number of this message.Most modems keep this field empty.
    scts: Date; 	                    // The time the message was forwarded to this phone or modem.
    data: string	                    // The actual message data in plain text
}