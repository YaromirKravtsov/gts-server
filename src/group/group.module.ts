import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Group } from './group.model';

@Module({
  controllers: [GroupController],
  providers: [GroupService],
  imports: [SequelizeModule.forFeature([Group])]
})
export class GroupModule {}
