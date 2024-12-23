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
  templateUrl: './abm-lots.component.html',
  styleUrls: ['./abm-lots.component.css'],
})
export class ABMLotsComponent
  implements OnInit, AfterContentChecked, OnDestroy
{
  public title: string = 'Consultar Lotes';
  public drawer: boolean;

  private subscription: Subscription;

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

  handleAction(action: string): void {
    switch (action) {
      case 'create':
        this.create();
        break;
    }
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
