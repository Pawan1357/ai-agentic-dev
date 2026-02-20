import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const roleHeader = request.headers['x-user-role'];
    const providedRole = (Array.isArray(roleHeader) ? roleHeader[0] : roleHeader)?.toLowerCase();
    const role = this.toKnownRole(providedRole);

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient role for this operation');
    }

    return true;
  }

  private toKnownRole(value?: string): AppRole {
    if (value === 'admin' || value === 'analyst' || value === 'viewer') {
      return value;
    }
    return 'viewer';
  }
}
