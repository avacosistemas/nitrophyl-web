import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-registro',
  templateUrl: './registro-envios.component.html',
  styleUrls: ['./registro-envios.component.scss']
})
export class RegistroComponent implements OnInit, OnDestroy {

  title: string = 'Informes';
  subtitle: string = 'Registro de envíos';
  private _unsubscribeAll: Subscription;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this._unsubscribeAll = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });

    this.updateTitle();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll?.unsubscribe();
  }

  private updateTitle(): void {
    let child = this.route.firstChild;
    while (child) {
      if (child.firstChild) {
        child = child.firstChild;
      } else if (child.snapshot.data && child.snapshot.data['subtitle']) {
        this.subtitle = child.snapshot.data['subtitle'];
        return;
      } else {
        return;
      }
    }
  }
}