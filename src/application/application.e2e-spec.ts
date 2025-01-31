import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Sequelize } from "sequelize-typescript";
import { AppModule } from "src/app.module";
import { RoleGuard } from "src/role/role.gurard";
import * as request from "supertest";

import { Token } from "src/token/token.model";
import { User } from "src/user/user.model";
import { Application } from "./application.model";
import { TrainingDates } from "src/training/trainig-dates.model";
import { Tracing } from "puppeteer";
import { Training } from "src/training/training.model";
import { Location } from "src/location/location.model";
import { Group } from "src/group/group.model";
import moment from "moment";

describe('User e2e', () => {
    let app: INestApplication;
    let sequelize: Sequelize;
    let accessToken: string;
    let userId: number;
    let adminId: number;
    let groupId: number;
    let locationId: number;
    let trainingId: number;
    let trainingDates: TrainingDates[];
    let applicationId: number;
    let newUserId: number;
    let regularPlayerId: number;

    const deleteAll = async () => {
        await Application.destroy({ where: {} });
        await TrainingDates.destroy({ where: {} });
        await Training.destroy({ where: {} });
        await Location.destroy({ where: {} });
        await Group.destroy({ where: {} });
        await Token.destroy({ where: {} });
        await User.destroy({ where: {} });
    }

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider('WhatsAppService') // Переопределяем провайдер
            .useValue({
                init: jest.fn(), // Заглушка метода init
                sendMessage: jest.fn().mockResolvedValue({ success: true }), // Мокаем метод sendMessage
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        sequelize = app.get<Sequelize>(Sequelize);

        await deleteAll()
        const user = await User.create({
            username: 'admin',
            password: '$2b$04$cNShDpXkkcShYde8B33BKuXmQqIi6Zswn8XVcBMQzM.NxN7wFl596',
            role: 'admin',
        });

        adminId = user.id

        const loginResponse = await request(app.getHttpServer())
            .post('/user/login')
            .send({
                username: user.username,
                password: 'admin', // Пароль в тесте
            });

        accessToken = loginResponse.body.accessToken;
        console.log('accessToken ' + accessToken);

        const location = await request(app.getHttpServer())
            .post('/locations') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                locationName: 'Test lcoation',
                locationUrl: 'Test lcoation url'
            });
        locationId = location.body.id;

        const group = await request(app.getHttpServer())
            .post('/groups') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                groupName: 'Group lcoation',
                groupUrl: 'Group lcoation url',
                color: '#000'
            });
        groupId = group.body.id;

        const training = await request(app.getHttpServer())
            .post('/trainings') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                startTime: '2023-12-05T10:00:00Z',
                endTime: '2023-12-05T10:00:00Z',
                repeat_type: 2,
                groupId: groupId, 
                locationId: locationId
            });
        trainingId = training.body.training.id;
        trainingDates = training.body.trainingDates
        trainingId = training.body.trainingDates[0].trainingId


        const reguralPlayer = await request(app.getHttpServer())
            .post('/user/regularPlayer')
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                username: 'newUser',
                email: 'newuser@example.com',
                phone: '+123456789'
            });

        regularPlayerId = reguralPlayer.body.id


    });

    afterAll(deleteAll);

    it('should create application of new player', async () => {
        const application = await request(app.getHttpServer())
            .post('/applications/new-player') // URL эндпоинта
            /*  .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации */
            .send({
                playerName: 'Yarpmyr Kravtsov',
                playerPhone: '+4915172619920',
                playerComment: 'E2E Test',
                trainingDatesId: trainingDates[0].id
            });

        applicationId = application.body.id;
        newUserId = application.body.userId;

        expect(application.status).toBe(201);

        const createdUser = await User.findByPk(newUserId);
        expect(createdUser).not.toBeNull();
        expect(createdUser.username).toBe('Yarpmyr Kravtsov');
        expect(createdUser.phone).toBe('+4915172619920');
        expect(application.body.playerComment).toBe('E2E Test');


        const training = await Training.findByPk(trainingDates[0].trainingId);
        expect(training).not.toBeNull();
        expect(training.id).toBe(trainingDates[0].trainingId);

        const createdApplication = await Application.findByPk(applicationId, {
            include: [User, TrainingDates],
        });
        expect(createdApplication).not.toBeNull();
        expect(createdApplication.trainingDatesId).toBe(trainingDates[0].id);
        expect(createdApplication.userId).toBe(newUserId);
    })

    it('should create application of regular player', async () => {
        console.log('regularPlayerId ' + regularPlayerId)
        const application = await request(app.getHttpServer())
            .post('/applications/regular') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                userId: regularPlayerId,
                trainingDatesId: trainingDates[0].id
            });

        expect(application.status).toBe(201);

        const createdUser = await User.findByPk(application.body.userId);
        expect(createdUser).not.toBeNull();
        expect(createdUser.username).toBe('newUser');
        expect(createdUser.phone).toBe('+123456789');
        expect(createdUser.email).toBe('newuser@example.com');

        const training = await Training.findByPk(trainingDates[0].trainingId);
        expect(training).not.toBeNull();
        expect(training.id).toBe(trainingDates[0].trainingId);

        const createdApplication = await Application.findByPk(application.body.id, {
            include: [User, TrainingDates],
        });
        expect(createdApplication).not.toBeNull();
        expect(createdApplication.trainingDatesId).toBe(trainingDates[0].id);
        expect(createdApplication.userId).toBe(application.body.userId);
    })

    it('should create application of regular player for all trainigs', async () => {
        console.log('regularPlayerId ' + regularPlayerId)
        const application = await request(app.getHttpServer())
            .post(`/applications/add-regular-to-all?userId=${regularPlayerId}&trainingId=${trainingId}`) // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                userId: regularPlayerId,
                trainingDatesId: trainingDates[1].id
            });

        expect(application.status).toBe(201);
        console.log('application')
        console.log(application.body)


        const training = await Training.findByPk(trainingDates[20].trainingId);
        expect(training).not.toBeNull();
        expect(training.id).toBe(trainingDates[0].trainingId);

        const createdApplication = await Application.findByPk(application.body[0].id, {
            include: [User, TrainingDates],
        });
        expect(createdApplication).not.toBeNull();
        expect(createdApplication.trainingDatesId).toBe(trainingDates[0].id);
        expect(String(createdApplication.userId)).toBe(String(application.body[0].userId)); // Сравнение строк

    })

    it('should delete player application', async () => {
        console.log('regularPlayerId ' + regularPlayerId)
        const application = await request(app.getHttpServer())
            .delete(`/applications/delete-player-anmeldung/${applicationId}`) // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации

        expect(application.status).toBe(200);

        const deletedApplication = await Application.findByPk(applicationId, {});
        expect(deletedApplication).toBeNull();
     
        const deletedNOTApplication = await Application.findByPk(applicationId + 1, {});

        expect(deletedNOTApplication).not.toBeNull();
    })

    it('should delete player all application ', async () => {
        console.log('regularPlayerId ' + regularPlayerId)
        const application = await request(app.getHttpServer())
            .delete(`/applications/delete-all-player-anmeldungen?trainingId=${trainingId}&userId=${regularPlayerId}`) // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
        expect(application.status).toBe(200);


        const deletedNOTApplication = await Application.findOne({
            include: [
                {
                    model: TrainingDates,
                    include: [
                        {
                            model: Training,
                            where: {
                                id: trainingId, 
                            }
                        }
                    ],
                    
                },
                {
                    model: User,
                    where: {
                        id: regularPlayerId
                    }
                }
            ]
        });

        expect(deletedNOTApplication).toBeNull();
    })

    it('should get applications for a specific month', async () => {
        // Устанавливаем дату для выборки
        const targetDate = '2023-12-01'; // Дата в формате YYYY-MM-DD
        const monthStart = new Date(2023, 11, 1); // Начало декабря 2023
        const monthEnd = new Date(2024, 0, 1); // Конец декабря 2023
    
        const application1 = await Application.create({
            userId: regularPlayerId,
            trainingDatesId: trainingDates[0].id,
        });
    
        const application2 = await Application.create({
            userId: newUserId,
            trainingDatesId: trainingDates[1].id,
        });
    
        const response = await request(app.getHttpServer())
            .get(`/applications?date=${targetDate}`) 
            .set('Authorization', `Bearer ${accessToken}`);
    
        expect(response.status).toBe(200);
    
        const applications = response.body;
        expect(applications).toBeInstanceOf(Array);
        expect(applications.length).toBeGreaterThan(0);
    
        // Проверяем первую заявку
        const app1 = applications.find(a => a.id === application1.id);
        expect(app1).not.toBeNull();
        expect(app1.playerName).toBe('newUser');
        expect(new Date(app1.startDate).getTime()).toBeGreaterThanOrEqual(monthStart.getTime());
        expect(new Date(app1.endDate).getTime()).toBeLessThan(monthEnd.getTime());
    
        // Проверяем вторую заявку
        const app2 = applications.find(a => a.id === application2.id);
        expect(app2).not.toBeNull();
        expect(app2.playerName).toBe('Yarpmyr Kravtsov');
        expect(new Date(app2.startDate).getTime()).toBeGreaterThanOrEqual(monthStart.getTime());
        expect(new Date(app2.endDate).getTime()).toBeLessThan(monthEnd.getTime());
    });

    it('should get an application by ID', async () => {
        // Создаём тестовую заявку
        const application = await Application.create({
            userId: regularPlayerId,
            trainingDatesId: trainingDates[0].id,
            playerComment: 'E2E Test comment',
        });
    
        // Выполняем запрос на получение заявки по ID
        const response = await request(app.getHttpServer())
            .get(`/applications/${application.id}`) // Указываем ID заявки
            .set('Authorization', `Bearer ${accessToken}`); // Передаём токен авторизации
    
        // Проверяем, что запрос завершился успешно
        expect(response.status).toBe(200);
    
        // Проверяем содержимое ответа
        const result = response.body;
        expect(result).toHaveProperty('trainingDatesId', application.trainingDatesId);
        expect(result).toHaveProperty('playerName', 'newUser'); // Имя пользователя
        expect(result).toHaveProperty('playerComment', application.playerComment);
        expect(result).toHaveProperty('playerPhone', '+123456789'); // Телефон пользователя
        expect(result).toHaveProperty('startDate'); // Дата начала
        expect(result).toHaveProperty('endDate'); // Дата конца
        expect(result).toHaveProperty('location'); // Локация
        expect(result).toHaveProperty('group'); // Группа
    
    
        // Проверяем локацию и группу
        expect(result.location).toHaveProperty('locationName', 'Test lcoation');
        expect(result.group).toHaveProperty('groupName', 'Group lcoation');
    });
    
    it('should update isPresent value of an application', async () => {
        // Создаём тестовую заявку
        const application = await Application.create({
            userId: regularPlayerId,
            trainingDatesId: trainingDates[0].id,
            playerComment: 'Test isPresent',
            isPresent: false, // Начальное значение isPresent
        });
    
        // Выполняем запрос на обновление поля isPresent
        const response = await request(app.getHttpServer())
            .put(`/applications/isPresent/${application.id}`) // Указываем ID заявки
            .set('Authorization', `Bearer ${accessToken}`); // Передаём токен авторизации
    
        // Проверяем, что запрос завершился успешно
        expect(response.status).toBe(200);
    
        // Проверяем содержимое ответа
        const updatedApplication = await Application.findByPk(application.id);
        expect(updatedApplication).not.toBeNull();
        expect(updatedApplication.isPresent).toBe(true); // Убедитесь, что значение isPresent изменилось
    
        // Проверяем ответ сервера
        expect(response.body).toHaveProperty('id', application.id);
        expect(response.body).toHaveProperty('isPresent', true);
    });
    
})    