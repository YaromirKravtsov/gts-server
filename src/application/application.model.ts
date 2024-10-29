
import {Model, Column, DataType, Table, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Training } from "src/training/training.model";






interface ApplicationCreationAttrs{
    playerName: string;
    playerPhone: string;
    playerComment?:string;
    trainingId: number;
    date: Date
}
@Table({tableName:'application',createdAt:true, updatedAt:false})
export class Application extends Model<Application,ApplicationCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @ForeignKey(()=> Training) 
    @Column({type: DataType.INTEGER, allowNull: false})
    trainingId: number;
    @BelongsTo(()=> Training)
    training: Training
    
    @Column({type:DataType.STRING, allowNull:false})
    playerName: string

    @Column({type:DataType.STRING, allowNull:true})
    playerPhone: string;

    @Column({type:DataType.STRING, allowNull:true})
    playerComment:string;

    @Column({type:DataType.DATE, allowNull:true})
    date:Date;

     
}