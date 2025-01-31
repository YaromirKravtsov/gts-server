import { Test, TestingModule } from '@nestjs/testing';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { getModelToken } from '@nestjs/sequelize';
import { Training } from './training.model';
import { TrainingDates } from './trainig-dates.model';
import { ApplicationService } from 'src/application/application.service';

describe('TrainingController', () => {
  let controller: TrainingController;
  let service: TrainingService;

  const mockWhatsAppService = {
    sendMessage: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainingController],
      providers: [
        TrainingService,
        {
          provide: getModelToken(Training),
          useValue: {}, // Mock Sequelize Model
        },
        {
          provide: getModelToken(TrainingDates),
          useValue: {}, // Mock Sequelize Model
        },
        {
          provide: ApplicationService,
          useValue: {}, // Mock ApplicationService
        },
      ],
    }).compile();

    controller = module.get<TrainingController>(TrainingController);
    service = module.get<TrainingService>(TrainingService);
  });

  it('should create a training and save it to the database', async () => {
    const dto = {
      startTime: new Date(),
      endTime: new Date(),
      repeat_type: 1,
      groupId: 1,
      locationId: 1,
    };

    const mockTraining = {
      id: 1,
      ...dto,
    };

    jest.spyOn(service, 'createTraining').mockResolvedValue(mockTraining as any);

    //expect(await controller.createTraining(dto)).toEqual(mockTraining);
    expect(service.createTraining).toHaveBeenCalledWith(dto);
  });
});
