
import {Model, Column, DataType, Table, HasMany } from "sequelize-typescript";
import { Training } from "src/training/training.model";




interface GroupCreationAttrs{
    groupName: string,
    groupUrl: string,
    color:string;
    visible: boolean;
    order: number
}
@Table({tableName:'group',createdAt:false, updatedAt:false})
export class Group extends Model<Group,GroupCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @Column({type:DataType.STRING, allowNull:false})
    groupName: string

    @Column({type:DataType.TEXT, allowNull:true})
    groupUrl: string;

    @Column({type:DataType.STRING, allowNull:false})
    color:string;

    @Column({type:DataType.BOOLEAN, allowNull:false})
    visible:boolean;

    @Column({type:DataType.INTEGER, allowNull:false})
    order:number;

    @HasMany(()=> Training)
    Trainings: Training[];


    

}