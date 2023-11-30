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
  selector: 'abm-lots',
  template: `<div
    class="absolute inset-0 flex flex-col min-w-0 overflow-hidden"
  >
    <div
      class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent"
    >
      <div class="flex-1 min-w-0">
        <div class="hidden sm:flex flex-wrap items-center font-medium">
          <div><a class="whitespace-nowrap text-primary-500"> ABM </a></div>
          <div class="flex items-center ml-1 whitespace-nowrap">
            <mat-icon
              role="img"
              class="mat-icon notranslate icon-size-5 mat-icon-no-color"
              aria-hidden="true"
              data-mat-icon-type="svg"
              data-mat-icon-name="chevron-right"
              data-mat-icon-namespace="heroicons_solid"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                fit=""
                height="100%"
                width="100%"
                preserveAspectRatio="xMidYMid meet"
                focusable="false"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </mat-icon>
            <span class="ml-1 text-secondary"> Lotes </span>
          </div>
        </div>

        <h2
          class="text-3xl md:text-4xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate mt-2"
        >
          {{ title }}
        </h2>
      </div>

      <div
        class="flex shrink-0 justify-end items-center mt-6 sm:mt-0 sm:ml-4 w-1/2"
      >
        <button
          mat-flat-button=""
          class="ml-3 mat-focus-indicator mat-flat-button mat-button-base mat-accent"
          (click)="create()"
          [disabled]="drawer"
        >
          <span class="mat-button-wrapper"> Crear nuevo lote </span>
          <span matripple="" class="mat-ripple mat-button-ripple"></span>
          <span class="mat-button-focus-overlay"></span>
        </button>
      </div>
    </div>

    <div
      style="display: flex; flex-direction: column; flex-wrap: wrap; overflow-y: scroll; height: 100%;"
    >
      <router-outlet></router-outlet>
    </div>
  </div>`,
})
export class ABMLotsComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  public title: string = 'Lotes';
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
