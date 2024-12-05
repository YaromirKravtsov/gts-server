import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import * as request from "supertest";
import { Sequelize } from "sequelize-typescript";
import { Location } from "./location.model";
import { RoleGuard } from "src/role/role.gurard";

describe('LocationController (e2e)', () => {
    let app: INestApplication;
    let sequelize: Sequelize;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider('WhatsAppService') // Отключаем реальный сервис
        .useValue({
            init: jest.fn(), // Пустая mock-реализация
        })
        .overrideGuard(RoleGuard) // Переопределяем Guard
        .useValue({
            canActivate: jest.fn(() => true), // Мокируем поведение
        })
        .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        sequelize = app.get<Sequelize>(Sequelize); // Получаем экземпляр Sequelize


    });

    beforeEach(async () => {
        await Location.create({
            locationName: "Test Location",
            locationUrl: "http://example.com",
            visible: true,
            order: 1,
        });
    });
    

    afterEach(async () => {
        await Location.destroy({ where: {} });

    });
    

    it('/locations (GET)', async () => {
        return request(app.getHttpServer())
            .get('/locations')
            .expect(200)
            .expect(response => {
                expect(response.body).toEqual([
                    {
                        id: expect.any(Number),
                        locationName: 'Test Location',
                        locationUrl: 'http://example.com',
                        visible: true,
                        order: 1,
                    },
                ]);
            });
    });

    it('/locations (POST) - success', async () => {
        return request(app.getHttpServer())
            .post('/locations')
            .send({
                locationName: 'Test Location',
                locationUrl: 'http://example.com'
            }) 
            .expect(201)
            .expect(response => {
                expect(response.body).toEqual(
                    {
                        id: expect.any(Number),
                        locationName: 'Test Location',
                        locationUrl: 'http://example.com',
                        visible: true,
                        order: 1,
                    },
                );
            });
    });

    it('/locations (POST) - faild', async () => {
        return request(app.getHttpServer())
            .post('/locations')
            .send({
                locationName: 'Test Location'
            }) 
            .expect(400)
    });

    afterAll(async () => {
        await app.close();
        const sequelize = app.get<Sequelize>(Sequelize);
        await sequelize.close(); // Закрытие подключения к базе данных
    });
    
});
