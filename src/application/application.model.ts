
import {Model, Column, DataType, Table, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import { TrainingDates } from "src/training/trainig-dates.model";
import { User } from "src/user/user.model";

interface ApplicationCreationAttrs{
    playerComment?:string;
    trainingDatesId: number;
    isPresent: boolean;
    userId: number;
    deleteKey: string
}
@Table({tableName:'application',createdAt:true, updatedAt:false})
export class Application extends Model<Application,ApplicationCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;

    @Column({type:DataType.STRING, allowNull:true})
    playerComment:string;

    @Column({type:DataType.BOOLEAN, allowNull:true})
    isPresent: boolean
        
    @Column({type:DataType.TEXT, allowNull:true})
    adminComment:string;

    @Column({type:DataType.STRING, allowNull:true})
    deleteKey:string;
    
    @ForeignKey(()=> TrainingDates) 
    @Column({type: DataType.INTEGER, allowNull: false})
    trainingDatesId: number;
    @BelongsTo(()=> TrainingDates)
    trainingDates: TrainingDates;


    @ForeignKey(()=> User) 
    @Column({type: DataType.INTEGER, allowNull: false})
    userId: number;
    @BelongsTo(()=> User)
    user: User;

   
}