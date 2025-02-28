import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ConfirmTrailTrainigDto } from './dto/confirm-trail-training.dto';
import { ApplicationService } from 'src/application/application.service';
import { MailService } from 'src/mail/mail.service';
import { TrainingService } from 'src/training/training.service';
import { UserService } from 'src/user/user.service';
import { escape } from 'querystring';
import { TelegramService } from 'src/telegram/telegram.service';
import { WhatsAppService } from 'src/whatsapp/whatsapp.service';
type KeyDto = ConfirmEmailDto | ConfirmTrailTrainigDto
@Injectable()
export class ConfirmationService {
    constructor(
        @Inject(forwardRef(() => ApplicationService)) private readonly applicationService: ApplicationService,
        private mailService: MailService, private trainigServer: TrainingService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        private readonly telegramService: TelegramService, private whatsAppService: WhatsAppService

    ) { }

    generateKey(dto: KeyDto) { // два дто
        const accessToken = sign({ ...dto }, process.env.JWT_ACCESS_SECRET, { expiresIn: '30d' });//15m
        console.log(accessToken);
        return accessToken;
    }

    async confirmTrailTrainig(key: string) {
        try {
            const data = verify(key, process.env.JWT_ACCESS_SECRET) as ConfirmTrailTrainigDto;
            const { deleteKey, application } = await this.applicationService.createApplication(data.trainigDateId, data.userId);
            const cancelUrl = `${process.env.FRONT_URL}?action=delete-anmeldung&key=${deleteKey}&id=${application.id}`;
            const trainingDate = await this.trainigServer.getTraining(data.trainigDateId);
            let trainer = null
            if (trainingDate.trainerId) {
                trainer = await this.userService.getUser(trainingDate.trainerId)
            }
            const player = await this.userService.getUser(data.userId);
            const valueOfTrainings = await this.applicationService.countValueOfPossibleTrainings(player.id);

            const date = this.applicationService.formatTrainingDate(
                trainingDate.startTime,
                trainingDate.endTime,
            );
            if (0 > 4 - valueOfTrainings) {
                await this.mailService.trialTrainingsEnded(data.email, player.username);
                await this.telegramService.sendMessage(``)
                // TODO Отправлять письмо Мариане
                // Сделать телеграм бота, который будт отправлять сообщения 
            } else {
                const dto = {
                    email: data.email,
                    fullName: player.username,
                    valueOfTrainings: 4 - valueOfTrainings,
                    nextTraining: {
                        date: date,
                        group: trainingDate.group.groupName,
                        location: trainingDate.location.locationName,
                        trainer: trainer?.username,
                    }
                }
                await this.mailService.successfullyRegisteredForTraining(dto, cancelUrl)
                let message = `*Anmeldung zum Training* \n\n *${dto.fullName}* (${dto.email}).\nVerfügbare Trainingseinheiten: ${dto.valueOfTrainings}.`;

                // Если данные о следующей тренировке присутствуют, добавляем их в сообщение
                if (dto.nextTraining) {
                    const { date, group, location, trainer } = dto.nextTraining;
                    message += `\nNächste Einheit: ${date}\nGruppe: ${group}\nOrt: ${location}`;
                    if (trainer) {
                        message += `, Trainer: *${trainer}*`;
                    }
                }


                // Отправляем сообщение через сервис TelegramService
                await this.telegramService.sendMessage(message);
                await this.whatsAppService.sendMessageToGroup(message);

            }
        } catch (e) {
            console.log(e)
        }


    }
    async confirmEmail(key: string) {
        console.log(key)
    }

}
