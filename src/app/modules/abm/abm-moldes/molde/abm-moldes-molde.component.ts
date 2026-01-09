import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormArray,
  ValidatorFn,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { DialogCustomComponent } from 'app/modules/prompts/dialog-custom/dialog-custom.component';
import {
  Boca,
  Dimension,
  Fotos,
  Molde,
  Planos,
  Plano,
} from 'app/shared/models/molde.model';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription, Subject, Observable, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, take, startWith, map } from 'rxjs/operators';
import { ABMMoldeService } from '../abm-moldes.service';
import * as FileSaver from 'file-saver';
import { ABMMoldesModalComponent } from '../modal/abm-moldes-modal.component';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Observacion } from 'app/shared/models/observacion.model';
import { ModalFotoComponent } from '../modal-foto/modal-foto.component';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatTableDataSource } from '@angular/material/table';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';
import { NotificationService } from 'app/shared/services/notification.service';
import { ABMPiezaService } from 'app/modules/abm/abm-piezas/abm-piezas.service';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';
import { TextareaModalComponent } from '../textarea-modal/textarea-modal.component';

interface Cliente {
  id: number;
  nombre: string;
  codigo?: string;
}

@Component({
  selector: 'abm-moldes-molde',
  templateUrl: './abm-moldes-molde.component.html',
  styleUrls: ['./abm-moldes-molde.component.scss'],
})
export class ABMMoldesMolde implements OnInit, OnDestroy {
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  component: string = 'Molde';
  mode: string;
  suscripcion: Subscription;
  moldeForm: FormGroup;
  bocaForm: FormGroup;
  dimensionForm: FormGroup;
  observacionForm: FormGroup;
  displayedColumnsBocas: string[] = [
    'boca',
    'estado',
    'descripcion',
    'acciones',
  ];
  displayedColumnsDimensiones: string[] = ['dimension', 'valor', 'acciones'];
  displayedColumnsPlanos: string[] = [
    'nombre',
    'clasificacion',
    'descripcion',
    'version',
    'fecha',
    'acciones',
  ];
  displayedColumnsFotos: string[] = [
    'nombre',
    'descripcion',
    'fecha',
    'acciones',
  ];

  displayedColumnsObservaciones: string[] = ['observacion', 'fecha', 'usuario'];
  observaciones: Array<Observacion> = [];
  pristineObservaciones: boolean = true;

  planos: MatTableDataSource<Planos> = new MatTableDataSource<Planos>([]);
  fotos: MatTableDataSource<Fotos> = new MatTableDataSource<Fotos>([]);
  bocas: Array<Boca> = [];
  dimensiones: Array<Dimension> = [];
  estados = ['ACTIVO', 'INACTIVO', 'REPARACION', 'EN_FABRICACION'];
  dimensionesSelect = ['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO'];
  currentTab: number = 0;
  pristineBocas: boolean = true;
  pristineDimensiones: boolean = true;
  currentId: number;
  filesTestPlano;
  filesTestPlanoBlob;
  filesTestFoto;
  bocaGridForm: FormGroup = new FormGroup({});

  tiposPieza: { id: number; nombre: string }[] = [];

  public clientForm: FormGroup;
  public clients$: Cliente[] = [];
  public filteredClients$: Observable<Cliente[]>;
  public filteredClientsForAdding$: Observable<Cliente[]>;
  public clients: Array<any> = [];
  public displayedColumnsClients: string[] = [
    'nombre',
    'acciones',
  ];
  public pristineClient: boolean = true;
  public initialMolde: Molde;

  private descriptionChanges = new Subject<Boca>();
  private dimensionValueChanges = new Subject<{ dimension: Dimension, newValue: any }>();
  private pristineBocasData: Boca[] = [];

  private requireAtLeastOneCheckbox(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const checkboxes = formArray as FormArray;
      const hasAtLeastOne = checkboxes.controls.some(control => control.value === true);
      return hasAtLeastOne ? null : { requireAtLeastOne: true };
    };
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private router: Router,
    private _molds: MoldesService,
    private _clients: ClientesService,
    private _abmPiezaService: ABMPiezaService,
    private _formBuilder: FormBuilder,
    private ABMoldesService: ABMMoldeService,
    private notificationService: NotificationService,
  ) {
    this.moldeForm = this._formBuilder.group({
      codigo: [null, [Validators.required, Validators.maxLength(30)]],
      estado: [null, [Validators.required]],
      nombre: [null, [Validators.required, Validators.maxLength(100)]],
      observaciones: [null],
      ubicacion: [null],
      cantidadBocas: [{ value: null, disabled: true }],
      client: [null, [Validators.required]],
      piezaTipos: this._formBuilder.array([], this.requireAtLeastOneCheckbox())
    });
    this.bocaForm = this._formBuilder.group({
      boca: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
      estado: [null, [Validators.required]],
      descripcion: [null, [Validators.maxLength(100)]],
    });
    this.dimensionForm = this._formBuilder.group({
      dimension: [null, [Validators.required]],
      valor: [null, [Validators.required, Validators.pattern("^[0-9]*$")]],
    });
    this.observacionForm = this._formBuilder.group({
      observacion: [null, [Validators.required]],
    });
    this.clientForm = this._formBuilder.group({
      client: [null, [Validators.required]],
    });
    this.suscripcion = this.ABMoldesService.events.subscribe((data: any) => {
      if (data == 1) {
        this.close();
      } else if (data == 2) {
        this.edit();
      }
    });
  }

  ngOnInit(): void {
    this.mode = this.activatedRoute.snapshot.data['mode'];
    this.currentId = this.activatedRoute.snapshot.params['id'];
    this.inicializar();

    let mostrarBoton = false;
    if (this.mode !== 'View') {
      switch (this.currentTab) {
        case 0:
          mostrarBoton = true;
          break;
      }
    }

    this.ABMoldesService.events.next({ mostrarBotonEdicion: mostrarBoton });

    if (this.mode === 'View') {
      this.moldeForm.disable();
      this.bocaGridForm.disable();
      this.clientForm.disable();
      this.observacionForm.disable();
    }

    this.dimensionValueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.dimension.tipoDimension === b.dimension.tipoDimension && a.newValue === b.newValue)
      )
      .subscribe(({ dimension, newValue }) => {
        this.updateDimensionValue(dimension, newValue);
      });
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
    this.dimensionValueChanges.unsubscribe();
    if (this.planos) {
      this.planos.data = [];
    }
    if (this.fotos) {
      this.fotos.data = [];
    }
  }

  ngAfterViewInit() {
    let top = document.getElementById('top');
    if (top !== null) {
      top.scrollIntoView();
      top = null;
    }
  }

  private _filterClients(value: string | Cliente, source: Cliente[]): Cliente[] {
    const filterValue = (typeof value === 'string' ? value : (value?.nombre || '')).toLowerCase();
    if (!filterValue) {
      return source;
    }
    return source.filter(client =>
      client.nombre.toLowerCase().includes(filterValue) ||
      (client.codigo && client.codigo.toLowerCase().includes(filterValue))
    );
  }

  displayClient(client: Cliente): string {
    return client ? client.nombre : '';
  }

  allowTabChange: boolean = true;

  tabChange(event: MatTabChangeEvent) {
    if (this.currentTab === 0 && this.moldeForm.dirty) {
      const dialogRef = this.dialog.open(DialogCustomComponent, {
        maxWidth: '450px',
        data: {
          title: 'Descartar cambios de Datos del Molde',
          message: '¿Está seguro que desea continuar sin guardar los cambios realizados?',
          confirmButtonText: 'Continuar',
          cancelButtonText: 'Volver',
        },
      });

      dialogRef.afterClosed().pipe(take(1)).subscribe(res => {
        if (res === 'confirm') {
          this.moldeForm.markAsPristine();
          this.currentTab = event.index;
          this.tabGroup.selectedIndex = event.index;
          this.proceedToTabChange(event.index);
        } else {
          this.moldeForm.markAsPristine();
          this.tabGroup.selectedIndex = this.currentTab;
        }
      });
    } else {
      this.currentTab = event.index;
      this.proceedToTabChange(event.index);
    }
  }

  proceedToTabChange(newTab: number) {
    this.currentTab = newTab;
    let mostrarBoton = false;

    if (this.mode !== 'View') {
      switch (newTab) {
        case 0:
          mostrarBoton = true;
          break;
        case 1:
          mostrarBoton = false;
          break;
        case 2:
          mostrarBoton = false;
          break;
        case 3:
          mostrarBoton = true;
          break;
        case 4:
          mostrarBoton = true;
          break;
        case 5:
          mostrarBoton = false;
          break;
        case 6:
          mostrarBoton = false;
          break;
      }
    } else {
      mostrarBoton = false;
    }

    this.ABMoldesService.events.next({ mostrarBotonEdicion: mostrarBoton });
    let viewEventText = '';
    if (this.mode !== 'View') {
      switch (newTab) {
        case 0:
          viewEventText = 'Guardar Molde';
          break;
        case 3:
          viewEventText = 'Subir Plano';
          break;
        case 4:
          viewEventText = 'Subir Foto';
          break;
      }
    }
    this.ABMoldesService.viewEvents.next(viewEventText);
  }

  canChangeTab(): boolean {
    if (this.moldeForm.dirty) {

      const dialogRef = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '450px',
        data: {
          seccion: 'Datos del Molde',
          message: '¿Está seguro que desea continuar sin guardar los cambios realizados?',
          confirmButtonText: 'Continuar',
          showBackButton: true,
          title: 'Descartar cambios de Datos del Molde',
        },
      });

      let result: boolean = false;

      dialogRef.afterClosed().pipe(take(1)).subscribe(res => {
        if (res === 'confirm') {
          result = true;
          this.moldeForm.markAsPristine();
        } else if (res === 'back') {
          result = true;
          this.currentTab = 0;

          this.ABMoldesService.events.next({ mostrarBotonEdicion: true });
        } else {
          result = false;
        }
      });

      return result;
    }
    return true;
  }

  close() {
    if (
      this.moldeForm.pristine == true &&
      this.pristineBocas &&
      this.pristineDimensiones &&
      this.pristineClient &&
      this.pristineObservaciones
    ) {
      this.router.navigate(['/moldes/grid']);
    } else {
      const dialogRef = this.dialog.open(RemoveDialogComponent, {
        maxWidth: '450px',
        data: { data: null, seccion: 'molde', boton: 'Cerrar' },
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.router.navigate(['/moldes/grid']);
        }
      });
    }
  }

  edit() {
    if (this.currentTab === 0) {
      setTimeout(() => {
        this.editMolde();
      }, 0);
    } else if (this.currentTab === 3) {
      this.uploadPlano();
    } else if (this.currentTab === 4) {
      this.uploadFoto();
    } else if (this.currentTab === 6) {
      this.addObservacion();
    }
  }

  editMolde() {
    this.moldeForm.markAllAsTouched();

    if (this.moldeForm.invalid) {
      this.notificationService.showError('Por favor, corrija los errores en el formulario.');
      return;
    }
    const clientValue = this.moldeForm.get('client').value;
    if (!clientValue || typeof clientValue === 'string') {
      this.notificationService.showError('Por favor, seleccione un propietario válido.');
      return;
    }
    const client: Cliente = clientValue;

    const selectedTiposPieza = this.moldeForm.value.piezaTipos
      .map((checked, i) => checked ? { id: this.tiposPieza[i].id } : null)
      .filter(v => v !== null);

    let model: Molde = {
      codigo: this.moldeForm.controls.codigo.value,
      estado: this.moldeForm.controls.estado.value,
      nombre: this.moldeForm.controls.nombre.value,
      observaciones: this.moldeForm.controls.observaciones.value,
      ubicacion: this.moldeForm.controls.ubicacion.value,
      idClienteDuenio: client.id !== -1 ? client.id : null,
      clienteDuenio: client.id !== -1 ? client.nombre : null,
      propio: client.id === -1,
      id: this.currentId,
      piezaTipos: selectedTiposPieza
    };

    const newState = this.moldeForm.get('estado').value;
    if (this.initialMolde && newState !== this.initialMolde.estado) {
      const dialogRef = this.dialog.open(GenericModalComponent, {
        data: {
          title: 'Cambio de Estado del Molde',
          message: `Está modificando el estado del Molde de <b>${this.initialMolde.estado}</b> a <b>${newState}</b>, por favor indique una observación.`,
          type: 'warning',
          icon: 'exclamation',
          showConfirmButton: true,
          confirmButtonText: 'Guardar',
          cancelButtonText: 'Cancelar',
          customComponent: TextareaModalComponent
        },
        width: '500px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          model.observacionesEstado = result;
          this.callUpdateMoldeApi(model);
        }
      });
    } else {
      this.callUpdateMoldeApi(model);
    }
  }

  private callUpdateMoldeApi(model: Molde): void {
    this._molds.updateMolde(this.currentId, model).subscribe((res) => {
      if (res.status == 'OK') {
        this.moldeForm.markAsPristine();
        this.notificationService.showSuccess('Cambios realizados.');
        this.initialMolde = JSON.parse(JSON.stringify(model));
      } else {
        this.notificationService.showError('No se pudieron realizar los cambios.');
      }
    });
  }

  inicializar() {
    forkJoin({
      molde: this._molds.getMoldeById(this.currentId),
      tiposPieza: this._abmPiezaService.getPiezaTipo(),
      clientes: this._clients.getClientes()
    }).subscribe({
      next: ({ molde, tiposPieza, clientes }) => {
        this.tiposPieza = tiposPieza;

        this.clients$ = [{ id: -1, nombre: 'Nitrophyl', codigo: 'N/A' }, ...clientes.data];

        this.filteredClients$ = this.moldeForm.get('client').valueChanges.pipe(
          startWith(''),
          map(value => this._filterClients(value, this.clients$))
        );
        this.filteredClientsForAdding$ = this.clientForm.get('client').valueChanges.pipe(
          startWith(''),
          map(value => this._filterClients(value, this.clients$.filter(c => c.id !== -1)))
        );

        this.loadMoldeData(molde.data);
      },
      error: (err) => {
        console.error('Error al inicializar los datos del molde:', err);
        this.notificationService.showError('No se pudieron cargar los datos iniciales del molde.');
      }
    });

    this._molds.getMoldeBocas(this.currentId).subscribe((d) => {
      this.bocas = d.data;
      this.pristineBocasData = JSON.parse(JSON.stringify(d.data));
      if (this.bocas.length > 0) {
        this.bocas.forEach((b) => {
          this.bocaGridForm.addControl(
            `control-${b.nroBoca}-${b.descripcion}`,
            new FormControl(b.descripcion, Validators.maxLength(100))
          );
        });
        if (this.mode == 'View') {
          this.bocaGridForm.disable();
        }
      }
    });
    this._molds.getMoldeDimensiones(this.currentId).subscribe((d) => { this.dimensiones = d.data; });
    this._molds.getPlanos(this.currentId).subscribe((d) => { this.planos.data = d.data; });
    this._molds.getFotos(this.currentId).subscribe((response) => { this.fotos.data = response.data; });
    this._molds.getClients(this.currentId).subscribe((res: any) => (this.clients = res.data));
    this.getObservaciones();

    this.ABMoldesService.viewEvents.next('Guardar Molde');
  }

  loadMoldeData(data: Molde): void {
    if (!data) return;
    this.initialMolde = JSON.parse(JSON.stringify(data));
    const propietarioId = data.idClienteDuenio === null ? -1 : data.idClienteDuenio;
    const propietarioObj = this.clients$.find(c => c.id === propietarioId);

    this.moldeForm.patchValue({
      codigo: data.codigo,
      estado: data.estado,
      nombre: data.nombre,
      observaciones: data.observaciones,
      ubicacion: data.ubicacion,
      client: propietarioObj,
      cantidadBocas: data.cantidadBocas,
    });

    const piezaTiposFormArray = this.moldeForm.get('piezaTipos') as FormArray;

    piezaTiposFormArray.clear();

    this.tiposPieza.forEach(tipo => {
      const isSelected = data.piezaTipos?.some(pt => pt.id === tipo.id);
      piezaTiposFormArray.push(new FormControl(isSelected));
    });

    if (this.mode === 'View') {
      this.moldeForm.disable();
    }

    this.ABMoldesService.events.next({ nombreMolde: data.nombre });
  }

  public addClient(): void {
    if (this.clientForm.invalid) return;

    let selectedClient = this.clientForm.get('client').value;
    if (!selectedClient || typeof selectedClient === 'string') {
      this.notificationService.showError('Por favor seleccione un cliente válido.');
      return;
    }

    let exists = this.clients.some(
      (client: any) => client.idCliente === selectedClient.id
    );
    if (exists) {
      this.notificationService.showError('El cliente ya esta asociado al molde.');
    } else {
      this.clients.push({
        idCliente: selectedClient.id,
        nombre: selectedClient.nombre,
      });
      this.clients.sort((a, b) => a.idCliente - b.idCliente);
      this.clients = [...this.clients];
      this.pristineClient = false;
      this.clientForm.reset();
      this.updateClientsOnBackend();
    }
  }

  public deleteClient(row: any): void {
    let i = this.clients.findIndex((client: any) => client.idCliente === row.idCliente);
    if (i >= 0) {
      this.clients.splice(i, 1);
      this.clients = [...this.clients];
      this.pristineClient = false;
      this.updateClientsOnBackend();
    }
  }

  private updateClientsOnBackend(): void {
    let body = this.clients.map((client: any) => ({
      idCliente: client.idCliente,
    }));

    this._molds.putClient(this.currentId, body).subscribe({
      next: (res: any) => {
        if (res.status == 'OK') {
          this.pristineClient = true;
          this.notificationService.showSuccess('Lista de clientes actualizada.');
        } else {
          this.notificationService.showError('No se pudieron guardar los cambios.');
        }
      },
      error: (err: any) => {
        this.notificationService.showError('Se ha producido un error.');
        console.error(
          `abm-moldes-molde.component.ts => private updateClientsOnBackend(): `,
          err
        );
      },
      complete: () => { },
    });
  }

  uploadPlano() {
    const dialogRef = this.dialog.open(ABMMoldesModalComponent, {
      maxWidth: '70%',
      width: '50%',
      data: {
        data: null,
        seccion: 'molde',
        boton: 'Cerrar',
        archivo: 'pdf',
        id: this.currentId,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._molds.getPlanos(this.currentId).subscribe((d) => {
          this.planos.data = d.data;
        });
      }
    });
  }

  uploadFoto() {
    const dialogRef = this.dialog.open(ABMMoldesModalComponent, {
      maxWidth: '70%',
      width: '50%',
      data: {
        data: null,
        seccion: 'molde',
        boton: 'Cerrar',
        archivo: 'imagen',
        id: this.currentId,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._molds.getFotos(this.currentId).subscribe((d) => {
          this.fotos.data = d.data;
        });
      }
    });
  }

  addObservacion() {
    if (this.observacionForm.invalid) {
      return;
    }

    this.pristineObservaciones = false;
    const observacionText = this.observacionForm.get('observacion').value;
    const newObservacion: Observacion = {
      idMolde: this.currentId,
      observacion: observacionText,
    };

    this._molds.postObservacion(newObservacion).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Observación agregada correctamente.');
        this.observacionForm.reset();
        this.getObservaciones();
      },
      error: (error) => {
        this.notificationService.showError('Error al agregar la observación');
        console.error('Error al agregar la observación:', error);
      },
    });
  }

  getObservaciones() {
    this._molds.getObservaciones(this.currentId).subscribe({
      next: (response: any) => {
        this.observaciones = response.data.map(observacion => {
          return {
            ...observacion,
            fecha: new Date(observacion.fechaCreacion),
            usuario: observacion.usuarioCreacion
          };
        });
      },
      error: (error) => {
        this.notificationService.showError('Error al obtener las observaciones.');
        console.error('Error al obtener las observaciones:', error);
      },
    });
  }

  public openFoto(foto: Fotos): void {
    this._molds.downloadFoto(foto.id).subscribe({
      next: (response: any) => {
        const base64Image = response?.data?.archivo;

        if (!base64Image) {
          console.error('No se recibió un string Base64 válido del backend.');
          this.notificationService.showError('Error al obtener la imagen.');
          return;
        }

        let fileExtension = 'jpg';
        const filename = foto.nombreArchivo;
        const lastDot = filename.lastIndexOf('.');

        if (lastDot > 0) {
          fileExtension = filename.substring(lastDot + 1);
        }

        const dialogRef = this.dialog.open(ModalFotoComponent, {
          maxWidth: '90%',
          width: '70%',
          data: {
            imgSrc: base64Image,
            imgAlt: foto.nombreArchivo,
            imgExtension: fileExtension
          },
        });
      },
      error: (error) => {
        console.error('Error al descargar la foto:', error);
        this.notificationService.showError('Error al obtener la imagen.');
      }
    });
  }

  public downloadFoto(foto: Fotos): void {
    this._molds.downloadFoto(foto.id).subscribe((response: any) => {
      const byteCharacters = atob(response.data.archivo);

      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const filename = foto.nombreArchivo;
      const fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);

      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') {
        mimeType = 'image/png';
      } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        mimeType = 'image/jpeg';
      }

      const blob = new Blob(byteArrays, { type: mimeType });
      FileSaver.saveAs(blob, filename);
    });
  }

  public openPlano(plano: Plano): void {

    this._molds.downloadPlano(plano.id).subscribe({
      next: (response: any) => {
        const base64Content = response?.data?.archivo;

        if (!base64Content) {
          console.error('No se recibió un string Base64 válido del backend.');
          this.notificationService.showError('Error al obtener el plano.');
          return;
        }

        this.dialog.open(PDFModalDialogComponent, {
          maxWidth: '75%',
          width: '80vw',
          height: '90vh',
          data: {
            src: base64Content,
            title: plano.nombreArchivo,
            showDownloadButton: true
          },
        });

      },
      error: (error) => {
        console.error('Error al descargar el plano:', error);
        this.notificationService.showError('Error al obtener el plano.');
      }
    });
  }

  addDimension(): void {
    if (this.dimensionForm.invalid) {
      if (this.dimensionForm.get('dimension').hasError('required')) {
        this.notificationService.showError('El tipo de dimensión es obligatorio.');
      } else if (this.dimensionForm.get('valor').hasError('required')) {
        this.notificationService.showError('El valor de la dimensión es obligatorio.');
      } else if (this.dimensionForm.get('valor').hasError('pattern')) {
        this.notificationService.showError('El valor de la dimensión debe contener solo números.');
      } else {
        this.notificationService.showError('Por favor, corrija los errores en el formulario.');
      }
      return;
    }

    const newDimension: Dimension = {
      tipoDimension: this.dimensionForm.get('dimension').value,
      valor: this.dimensionForm.get('valor').value,
    };

    const dimensionExists = this.dimensiones.some(
      (dimension) => dimension.tipoDimension === newDimension.tipoDimension
    );

    if (dimensionExists) {
      this.notificationService.showError('Ya existe una dimensión con este tipo.');
      return;
    }

    const updatedDimensions = [...this.dimensiones, newDimension];

    this._molds.updateMoldeDimensiones(this.currentId, updatedDimensions).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.notificationService.showSuccess('Dimensión agregada correctamente.');
          this.dimensionForm.reset();
          this.pristineDimensiones = true;
          this.getDimensiones();
        } else {
          this.notificationService.showError('Error al agregar la dimensión.');
        }
      },
      error: (error) => {
        this.notificationService.showError('Error al agregar la dimensión.');
        console.error('Error al agregar la dimensión:', error);
      },
    });
  }

  deleteDimension(dimensionToDelete: Dimension): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '450px',
      data: { data: null, seccion: 'dimensión', boton: 'Eliminar' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {

        const updatedDimensions = this.dimensiones.filter(dimension =>
          dimension.tipoDimension !== dimensionToDelete.tipoDimension
        );

        this._molds.updateMoldeDimensiones(this.currentId, updatedDimensions).subscribe({
          next: (response) => {
            if (response.status === 'OK') {
              this.notificationService.showSuccess('Dimensión eliminada correctamente.');
              this.getDimensiones();
              this.pristineDimensiones = true;
            } else {
              this.notificationService.showError('Error al eliminar la dimensión.');
            }
          },
          error: (error) => {
            this.notificationService.showError('Error al eliminar la dimensión.');
            console.error('Error al eliminar la dimensión:', error);
          },
        });
      }
    });
  }

  onDimensionValueChanged(dimension: Dimension, newValue: any): void {
    this.dimensionValueChanges.next({ dimension, newValue });
  }

  updateDimensionValue(dimensionToUpdate: Dimension, newValue: any): void {

    const dimensionIndex = this.dimensiones.findIndex(dimension => dimension.tipoDimension === dimensionToUpdate.tipoDimension);

    if (dimensionIndex !== -1) {

      this.dimensiones[dimensionIndex] = { ...this.dimensiones[dimensionIndex], valor: newValue };
      const updatedDimensions = [...this.dimensiones];

      this._molds.updateMoldeDimensiones(this.currentId, updatedDimensions).subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.notificationService.showSuccess('Dimensión actualizada correctamente.');
            this.pristineDimensiones = true;
            this.getDimensiones();
          } else {
            this.notificationService.showError('Error al actualizar la dimensión.');
          }
        },
        error: (error) => {
          this.notificationService.showError('Error al actualizar la dimensión.');
          console.error('Error al actualizar la dimensión:', error);
        },
      });
    }
  }

  getDimensiones(): void {
    this._molds.getMoldeDimensiones(this.currentId).subscribe((d) => {
      this.dimensiones = d.data;
    });
  }

  addBoca(): void {
    if (this.bocaForm.invalid) return;

    const dialogRef = this.dialog.open(GenericModalComponent, {
      data: {
        title: 'Agregar Boca',
        message: 'Al agregar esta boca, se actualizará automáticamente la <b>Cantidad de Bocas</b> indicada en la creación del molde. ¿Desea continuar?',
        icon: 'exclamation',
        type: 'info',
        showConfirmButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar'
      },
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        const newBoca: Boca = {
          idMolde: Number(this.currentId),
          nroBoca: parseInt(this.bocaForm.get('boca').value, 10),
          estado: this.bocaForm.get('estado').value,
          descripcion: this.bocaForm.get('descripcion').value,
        };

        this._molds.postBoca(newBoca).subscribe({
          next: (res) => {
            if (res.status === 'OK') {
              this.notificationService.showSuccess('Boca agregada y contador actualizado.');
              this.bocaForm.reset({
                estado: 'ACTIVO',
                boca: null,
                descripcion: null
              });
              this.getBocas();
            } else {
              this.notificationService.showError(res.message || 'No se pudo agregar la boca.');
            }
          },
          error: (err) => {
            this.notificationService.showError('Ocurrió un error al procesar la solicitud.');
            console.error(err);
          }
        });
      }
    });
  }

  deleteBoca(bocaToDelete: Boca): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      data: {
        boton: 'Eliminar',
        seccion: 'Boca',
        mensaje: `¿Está seguro que desea quitar la boca <b>${bocaToDelete.nroBoca}</b>? Se actualizará la cantidad de bocas del molde y se reacomodarán las posiciones.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && bocaToDelete.id) {
        this._molds.deleteBocaIndividual(bocaToDelete.id).subscribe({
          next: (res) => {
            if (res.status === 'OK') {
              this.notificationService.showSuccess('Boca eliminada correctamente.');
              this.getBocas();
            }
          }
        });
      }
    });
  }

  updateBocaDescription(bocaToUpdate: Boca): void {
    if (!bocaToUpdate.id) return;

    const payload = {
      descripcion: bocaToUpdate.descripcion,
      estado: bocaToUpdate.estado
    };

    this._molds.updateBoca(bocaToUpdate.id, payload).subscribe({
      next: (res) => {
        if (res.status === 'OK') {
          this.notificationService.showSuccess('Descripción actualizada.');
        }
      }
    });
  }

  onStateChange(boca: Boca, newState: string): void {
    const bocaIndex = this.bocas.findIndex(b => b.nroBoca === boca.nroBoca);
    if (bocaIndex === -1) return;

    const originalBoca = this.pristineBocasData.find(b => b.nroBoca === boca.nroBoca);
    if (!originalBoca || originalBoca.estado === newState) return;

    const dialogRef = this.dialog.open(GenericModalComponent, {
      data: {
        title: 'Cambio de Estado de Boca',
        message: `Está modificando el estado de la Boca N°${originalBoca.nroBoca} de <b>${originalBoca.estado}</b> a <b>${newState}</b>, por favor indique una observación.`,
        type: 'warning',
        cancelButtonText: 'Cancelar',
        showConfirmButton: true,
        customComponent: TextareaModalComponent
      },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(observationResult => {
      if (observationResult) {
        const payload: Partial<Boca> = {
          estado: newState,
          descripcion: boca.descripcion,
          observacionesEstado: observationResult
        };

        this._molds.updateBoca(boca.id, payload).subscribe({
          next: (res) => {
            if (res.status === 'OK') {
              this.notificationService.showSuccess('Estado actualizado correctamente.');
              this.getBocas();
            } else {
              this.notificationService.showError('Error al actualizar el estado.');
              this.getBocas();
            }
          },
          error: () => {
            this.notificationService.showError('Error de red al actualizar.');
            this.getBocas();
          }
        });
      } else {
        this.getBocas();
      }
    });
  }

  isDescriptionModified(element: Boca): boolean {
    if (!this.pristineBocasData) return false;
    const original = this.pristineBocasData.find(b => b.id === element.id);
    return (original?.descripcion || '') !== (element.descripcion || '');
  }

  onDescriptionInput(boca: Boca, newDescription: string): void {
    boca.descripcion = newDescription;
    this.pristineBocas = false;
  }

  saveDescription(boca: Boca): void {
    if (!boca.id) return;

    const payload = {
      descripcion: boca.descripcion,
      estado: boca.estado
    };

    this._molds.updateBoca(boca.id, payload).subscribe({
      next: (res) => {
        if (res.status === 'OK') {
          this.notificationService.showSuccess('Descripción actualizada correctamente.');

          const originalIndex = this.pristineBocasData.findIndex(b => b.id === boca.id);
          if (originalIndex !== -1) {
            this.pristineBocasData[originalIndex].descripcion = boca.descripcion;
          }
          this.pristineBocas = true;
        } else {
          this.notificationService.showError('No se pudo guardar la descripción.');
        }
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Error al conectar con el servidor.');
      }
    });
  }

  cancelDescription(boca: Boca): void {
    const original = this.pristineBocasData.find(b => b.id === boca.id);
    if (original) {
      boca.descripcion = original.descripcion;
    }
    this.pristineBocas = true;
  }

  getBocas(): void {
    this._molds.getMoldeBocas(this.currentId).subscribe((d) => {
      this.bocas = d.data;
      this.pristineBocasData = JSON.parse(JSON.stringify(d.data));
      this.bocas.forEach((b) => {
        if (!this.bocaGridForm.contains(`control-${b.nroBoca}-${b.descripcion}`)) {
          this.bocaGridForm.addControl(
            `control-${b.nroBoca}-${b.descripcion}`,
            new FormControl(b.descripcion, Validators.maxLength(100))
          );
        }

      });
      if (this.mode == 'View') {
        this.bocaGridForm.disable();
      }
    });
  }
}