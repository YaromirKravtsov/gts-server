
import {Model, Column, DataType, Table, HasMany } from "sequelize-typescript";
import { Training } from "src/training/training.model";


interface LocationCreationAttrs{
    locationName: string,
    locationUrl: string, 
    visible:boolean;
    order:number;
}
@Table({tableName:'location',createdAt:false, updatedAt:false})
export class Location extends Model<Location,LocationCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @Column({type:DataType.STRING, allowNull:false})
    locationName: string

    @Column({type:DataType.STRING, allowNull:true})
    locationUrl: string;

    @Column({type:DataType.BOOLEAN, allowNull:false})
    visible:boolean;

    @Column({type:DataType.INTEGER, allowNull:false})
    order:number;

    @HasMany(()=> Training)
    trainigs: Training[];
}