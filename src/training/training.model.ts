
import { Model, Column, DataType, Table, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { Application } from "src/application/application.model";
import { Group } from "../../src/group/group.model";
import { Location } from "src/location/location.model";
import { TrainingDates } from "./trainig-dates.model";


interface TrainingCreationAttrs {
    isTrail: boolean;
    startTime: Date;
    endTime: Date;
    repeatType: number;
    groupId: number;
    locationId: number;
}

@Table({ tableName: 'training', createdAt: false, updatedAt: false })
export class Training extends Model<Training, TrainingCreationAttrs> {

    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
    id: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    isTrail: boolean;

    @Column({ type: DataType.DATE, allowNull: false })
    startTime: Date;

    @Column({ type: DataType.DATE, allowNull: false })
    endTime: Date;

    @Column({ type: DataType.INTEGER, allowNull: false })
    repeatType: number;


    @ForeignKey(() => Group)
    @Column({ type: DataType.INTEGER, allowNull: false })
    groupId: number;
    @BelongsTo(() => Group)
    group: Group;


    @ForeignKey(() => Location)
    @Column({ type: DataType.INTEGER, allowNull: false })
    locationId: number;
    @BelongsTo(() => Location)
    location: Location;

    @HasMany(() => TrainingDates)
    trainigDates: TrainingDates[] 

}

/* 
NOTES
repeatType: 
everdy day - 1
every week - 2
every month - 3
one time - 4
*/