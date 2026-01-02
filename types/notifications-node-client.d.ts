declare module 'notifications-node-client' {
    export class NotifyClient {
        constructor(apiKey: string);
        sendSms(templateId: string, phoneNumber: string, options?: any): Promise<any>;
        sendEmail(templateId: string, emailAddress: string, options?: any): Promise<any>;
    }
}
