import { Test, TestingModule } from '@nestjs/testing';
import { TrainingService } from './training.service';
import { WhatsAppService } from 'src/whatsapp/whatsapp/whatsapp.service';
import { Training } from './training.model';
import { getModelToken } from '@nestjs/sequelize';
import { TrainingDates } from './trainig-dates.model';
import { ApplicationService } from 'src/application/application.service';

describe('TrainingService - formatPhoneNumber', () => {
  let service: TrainingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        {
          provide: getModelToken(Training),
          useValue: {}, // Mocked Training Repository
        },
        {
          provide: getModelToken(TrainingDates),
          useValue: {}, // Mocked TrainingDates Repository
        },
        {
          provide: WhatsAppService,
          useValue: {
            sendMessage: jest.fn(), // Mocked WhatsAppService method
          },
        },
        {
          provide: ApplicationService,
          useValue: {}, // Mocked ApplicationService
        },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  it('should return the phone number unchanged if it starts with "+"', () => {
    const phone = '+49123456789';
    const result = service.formatPhoneNumber(phone);
    expect(result).toBe('+49123456789');
  });

  it('should remove spaces if the phone number starts with "+"', () => {
    const phone = '+49 123 456 789';
    const result = service.formatPhoneNumber(phone);
    expect(result).toBe('+49123456789');
  });

  it('should add country code "49" if the phone number starts with "0"', () => {
    const phone = '0123456789';
    const result = service.formatPhoneNumber(phone);
    expect(result).toBe('+49123456789');
  });

  it('should prepend "+" if the phone number starts with "49"', () => {
    const phone = '49123456789';
    const result = service.formatPhoneNumber(phone);
    expect(result).toBe('+49123456789');
  });

  it('should prepend "+" if the phone number starts with "380"', () => {
    const phone = '380123456789';
    const result = service.formatPhoneNumber(phone);
    expect(result).toBe('+380123456789');
  });

  it('should throw an error if the phone number format is invalid', () => {
    const phone = '123456789';
    expect(() => service.formatPhoneNumber(phone)).toThrowError('Invalid phone number format');
  });

  it('should throw an error if the phone number contains no digits', () => {
    const phone = 'abcd';
    expect(() => service.formatPhoneNumber(phone)).toThrowError('Invalid phone number format');
  });
});
