import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { Cliente } from 'app/shared/models/cliente.model';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Subscription } from 'rxjs';
import { ABMClientesService } from '../abm-clientes.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { Pais } from 'app/shared/models/cliente.model';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    selector: 'abm-clientes-crear',
    templateUrl: './abm-clientes-crear.component.html'
})

export class ABMClientesCrearComponent implements OnInit, OnDestroy, AfterViewInit {
    clienteForm: FormGroup;
    component: string = 'CreateCliente';
    suscripcion: Subscription;
    provincias = [];
    paises: Pais[] = [];
    filteredPaises: Observable<Pais[]>;
    empresa = [
        { nombre: 'NITROPHYL' },
        { nombre: 'ELASINT' }
    ];
    ingresosBrutos = [
        { id: 1, name: 'Régimen General' },
        { id: 2, name: 'Régimen Simplificado' }
    ];

    constructor(
        private clientesService: ClientesService,
        private formBuilder: FormBuilder,
        private ABMClientesService: ABMClientesService,
        public dialog: MatDialog,
        private router: Router,
        private notificationService: NotificationService,
        private cdRef: ChangeDetectorRef
    ) {
        this.clienteForm = this.formBuilder.group({
            //codigo: [null],
            razonSocial: [null, [Validators.required]],
            email: [null, [Validators.required]],
            cuit: [null, [Validators.required]],
            domicilio: [null, [Validators.required]],
            codigoPostal: [null, [Validators.required]],
            localidad: [null, [Validators.required]],
            provincia: [null, [Validators.required]],
            empresa: [null, [Validators.required]],
            webSite: [null],
            nombre: [null, [Validators.required]],
            observacionesCobranzas: [null],
            observacionesEntrega: [null],
            observacionesFacturacion: [null],
            telefono: [null, [Validators.required]],
            paisDTO: [null, [Validators.required]]
        });
        this.suscripcion = this.ABMClientesService.events.subscribe(
            (data: any) => {
                if (data == 1) {
                    this.close();
                } else if (data == 4) {
                    this.create();
                }
            }
        )
    }

    ngOnInit(): void {
        this.clientesService.getProvincias().subscribe(d => {
            this.provincias = d.data;
        });
        this.clientesService.getPaises().subscribe(d => {
            this.paises = d.data;
        });

        this.filteredPaises = this.clienteForm.get('paisDTO').valueChanges.pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value?.nombre),
            map(nombre => nombre ? this._filterPaises(nombre) : this.paises.slice())
        );

        this.clienteForm.get('paisDTO').valueChanges.subscribe(val => {
            const paisNombre = (typeof val === 'string' ? val : val?.nombre)?.trim();
            if (paisNombre?.toLowerCase() === 'argentina') {
                this.clienteForm.get('provincia').setValidators([Validators.required]);
            } else {
                this.clienteForm.get('provincia').clearValidators();
                this.clienteForm.get('provincia').setValue(null);
            }
            this.clienteForm.get('provincia').updateValueAndValidity();
            this.cdRef.detectChanges();
        });

        this.empresa = [
            { nombre: 'NITROPHYL' },
            { nombre: 'ELASINT' }
        ];
    }

    private _filterPaises(nombre: string): Pais[] {
        const filterValue = nombre.toLowerCase();
        return this.paises.filter(pais => pais.nombre.toLowerCase().includes(filterValue));
    }

    displayPais(pais: Pais): string {
        return pais && pais.nombre ? pais.nombre : '';
    }

    get esArgentina(): boolean {
        const val = this.clienteForm.get('paisDTO')?.value;
        const nombre = (typeof val === 'string' ? val : val?.nombre)?.trim();
        return nombre?.toLowerCase() === 'argentina';
    }

    ngAfterViewInit() {
        let top = document.getElementById('top');
        if (top !== null) {
            top.scrollIntoView();
            top = null;
        }
    }

    ngOnDestroy(): void {
        this.suscripcion.unsubscribe()
    }

    create() {
        this.clienteForm.markAllAsTouched();
        if (!this.clienteForm.valid) {
            return;
        };
        let formValue = this.clienteForm.getRawValue();
        if (typeof formValue.paisDTO === 'string') {
            formValue.paisDTO = { id: null, nombre: formValue.paisDTO };
        }
        if (formValue.paisDTO?.nombre?.toLowerCase() !== 'argentina' && formValue.paisDTO?.id !== 1000) {
            formValue.provincia = null;
        }
        let model: Cliente = {
            ...formValue,
            id: 0
        };
        this.clientesService.createCliente(model).subscribe(d => {
            if (d.status == 'OK') {
                this.notificationService.showSuccess('Cambios realizados.');
                this.router.navigateByUrl(`/clientes/grid`);
            } else {
                this.notificationService.showError('No se puedieron realizar los cambios.');
            }
        },
            err => {
                this.notificationService.showError('No se puedieron realizar los cambios.');
            })
    }

    close() {
        if (this.clienteForm.pristine == true) {
            this.router.navigate(['/clientes/grid'])
        } else {
            const dialogRef = this.dialog.open(RemoveDialogComponent, {
                maxWidth: '50%',
                data: { data: null, seccion: 'cliente', boton: 'Cerrar' },
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.router.navigate(['/clientes/grid']);
                }
            });
        }
    }
}