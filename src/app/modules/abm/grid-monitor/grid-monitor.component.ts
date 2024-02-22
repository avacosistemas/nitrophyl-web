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
  template: `<div
    class="absolute inset-0 flex flex-col min-w-0 overflow-hidden"
  >
    <div
      class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent"
    >
      <div class="flex-1 min-w-0">
        <!--div class="hidden sm:flex flex-wrap items-center font-medium">
          <div><a class="whitespace-nowrap text-primary-500"> Monitor </a></div>
        </div-->

        <h2
          class="text-3xl md:text-4xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate mt-2"
        >
          {{ title }}
        </h2>
      </div>

      <!--div
        class="flex shrink-0 justify-end items-center mt-6 sm:mt-0 sm:ml-4 w-1/2"
      >

      </div-->
    </div>

    <div
      style="display: flex; flex-direction: column; flex-wrap: wrap; overflow-y: scroll; height: 100%;"
    >
      <router-outlet></router-outlet>
    </div>
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
