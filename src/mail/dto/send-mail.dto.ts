export interface SendMailDto {
    recipient: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        path: string;
       
    }>;
}
