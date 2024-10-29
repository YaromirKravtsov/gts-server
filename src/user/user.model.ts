
import {Model, Column, DataType, Table, HasMany } from "sequelize-typescript";

import { Token } from "src/token/token.model";



interface UserCreationAttrs{
    userName: string,
    password: string,
    role:string
}
@Table({tableName:'user',createdAt:false, updatedAt:false})
export class User extends Model<User,UserCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @Column({type:DataType.STRING, allowNull:false})
    username:string;

    @Column({type:DataType.STRING, unique:true, allowNull:false})
    password:string;

    @Column({type:DataType.STRING, unique:true, allowNull:false})
    role:string;
    


}