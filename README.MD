NOTICATIONS


SMS status report notification:
+CDS

example:
+CDS: 6,30,"+351910138725",145,"19/11/25,13:49:22+00","19/11/25,13:49:25+00",0  // no explanation yet



SMS received notification:
+CMTI

example:
+CMTI: "SM",2   // "SM" is memory location and 2 is the index



AT WRITING COMMANDS

configure status reports to be received on computer:
AT+CSMP=49,167,0,0      // further investigation needed but works (modem answer: 'OK')
                        // https://www.smssolutions.net/tutorials/gsm/sendsmsat/
                        // http://www.testech-elect.com/enfora/tutorial_send_receive_sms_using_gsm_modem.htm

Configure notifications command:
at+cnmi

example:
at+cnmi=1,1,0,1,0       // AT+CNMI=2,2,0,1,0 would be better if possible (modem answer: 'OK')



Configure SMS modem mode:
at+cmgf

example:
at+cmgf=1               // configure to text mode (modem answer: 'OK')



Configure memory for SMS comand:
at+cpms

example:
at+cpms="sm","sm","sm"               // configure memory for SMS as "SM" wich is SIM card
                                    // (modem answer: 'OK')



Write SMS:
at+cmgs

example:
at+cmgs="910138725"/r   // (modem answer: '> ')
(wait 200ms)
my text message/x1A
    // this example is for text mode (/x1A is hexadecimal character CTRL+Z)
    // (modem answer: '+CMGS: 41' then 'OK')






(read https://www.sparkfun.com/datasheets/Cellular%20Modules/AT_Commands_Reference_Guide_r0.pdf for more info)