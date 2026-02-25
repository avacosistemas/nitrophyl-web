import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { HelpService } from 'app/core/services/help.service';
import { DynamicHelpModalComponent } from 'app/shared/components/dynamic-help/dynamic-help-modal.component';

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

  constructor(
    private _matDialog: MatDialog,
    private _router: Router,
    private _helpService: HelpService
  ) { }

  getButtonClass(type: 'flat' | 'stroked'): string {
    return type === 'flat'
      ? 'mat-focus-indicator mat-flat-button mat-button-base mat-accent'
      : 'mat-focus-indicator mat-stroked-button mat-button-base';
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

  openHelp(): void {
    const currentUrl = this._router.url;
    const normalizedPath = this._helpService.normalizeUrl(currentUrl);

    this._matDialog.open(DynamicHelpModalComponent, {
      width: '800px',
      panelClass: 'help-modal-no-padding',
      data: {
        path: normalizedPath
      },
      autoFocus: false
    });
  }
}
