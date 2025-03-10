
import { Model, Column, DataType, Table, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { Application } from "src/application/application.model";
import { Group } from "../../src/group/group.model";
import { Location } from "src/location/location.model";
import { Training } from "./training.model";
import { User } from "src/user/user.model";


interface TrainingDatesCreationAttrs {
    trainingId: number;
    startDate: Date;
    endDate: Date;
    adminComment?: string;
}

@Table({ tableName: 'training_dates', createdAt: false, updatedAt: false })
export class TrainingDates extends Model<TrainingDates, TrainingDatesCreationAttrs> {

    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;


    @Column({ type: DataType.DATE, allowNull: false })
    startDate: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    endDate: Date;
    
    @Column({ type: DataType.STRING, allowNull: true })
    adminComment: string;

    @ForeignKey(() => Training)
    @Column({ type: DataType.INTEGER, allowNull: false })
    trainingId: number;
    @BelongsTo(() => Training)
    training: Training;

    @HasMany(() => Application)
    applications: Application[];


    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER, allowNull: true })
    trainerId: number;
    
    @BelongsTo(() => User)
    trainer: User;
}

