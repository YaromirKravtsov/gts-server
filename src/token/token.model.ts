import { Model, BelongsTo, Column, DataType, ForeignKey, Table } from "sequelize-typescript";
import { User } from "src/user/user.model";

interface TokenCreationAttrs{

    refreshToken:string;
    userId:number;
    deviceId: string;
}
@Table({tableName:'token',createdAt:false, updatedAt:false})
export class Token extends Model<Token,TokenCreationAttrs>{
    @Column({type:DataType.INTEGER, unique:true, autoIncrement:true, primaryKey:true})
    id:number;

    @Column({ type: DataType.STRING(2048) }) // Увеличил размер столбца refreshToken до 2048 символов
    refreshToken: string;

    @Column({type: DataType.DATE, defaultValue: DataType.NOW, })
    creationDate: Date;

    
    @Column({type:DataType.STRING})
    deviceId:string;
    
    @ForeignKey(() => User)
    @Column({ type: DataType.INTEGER })
    userId: number;
    @BelongsTo(() => User)
    user: User; 


}