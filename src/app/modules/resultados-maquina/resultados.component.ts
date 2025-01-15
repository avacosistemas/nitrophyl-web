import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MachineService } from 'app/shared/services/machine.service';
import { IMachine } from 'app/shared/models/machine.model';
import { MachinesService } from 'app/shared/services/machines.service';
import { Observable, map, startWith, filter } from 'rxjs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit, AfterViewInit {
  @ViewChild('tituloComponenteHijo') tituloComponenteHijo: ElementRef;
  @ViewChild('campoInput') campoInput: ElementRef;

  title: string = '';
  subtitle: string = '';
  selectedMachine: IMachine | null = null;
  maquinas: IMachine[] = [];
  filteredMaquinas: Observable<IMachine[]>;
  idMaquinaControl = new FormControl();
  showMachineInput: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private machineService: MachineService,
    private machinesService: MachinesService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.machinesService.get().subscribe({
      next: (response) => {
        this.maquinas = response.data;

        this.setupFilteredMaquinas();
      },
      error: (error) => {
        console.error('Error al cargar máquinas:', error);
      }
    });

    this.machineService.selectedMachine$.subscribe((machine) => {
      this.selectedMachine = machine;
      this.updateTitle();
    });

    this.machineService.subtitle$.subscribe((subtitle) => {
      this.subtitle = subtitle;
    });


    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setShowMachineInput(this.route);
    });

    this.setShowMachineInput(this.route);
  }

  ngAfterViewInit(): void {
    this.updateTitle();
  }

  updateTitle(): void {
    this.route.firstChild?.data.subscribe((data) => {
      if (this.selectedMachine) {
        this.title = `Resultados de ${this.selectedMachine.nombre}`;
      } else {
        this.title = data['title'] || 'Seleccionar...';
      }
    });
  }

  cargarMaquinas(): void {
    this.machinesService.get().subscribe((response) => {
      this.maquinas = response.data;
    });
  }

  displayFn(machine: IMachine): string {
    return machine && machine.nombre ? machine.nombre : '';
  }

  onMachineChange(event: any): void {
    let machine: IMachine | null = null;

    if (typeof event === 'string') {
      machine = this.maquinas.find(m => m.nombre.toLowerCase() === event.toLowerCase());
    } else {
      machine = event;
    }

    if (machine) {
      this.selectedMachine = machine;
      this.machineService.setSelectedMachine(machine);

      this.router.navigate([], { relativeTo: this.route, queryParamsHandling: 'preserve' });
    } else {
      this.selectedMachine = null;
      this.machineService.setSelectedMachine(null);
    }

    this.updateTitle();
  }

  limpiarMaquina(): void {
    this.idMaquinaControl.setValue('');
    this.selectedMachine = null;

    if (this.campoInput) {
      setTimeout(() => this.campoInput.nativeElement.blur(), 0);
    }
  }

  private setupFilteredMaquinas(): void {
    this.filteredMaquinas = this.idMaquinaControl.valueChanges.pipe(
      startWith(''),
      map((value) => {
        if (typeof value === 'string') {
          return this._filter(value || '');
        }
        return this.maquinas;
      })
    );
  }

  private _filter(value: string): IMachine[] {
    const filterValue = value.toLowerCase();
    return this.maquinas.filter(maquina =>
      maquina.nombre.toLowerCase().includes(filterValue)
    );
  }

  private setShowMachineInput(route: ActivatedRoute): void {
    this.showMachineInput = route.snapshot.firstChild?.routeConfig?.path === 'maquina';

    if (!this.showMachineInput) {
      this.machineService.setSelectedMachine(null);
      this.idMaquinaControl.setValue('');
    }
  }
}
