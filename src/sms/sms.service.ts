import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class SmsService {
    private client: twilio.Twilio;

    constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    console.log('Twilio SID:', accountSid);
    console.log('Twilio TOKEN:', authToken);

    this.client = twilio(accountSid, authToken);
    }

    async sendSms(to: string, body: string): Promise<string> {
        try {
        const message = await this.client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });

        console.log('Mensaje enviado con SID:', message.sid);
        return message.sid;
        } catch (error) {
            console.error('Error al enviar SMS:', error);
            throw new InternalServerErrorException('Error al enviar el mensaje SMS');
        }
    }
}

