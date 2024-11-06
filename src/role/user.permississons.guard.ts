import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import { Observable } from "rxjs";
import {JwtPayload, verify} from 'jsonwebtoken';


@Injectable()
export class UserPermissionsGuard implements CanActivate{

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>{   
        const req = context.switchToHttp().getRequest();
        try{
 
            const authHeader = req.headers.authorization;
            const userId = req.params.userId ||req.body.userId;
            
            const baser = authHeader.split(' ')[0];
            const token = authHeader.split(' ')[1];
        
            if(baser !== 'Bearer' || !token){
                throw new UnauthorizedException({message:'User not authorized' })
            }
            const user = verify(token,process.env.JWT_ACCESS_SECRET) as JwtPayload;
    
            if(Number(user.userId) != Number(userId) && user.role !== 'admin' ){
                throw new UnauthorizedException({message:`You don't have the authority to do that!` })
            }

            return true;
       
      
            
        }catch(e){
            console.log(e)
            throw new UnauthorizedException({message:e.message})
        }
    }
}