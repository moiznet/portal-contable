import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.jwtService.verifyAsync(token);
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
