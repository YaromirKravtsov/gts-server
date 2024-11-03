
import {Model, Column, DataType, Table, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import { TrainingDates } from "src/training/trainig-dates.model";
import { Training } from "src/training/training.model";






interface ApplicationCreationAttrs{
    playerName: string;
    playerPhone: string;
    playerComment?:string;
    trainingDatesId: number;
}
@Table({tableName:'application',createdAt:true, updatedAt:false})
export class Application extends Model<Application,ApplicationCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @ForeignKey(()=> TrainingDates) 
    @Column({type: DataType.INTEGER, allowNull: false})
    trainingDatesId: number;
    @BelongsTo(()=> TrainingDates)
    trainingDates: TrainingDates;
    
    @Column({type:DataType.STRING, allowNull:false})
    playerName: string

    @Column({type:DataType.STRING, allowNull:true})
    playerPhone: string;

    @Column({type:DataType.STRING, allowNull:true})
    playerComment:string;

}