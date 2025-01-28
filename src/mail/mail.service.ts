import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
import 'moment-timezone/data/packed/latest.json';
import { SendMailDto } from './dto/send-mail.dto';
import { NewUserMailDto } from './dto/new-user-dto';
const nodemailer = require('nodemailer');


@Injectable()
export class MailService {
    sendMail(dto: SendMailDto) {
        const {MAIL_HOST,MAIL_PORT,MAIL_USER,MAIL_PASS} = process.env
        console.log(MAIL_HOST,MAIL_PORT,MAIL_USER,MAIL_PASS)
        let transporter = nodemailer.createTransport({
            host: MAIL_HOST,
            port: MAIL_PORT,
            secure: false,
            auth: {
                user: MAIL_USER,
                pass: MAIL_PASS // Ваш пароль приложения
            },
            tls: {
                ciphers: "SSLv3"
            },        
            logger: true,
            debug: true
        });

        let mailOptions = {
            from: `"Tennisschule Gorovits" <${process.env.MAIL_USER}>`,
            to: dto.recipient,
            subject: dto.subject,
            html: dto.html
        };

        // Отправьте письмо
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log('Ошибка при отправке:', error);
            }
            console.log('Сообщение отправлено: %s', info.messageId);
            console.log('URL для просмотра: %s', nodemailer.getTestMessageUrl(info));
        });

    }
    newUserAdultRegister(dto: NewUserMailDto) {
        this.sendMail({
            recipient: dto.email,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Probetraining Anmeldung</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f7f7f7;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                padding: 20px;
                                border-radius: 8px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }
                            .header {
                                text-align: center;
                                padding-bottom: 20px;
                                border-bottom: 1px solid #dddddd;
                            }
                            .content {
                                padding: 20px 0;
                                text-align: left;
                            }
                            .footer {
                                text-align: center;
                                padding-top: 20px;
                                border-top: 1px solid #dddddd;
                                font-size: 12px;
                                color: #999999;
                            }
                            .footer a {
                                color: #999999;
                                text-decoration: none;
                            }
                            .footer a:hover {
                                text-decoration: underline;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Willkommen bei Core Tennis</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.fullName},</p>
                                <p>Vielen Dank für Ihre Anmeldung zum Probetraining!</p>
                                <p>Unser Manager überprüft derzeit die von Ihnen hochgeladenen Dokumente. Sobald die Prüfung abgeschlossen ist, erhalten Sie eine Bestätigung per E-Mail mit weiteren Informationen zur Trainingseinheit.</p>
                                <p>Falls Sie nicht am Training teilnehmen können und Ihre Anmeldung stornieren möchten, klicken Sie bitte auf den folgenden Link:</p>
                                <p><a href="${dto.cancelUrl}" style="color: red; font-weight: bold;">Anmeldung stornieren</a></p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                        </div>
                    </body>
                    </html>
`,
            subject: `Registrierung Erfolgreich`
        })
    }

    newUserChildRegister(dto: NewUserMailDto) {
        this.sendMail({
            recipient: dto.email,
            html: `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Informationen zur Trainingseinheit</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f7f7f7;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        padding-bottom: 20px;
                        border-bottom: 1px solid #dddddd;
                    }
                    .content {
                        padding: 20px 0;
                        text-align: left;
                    }
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 1px solid #dddddd;
                        font-size: 12px;
                        color: #999999;
                    }
                    .footer a {
                        color: #999999;
                        text-decoration: none;
                    }
                    .footer a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Informationen zur Trainingseinheit</h1>
                    </div>
                    <div class="content">
                    <p>Sehr geehrte/r ${dto.fullName},</p>

                <p>Herzlichen Glückwunsch! Sie haben sich erfolgreich für das Probetraining angemeldet.</p>
                <p>Nachfolgend finden Sie die Details zu Ihrer Trainingseinheit:</p>

                <p><strong>📅 Zeitpunkt:</strong> ${dto.date}</p>
                <p><strong>📍 Ort:</strong> ${dto.locationName}</p>
                <p><strong>👥 Gruppe:</strong> ${dto.groupName}</p>
                <p><strong>🎾 Trainer:</strong> ${dto.trainerName}</p>

            <p>Falls Sie nicht am Training teilnehmen können und Ihre Anmeldung stornieren möchten, klicken Sie bitte auf den folgenden Link:</p>
            <p><a href="${dto.cancelUrl}" style="color: red; font-weight: bold;">Anmeldung stornieren</a></p>

                <p>Mit freundlichen Grüßen,</p>
                <p>Ihr Tennisschule Gorovits</p>

                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                    </div>
                </div>
            </body>
            </html>
            `,
            subject: `Registrierung Erfolgreich`
        })
    }



}

