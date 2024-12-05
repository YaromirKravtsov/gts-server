import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Sequelize } from "sequelize-typescript";
import { AppModule } from "src/app.module";
import { RoleGuard } from "src/role/role.gurard";
import * as request from "supertest";
import { User } from "./user.model";
import { Token } from "src/token/token.model";

describe('User e2e', () => {
    let app: INestApplication;
    let sequelize: Sequelize;
    let accessToken: string;
    let userId;
    let adminId;
    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider('WhatsAppService') // Отключаем реальный сервис
            .useValue({
                init: jest.fn(), // Пустая mock-реализация
            })
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        sequelize = app.get<Sequelize>(Sequelize); // Получаем экземпляр Sequelize
        // Создаём пользователя
        const user = await User.create({
            username: 'admin',
            password: '$2b$04$cNShDpXkkcShYde8B33BKuXmQqIi6Zswn8XVcBMQzM.NxN7wFl596', // Захардкоженный хеш пароля
            role: 'admin',
        });

        adminId = user.id

        // Логинимся, чтобы получить токен
        const loginResponse = await request(app.getHttpServer())
            .post('/user/login')
            .send({
                username: user.username,
                password: 'admin', // Пароль в тесте
            });

        accessToken = loginResponse.body.accessToken; // Сохраняем accessToken
    });
    /* 
        beforeEach(async () => {
    
    
        });
     */

    afterAll(async () => {
        await Token.destroy({ where: {} });
        await User.destroy({ where: {} });
    });



    it('should create new user', async () => {
        const response = await request(app.getHttpServer())
            .post('/user/regularPlayer') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({

                username: 'newUser',
                email: 'newuser@example.com',
                phone: '+123456789'/* ,
                adminComment: 'Updated by test', */
            });
        userId = response.body.userId
        console.log('userId set ' + userId);

        expect(response.status).toBe(201);
        expect(response.body.username).toBe('newUser');
    });





    it('should return creatin fail', async () => {

        const response = await request(app.getHttpServer())
            .post('/user/regularPlayer')
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                username: 'newUser',
                email: 'newuser@example.com',
                phone: '+123456789'/* ,
                adminComment: 'Updated by test', */
            });

        expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });







    it('should edit user', async () => {
        console.log('userId edit ' + userId);

        const response = await request(app.getHttpServer())
            .put('/user') // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
            .send({
                id: userId,
                username: 'Яромир Кравцов',
                email: 'yaromir@gmail.com',
                phone: '+456546546456',
                adminComment: 'Updated by test',
            });

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('Яромир Кравцов');
        expect(response.body.email).toBe('yaromir@gmail.com');
        expect(response.body.phone).toBe('+456546546456');
        expect(response.body.adminComment).toBe('Updated by test');
    });

    it('should edit role to regular player', async () => {
        const response = await request(app.getHttpServer())
            .put(`/user/convert/new-to-regular/${adminId}`) // URL эндпоинта
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
        expect(response.status).toBe(200);
        expect(response.body.role).toBe('regularPlayer');
    });


 
    it('should get user', async () => {
        console.log('userId get get' + userId)
        const response = await request(app.getHttpServer())
            .get(`/user/one/${userId}`)
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизаци
        expect(response.status).toBe(200);
        expect(response.body.username).toBe('Яромир Кравцов');
        expect(response.body.email).toBe('yaromir@gmail.com');
        expect(response.body.phone).toBe('+456546546456');
        expect(response.body.adminComment).toBe('Updated by test');
    });


    it('should get all players', async () => {
        const response = await request(app.getHttpServer())
            .get('/user/players')
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизаци

        expect(response.status).toBe(200);

        const players = response.body;
        players.forEach(player => {
            expect(player).toHaveProperty('username');
            expect(player).toHaveProperty('role');
            expect(player.role).not.toBe('admin');
            expect(player.role).not.toBe('trainer');
            expect(player).not.toHaveProperty('password');
        });

        expect(Array.isArray(players)).toBe(true);
    });


    it('should search players by name, phone, and email', async () => {
        // Поиск по имени
        const searchQueryName = encodeURIComponent('Яромир'); 
        const responseName = await request(app.getHttpServer())
            .get(`/user/search-players?searchQuery=${searchQueryName}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(responseName.status).toBe(200);
        const playersByName = responseName.body;
        expect(playersByName[0].username).toBe('Яромир Кравцов');
        expect(playersByName[0].email).toBe('yaromir@gmail.com');
        expect(playersByName[0].phone).toBe('+456546546456');
    
        // Поиск по телефону
        const searchQueryPhone = encodeURIComponent('+456546546456');
        const responsePhone = await request(app.getHttpServer())
            .get(`/user/search-players?searchQuery=${searchQueryPhone}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(responsePhone.status).toBe(200);
        const playersByPhone = responsePhone.body;
        expect(playersByPhone[0].username).toBe('Яромир Кравцов');
        expect(playersByPhone[0].email).toBe('yaromir@gmail.com');
        expect(playersByPhone[0].phone).toBe('+456546546456');
    
        const searchQueryEmail = encodeURIComponent('yaromir@gmail.com');
        const responseEmail = await request(app.getHttpServer())
            .get(`/user/search-players?searchQuery=${searchQueryEmail}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(responseEmail.status).toBe(200);
        const playersByEmail = responseEmail.body;
        expect(playersByEmail[0].username).toBe('Яромир Кравцов');
        expect(playersByEmail[0].email).toBe('yaromir@gmail.com');
        expect(playersByEmail[0].phone).toBe('+456546546456');
    });

    it('delete user', async () => {
        console.log('userId delete ' + userId);

        const response = await request(app.getHttpServer())

            .delete(`/user/${userId}`)
            .set('Authorization', `Bearer ${accessToken}`) // Передаём токен авторизации
        expect(response.status).toBe(200);
    });

})