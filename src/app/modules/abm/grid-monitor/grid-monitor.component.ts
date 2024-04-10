import {
  AfterContentChecked,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';

// * Services.
import { LotService } from 'app/shared/services/lot.service';

@Component({
  selector: 'grid-monitor',
  template: `<div class="absolute inset-0 flex flex-col min-w-0 overflow-hidden">
      <router-outlet></router-outlet>
  </div>`,
})
export class GRIDMonitorComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  public title: string = 'Monitor de Lotes';
  public drawer: boolean; // Drawer state.

  private subscription: Subscription; // Drawer subscription.

  constructor(
    private lotService: LotService,
    private cdref: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.subscription = this.lotService.drawer$.subscribe((drawer: boolean) => {
      this.drawer = drawer;
    });
  }

  public ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  public create(): void {
    this.lotService.toggleDrawer();
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
