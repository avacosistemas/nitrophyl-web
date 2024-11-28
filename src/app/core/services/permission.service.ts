import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private _permissions: string[] = [];

  constructor() { }

  setPermissions(permissions: string[]): void {
    this._permissions = permissions;
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
  }

  public hasPermission(permissionCode: string): boolean {
    const permissions: string[] = JSON.parse(localStorage.getItem('userPermissions') || '[]');
    return permissions.includes(permissionCode);
  }
}
