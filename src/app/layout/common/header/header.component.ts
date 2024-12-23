import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';

export interface HeaderButton {
  type: 'flat' | 'stroked';
  label: string;
  condition: boolean;
  isDisabled: boolean;
  action: string;
}

export interface Breadcrumb {
  title: string;
  label: string;
  route?: string | any[]; // Hacemos la ruta opcional para mantener compatibilidad
  condition?: boolean; // Agregamos condición opcional
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() buttons: HeaderButton[] = [];
  @Input() extraContent: TemplateRef<any>;

  @Output() buttonAction = new EventEmitter<string>();

  // Método para obtener las clases del botón
  getButtonClass(type: 'flat' | 'stroked'): string {
    return type === 'flat'
      ? 'mat-focus-indicator mat-flat-button mat-button-base mat-accent'
      : 'mat-focus-indicator mat-stroked-button mat-button-base';
  }

  // Método para manejar clics en los botones
  handleButtonClick(action: string): void {
    this.buttonAction.emit(action);
  }

  // Método helper para verificar si una ruta es válida
  hasValidRoute(breadcrumb: Breadcrumb): boolean {
    return !!breadcrumb.route;
  }

  // Método para filtrar los breadcrumbs con base en las condiciones
  getFilteredBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.filter(breadcrumb => breadcrumb.condition !== false);
  }
}
