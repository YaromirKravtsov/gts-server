import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
import 'moment-timezone/data/packed/latest.json';
import { SendMailDto } from './dto/send-mail.dto';
import { NewUserMailDto } from './dto/new-user-dto';
import { ConfirmTrailMonthDto } from './dto/confirm-trail-month.dto';
import * as path from 'path';
const nodemailer = require('nodemailer');


@Injectable()
export class MailService {
    async sendMail(dto: SendMailDto) {
        const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;
        console.log(MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS);

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

        // Добавляем attachments, если они есть в dto
        let mailOptions = {
            from: `"Tennisschule Gorovits" <${process.env.MAIL_USER}>`,
            to: dto.recipient,
            subject: dto.subject,
            html: dto.html,
            attachments: dto.attachments // <-- Обязательно передаем attachments
        };

        // Отправляем письмо
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log('Ошибка при отправке:', error);
            }
            console.log('Сообщение отправлено: %s', info.messageId);
            console.log('URL для просмотра: %s', nodemailer.getTestMessageUrl(info));
        });
    }


    async newUserRegister(dto: NewUserMailDto) {
        await this.sendMail({
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
                                <h1>Willkommen bei Tennisschule Gorovits</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.fullName},</p>
                                <p>Vielen Dank für Ihre Anmeldung zum Probemonat!</p>
                                <p>Unser Manager überprüft derzeit die von Ihnen hochgeladenen Dokumente. Sobald die Prüfung abgeschlossen ist, erhalten Sie eine Bestätigung per E-Mail mit weiteren Informationen zur Trainingseinheit.</p>
                                <p>Falls Sie nicht am Training teilnehmen können und Ihre Anmeldung stornieren möchten, klicken Sie bitte auf den folgenden Link:</p>
                               <!--   <p><a href="${dto.cancelUrl}" style="color: red; font-weight: bold;">Anmeldung stornieren</a></p> -->
                                <p>Bitte beachten Sie, dass eine Stornierung nur möglich ist, wenn diese mindestens 24 Stunden vor Beginn des Trainings erfolgt.</p>
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

    async newTrainerRegister(dto: {
        email: string;
        username: string;
        password: string;
    }) {
        await this.sendMail({
            recipient: dto.email,
            subject: 'Trainer Registrierung Erfolgreich',
            html: `<!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trainer Registrierung</title>
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
                <h1>Willkommen bei Tennisschule Gorovits</h1>
            </div>
            <div class="content">
                <p>Sehr geehrte/r ${dto.username},</p>
                <p>Ihre Registrierung als Trainer/in bei der Tennisschule Gorovits war erfolgreich!</p>
                <p>Bitte verwenden Sie die folgenden Zugangsdaten, um sich in unserem System anzumelden und Ihr Profil zu vervollständigen:</p>
                <p><strong>Benutzername:</strong> ${dto.username}</p>
                <p><strong>Passwort:</strong> ${dto.password}</p>
                <p>Wir freuen uns auf eine erfolgreiche Zusammenarbeit!</p>
                <p>Mit freundlichen Grüßen,</p>
                <p>Tennisschule Gorovits</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
            </div>
        </div>
    </body>
    </html>`
        });
    }


    async confirmTrialMonth(dto: ConfirmTrailMonthDto) {
        await this.sendMail({
            recipient: dto.email,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Probetraining Bestätigung</title>
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
                                <h1>Dokumente geprüft – Starten Sie Ihren Testmonat!</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.fullName},</p>
                                <p>Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Dokumente erfolgreich geprüft wurden. Sie können nun mit Ihrem Probemonat beginnen!</p>
                                <p>Sie haben <strong>${dto.valueOfTrainings} Trainingseinheiten</strong> in Ihrem Testmonat zur Verfügung.</p>
                                <h3>Wie registrieren Sie sich für ein Training?</h3>
                                <ol>
                                    <li>Wählen Sie eine Trainingseinheit aus, die Sie besuchen möchten.</li>
                                    <li>Klicken Sie auf <strong>"Anmelden"</strong>.</li>
                                    <li>Scrollen Sie nach unten und wählen Sie <strong>"Ich befinde mich bereits im Testmonat."</strong>.</li>
                                    <li>Geben Sie Ihre E-Mail-Adresse ein und bestätigen Sie diese.</li>
                                    <li>Sobald die Registrierung abgeschlossen ist, erhalten Sie eine Bestätigungs-E-Mail.</li>
                                </ol>
                                ${dto.nextTraining ? `
                                <h3>Ihre nächste geplante Trainingseinheit:</h3>
                                <ul>
                                    <li><strong>Datum:</strong> ${dto.nextTraining.date}</li>
                                    <li><strong>Gruppe:</strong> ${dto.nextTraining.group}</li>
                                    <li><strong>Ort:</strong> ${dto.nextTraining.location}</li>
                                    ${dto.nextTraining.trainer ? `<li><strong>Trainer:</strong> ${dto.nextTraining.trainer}</li>` : ''}
                                </ul>` : ''}
                                <p>Falls Sie Fragen haben, können Sie sich gerne an unser Team wenden.</p>
                                <p>Wir wünschen Ihnen viel Spaß und Erfolg bei Ihrem Probemonat!</p>
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
            subject: `Starten Sie Ihren Probemonat`
        });
    }

    async confirmEmailAndSendFile(username: string, email: string, link: string) {
        // HTML-содержимое письма на немецком языке
        const htmlContent = `<!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registrierungsbestätigung</title>
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
            .button {
                display: inline-block;
                padding: 10px 20px;
                font-size: 16px;
                color: #ffffff;
                background-color: #28a745;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Vielen Dank für Ihre Registrierung!</h1>
            </div>
            <div class="content">
                <p>Hallo ${username},</p>
                <p>vielen Dank für Ihre Anmeldung. Bitte füllen Sie das beigefügte Dokument aus und senden Sie es über den folgenden Link zurück, damit unser Administrator Ihre Daten prüfen und Sie zu einem Probetraining zulassen kann.</p>
                <p style="text-align: center;">
                    <a class="button" href="${link}" target="_blank">Dokument absenden</a>
                </p>
                <p>Falls Sie sich nicht registriert haben, ignorieren Sie bitte diese Nachricht.</p>
                <p>Mit freundlichen Grüßen,</p>
                <p>Tennisschule Gorovits</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
            </div>
        </div>
    </body>
    </html>`;
        const filePath = path.resolve(process.cwd(), 'static', 'test_month.pdf');

        console.log(filePath)
        // Вызов метода отправки письма с указанием прикрепленного файла
        await this.sendMail({
            recipient: email,
            subject: 'Vielen Dank für Ihre Registrierung!',
            html: htmlContent,
            attachments: [
                {
                    filename: 'Testmonat - Wintersaison.pdf', // Имя файла, как оно будет отображаться у получателя
                    path: filePath // Фактический путь к файлу на сервере или URL
                }
            ]
        });
    }


    async confirmEmail(username: string, email: string, link: string) {
        await this.sendMail({
            recipient: email,
            subject: `Bestätigung Ihrer E-Mail-Adresse`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>E-Mail-Bestätigung</title>
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
                            .button {
                                display: inline-block;
                                padding: 10px 20px;
                                font-size: 16px;
                                color: #ffffff;
                                background-color: #28a745;
                                text-decoration: none;
                                border-radius: 5px;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Bestätigung Ihrer E-Mail-Adresse</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${username},</p>
                                <p>Sie haben sich bei unserem Service registriert. Um Ihre E-Mail-Adresse zu bestätigen und Ihr Konto zu aktivieren, klicken Sie bitte auf den folgenden Link:</p>
                                <p style="text-align: center;">
                                    <a class="button" href="${link}" target="_blank">E-Mail bestätigen</a>
                                </p>
                                <p>Falls Sie diese Registrierung nicht durchgeführt haben, ignorieren Sie bitte diese Nachricht.</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }

    async successfullyRegisteredForTraining(dto: ConfirmTrailMonthDto, cancelUrl: string) {
        await this.sendMail({
            recipient: dto.email,
            subject: `Erfolgreiche Anmeldung zum Training`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Training Bestätigung</title>
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
                                <h1>Erfolgreiche Anmeldung zum Training!</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.fullName},</p>
                                <p>Sie haben sich erfolgreich für ein Training angemeldet!</p>
                                <p> //TODO Тут не правльный текст 
                                ${dto.valueOfTrainings && dto.valueOfTrainings > 0
                    ? `In Ihrem Testmonat stehen Ihnen noch <strong>${dto.valueOfTrainings}</strong> Trainingseinheiten zur Verfügung.`
                    : `In Ihrem Testmonat sind keine Trainingseinheiten mehr verfügbar.`
                }

                                    </p>

                                
                                ${dto.nextTraining ? `
                                <h3>Ihre nächste geplante Trainingseinheit:</h3>
                                <ul>
                                    <li><strong>Datum:</strong> ${dto.nextTraining.date}</li>
                                    <li><strong>Ort:</strong> ${dto.nextTraining.location}</li>
                                    <li><strong>Gruppe:</strong> ${dto.nextTraining.group}</li>
                                    ${dto.nextTraining.trainer ? `<li><strong>Trainer:</strong> ${dto.nextTraining.trainer}</li>` : ''}
                                </ul>` : ''}
                                 <p>Falls Sie nicht am Training teilnehmen können und Ihre Anmeldung stornieren möchten, klicken Sie bitte auf den folgenden Link:</p>
                                <p><a href="${cancelUrl}" style="color: red; font-weight: bold;">Anmeldung stornieren</a></p>
                                <p>Bitte beachten Sie, dass eine Stornierung nur möglich ist, wenn diese mindestens 24 Stunden vor Beginn des Trainings erfolgt.</p>

                                <p>Wir wünschen Ihnen viel Spaß und Erfolg bei Ihrem Training!</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }
    async notifyTimeChange(dto: { username: string, email: string, training: any, date: string }) {
        await this.sendMail({
            recipient: dto.email,
            subject: `Änderung der Trainingszeit`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Änderung der Trainingszeit</title>
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
                                <h1>Änderung der Trainingszeit</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.username},</p>
                                <p>Die geplante Trainingseinheit hat eine neue Zeit.</p>
                                <ul>
                                    <li><strong>Neuer Zeitpunkt:</strong> ${dto.date}</li>
                                    <li><strong>Ort:</strong> ${dto.training.location.locationName}</li>
                                    <li><strong>Gruppe:</strong> ${dto.training.group.groupName}</li>
                                </ul>
                                <p>Bitte beachten Sie diese Änderung und passen Sie Ihre Planung entsprechend an.</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits Team</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }

    async notifyTrainingDeletion(dto: { username: string, email: string, training: any, date: string, reason?: string }) {
        await this.sendMail({
            recipient: dto.email,
            subject: `Löschung der Trainingseinheit`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Löschung der Trainingseinheit</title>
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
                                <h1>Löschung der Trainingseinheit</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.username},</p>
                                <p>Die geplante Trainingseinheit wurde aus unserem System entfernt.</p>
                                <ul>
                                    <li><strong>Datum:</strong> ${dto.date}</li>
                                    <li><strong>Ort:</strong> ${dto.training.location.locationName}</li>
                                    <li><strong>Gruppe:</strong> ${dto.training.group.groupName}</li>
                                    ${dto.reason ? `<li><strong>Grund der Löschung:</strong> ${dto.reason}</li>` : ''}
                                </ul>
                                <p>Falls Sie Fragen haben, stehen wir Ihnen gerne zur Verfügung.</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits Team</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }

    async trialTrainingsEnded(email: string, fullName: string) {
        await this.sendMail({
            recipient: email,
            subject: `Ihr Probemonat ist beendet – nächste Schritte`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Probemonat beendet</title>
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
                                <h1>Ihr Probemonat ist beendet</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${fullName},</p>
                                <p>Ihr Probemonat bei der Tennisschule Gorovits ist nun abgeschlossen. Wir hoffen, dass Ihnen die Trainingseinheiten gefallen haben und Sie Freude am Tennis gefunden haben!</p>
                                <p>Unser Manager wird sich in Kürze mit Ihnen in Verbindung setzen, um Ihnen individuelle Trainingsmöglichkeiten in unserer Schule anzubieten.</p>
                                <p>Falls Sie bereits jetzt Interesse an einer Mitgliedschaft oder weiteren Trainingseinheiten haben, können Sie uns gerne kontaktieren.</p>
                                <p>Wir freuen uns darauf, Sie bald wieder auf dem Platz zu sehen!</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }

    async sendConfirmTrialTrrainigLetter(dto: ConfirmTrailMonthDto, link: string) {
        await this.sendMail({
            recipient: dto.email,
            subject: `Bestätigung Ihrer Probetrainingsanmeldung`,
            html: `<!DOCTYPE html>
                    <html lang="de">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Probetraining Bestätigung</title>
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
                            .button {
                                display: inline-block;
                                padding: 10px 20px;
                                font-size: 16px;
                                color: #ffffff;
                                background-color: #28a745;
                                text-decoration: none;
                                border-radius: 5px;
                                margin-top: 20px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Bestätigung Ihrer Probetrainingsanmeldung</h1>
                            </div>
                            <div class="content">
                                <p>Sehr geehrte/r ${dto.fullName},</p>
                                <p>Sie haben eine Anmeldung für ein Probetraining bei uns eingereicht. Um die Anmeldung abzuschließen, bestätigen Sie diese bitte über den folgenden Link:</p>
                                <p style="text-align: center;">
                                    <a class="button" href="${link}" target="_blank">Jetzt bestätigen</a>
                                </p>
                                <h3>Details zu Ihrem Training:</h3>
                                <ul>
                                    <li><strong>Datum:</strong> ${dto.nextTraining.date}</li>
                                    <li><strong>Ort:</strong> ${dto.nextTraining.location}</li>
                                    <li><strong>Gruppe:</strong> ${dto.nextTraining.group}</li>
                                    ${dto.nextTraining.trainer ? `<li><strong>Trainer:</strong> ${dto.nextTraining.trainer}</li>` : ''}
                                </ul>
                                <p>Falls Sie Fragen haben, können Sie sich jederzeit an unser Team wenden.</p>
                                <p>Wir freuen uns darauf, Sie beim Training begrüßen zu dürfen!</p>
                                <p>Mit freundlichen Grüßen,</p>
                                <p>Ihr Tennisschule Gorovits</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 Tennisschule Gorovits. Alle Rechte vorbehalten.</p>
                            </div>
                        </div>
                    </body>
                    </html>
            `
        });
    }

}
/* 

Вот начала сервиса для написания письма с даніми. Нужно написать письмо, что тренировка успешно подтверждена и что мы ждем игрока и отричуй времия, группу, и тд как в примере. 
Вот прмиер как написан прошлый метод
*/