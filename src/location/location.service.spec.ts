import { Test } from "@nestjs/testing";
import { LocationService } from "./location.service";
import { getModelToken } from "@nestjs/sequelize";
import { Location } from "./location.model";
import { Sequelize } from "sequelize-typescript";

describe('LocationService', () => {
    let service: LocationService;
    const mockLocationRepository = {
        findAll: jest.fn().mockResolvedValue([
            {
                id: 1,
                locationName: 'locationName',
                locationUrl: 'locationUrl',
                visible: true,
                order: 1,
            },
        ]),
        create: jest.fn().mockImplementation((dto) => ({
            id: 1,
            ...dto,
            visible: true,
            order: 1,
        })),
    };

    const mockSequelize = {
        transaction: jest.fn().mockImplementation((cb) => cb({})),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                LocationService,
                {
                    provide: getModelToken(Location),
                    useValue: mockLocationRepository,
                },
                {
                    provide: Sequelize,
                    useValue: mockSequelize,
                },
            ],
        }).compile();

        service = module.get<LocationService>(LocationService);
    });

    it('should return an array of locations', async () => {
        expect(await service.getAll(true)).toEqual([
            {
                id: 1,
                locationName: 'locationName',
                locationUrl: 'locationUrl',
                visible: true,
                order: 1,
            },
        ]);
    });

   
});
