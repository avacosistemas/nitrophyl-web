import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';

export interface HeaderButton {
  type: 'flat' | 'stroked' | 'icon';
  label?: string;
  icon?: string;
  condition: boolean;
  isDisabled?: boolean;
  action: string;
  tooltip?: string;
}

export interface Breadcrumb {
  title: string;
  label: string;
  route?: string | any[];
  condition?: boolean;
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

  getButtonClass(type: 'flat' | 'stroked' | 'icon'): string {
    if (type === 'flat') return 'mat-focus-indicator mat-flat-button mat-button-base mat-accent';
    if (type === 'stroked') return 'mat-focus-indicator mat-stroked-button mat-button-base';
    return 'mat-focus-indicator mat-icon-button mat-button-base';
  }

  handleButtonClick(action: string): void {
    this.buttonAction.emit(action);
  }

  hasValidRoute(breadcrumb: Breadcrumb): boolean {
    return !!breadcrumb.route;
  }

  getFilteredBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.filter(breadcrumb => breadcrumb.condition !== false);
  }
}
