import { Pipe, PipeTransform } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';

@Pipe({
  name: 'hasPermission'
})
export class PermissionPipe implements PipeTransform {

  constructor(private authService: AuthService) {}

  transform(permissionCode: string): boolean {
    const userPermissions: string[] = this.authService.getUserPermissions();
    return userPermissions.includes(permissionCode);
  }
}
