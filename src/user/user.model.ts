
import {Model, Column, DataType, Table, HasMany } from "sequelize-typescript";
import { Application } from "src/application/application.model";
import { Token } from "src/token/token.model";




interface UserCreationAttrs{
    username: string;
    password?: string;
    role:string;
    phone?: string;
    email?:string;
}

@Table({tableName:'user',createdAt:false, updatedAt:false})
export class User extends Model<User,UserCreationAttrs>{

    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;
    
    @Column({type:DataType.STRING, allowNull:false})
    username:string;

    @Column({ type: DataType.STRING, allowNull: true })
    phone: string;

    @Column({type:DataType.STRING, allowNull:true})
    email:string;
    
    @Column({type:DataType.STRING, unique:true, allowNull:true})
    password:string;

    @Column({type:DataType.STRING, unique:true, allowNull:false})
    role:string;
    
    @Column({type:DataType.TEXT, allowNull:true})
    adminComment:string;
    
    @HasMany(()=> Application)
    applications: Application[];

        
    @HasMany(()=> Token)
    tokens: Token[];
    

}