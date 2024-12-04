import { Test } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

describe('LocationController', () => {
  let controller: LocationController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: {
            getAll: jest.fn().mockResolvedValue([
              {
                id: 1,
                locationName: 'locationName',
                locationUrl: 'locationUrl',
                visible: true,
                order: 1,
              },
            ]),
            createLocation: jest.fn().mockImplementation((dto) => {
              return {
                id: 1,
                ...dto,
                visible: true,
                order: 1,
              };
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  it('should return an array of locations', async () => {
    expect(await controller.getAll()).toEqual([
      {
        id: 1,
        locationName: 'locationName',
        locationUrl: 'locationUrl',
        visible: true,
        order: 1,
      },
    ]);
  });

  it('should create a new location', async () => {
    expect(
      await controller.createLocation({
        locationName: 'locationName',
        locationUrl: 'locationUrl',
      }),
    ).toEqual({
      id: 1,
      locationName: 'locationName',
      locationUrl: 'locationUrl',
      visible: true,
      order: 1,
    });
  });


  it('should return fail ', async () => {
    expect(
      await controller.createLocation({
        locationName: 'locationName',
        locationUrl: 'locationUrl',
      }),
    ).toEqual({
      id: 1,
      locationName: 'locationName',
      locationUrl: 'locationUrl',
      visible: true,
      order: 1,
    });
  });
});
