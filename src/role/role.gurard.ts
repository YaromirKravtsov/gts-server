import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import{verify} from 'jsonwebtoken';
import { Observable } from "rxjs";
import { ROLES_KEY } from "./roles-auth-decorator";



// Определяем интерфейс для JWT токена
interface JwtPayload {
  role: string; // Поле role в токене
  userId: number
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRole = this.reflector.getAllAndOverride<string>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]);
      if (!requiredRole) {
        return true;
      }

      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
      console.log(authHeader)
 
      const baser = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];
 
      if (baser !== 'Bearer' || !token) {
        throw new UnauthorizedException({ message: 'User not authorized' })
      }
      
      const user = verify(token,process.env.JWT_ACCESS_SECRET) as JwtPayload;
      req.user = user;
   
      if(!requiredRole.includes(user.role)){
        throw new UnauthorizedException({message:`Sie haben nicht die Befugnis dazu!` })
      }

      return true;
      
    } catch (e) {
      console.log(e)
      throw new UnauthorizedException(e.message);
    }
  }
}
