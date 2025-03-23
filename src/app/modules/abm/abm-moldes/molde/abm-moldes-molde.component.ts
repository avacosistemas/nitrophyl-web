import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RemoveDialogComponent } from 'app/modules/prompts/remove/remove.component';
import { DialogCustomComponent } from 'app/modules/prompts/dialog-custom/dialog-custom.component';
import {
  Boca,
  Dimension,
  Fotos,
  Molde,
  Planos,
  Plano
} from 'app/shared/models/molde.model';
import { MoldesService } from 'app/shared/services/moldes.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { ABMMoldeService } from '../abm-moldes-service';
import * as FileSaver from 'file-saver';
import { ABMMoldesModalComponent } from '../modal/abm-moldes-modal.component';
import { ClientesService } from 'app/shared/services/clientes.service';
import { Observacion } from 'app/shared/models/observacion.model';
import { AuthService } from 'app/core/auth/auth.service';
import { ModalFotoComponent } from '../modal-foto/modal-foto.component';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { MatTableDataSource } from '@angular/material/table';
import { PDFModalDialogComponent } from 'app/modules/prompts/pdf-modal/pdf-modal.component';

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
  estados = ['ACTIVO', 'INACTIVO', 'REPARACION'];
  dimensionesSelect = ['ALTO', 'ANCHO', 'PROFUNDIDAD', 'DIAMETRO'];
  currentTab: number = 0;
  pristineBocas: boolean = true;
  pristineDimensiones: boolean = true;
  currentId: number;
  filesTestPlano;
  filesTestPlanoBlob;
  filesTestFoto;
  bocaGridForm: FormGroup = new FormGroup({});

  public clientForm: FormGroup;
  public clients$: Array<any> = [];
  public clients: Array<any> = [];
  public displayedColumnsClients: string[] = [
    'idCliente',
    'nombre',
    'acciones',
  ];
  public pristineClient: boolean = true;

  private bocaChanges = new Subject<Boca>();
  private stateChanges = new Subject<Boca>();
  private descriptionChanges = new Subject<Boca>();

  private dimensionValueChanges = new Subject<{ dimension: Dimension, newValue: any }>();

  constructor(
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private router: Router,
    private _molds: MoldesService,
    private _clients: ClientesService,
    private _formBuilder: FormBuilder,
    private ABMoldesService: ABMMoldeService,
    private snackBar: MatSnackBar,
    private _authService: AuthService
  ) {
    this.moldeForm = this._formBuilder.group({
      codigo: [null, [Validators.required, Validators.maxLength(30)]],
      estado: [null, [Validators.required]],
      nombre: [null, [Validators.required, Validators.maxLength(100)]],
      observacion: [null],
      ubicacion: [null],
      client: [null, [Validators.required]],
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

    this.bocaChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.nroBoca === b.nroBoca && a.descripcion === b.descripcion)
      )
      .subscribe(boca => {
        this.updateBocaDescription(boca);
      });

    this.stateChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.nroBoca === b.nroBoca && a.estado === b.estado)
      )
      .subscribe(boca => {
        this.updateBocaState(boca);
      });

    this.descriptionChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.nroBoca === b.nroBoca && a.descripcion === b.descripcion)
      )
      .subscribe(boca => {
        this.updateBocaDescription(boca);
      });
  }

  ngOnDestroy(): void {
    this.suscripcion.unsubscribe();
    this.dimensionValueChanges.unsubscribe();
    this.bocaChanges.unsubscribe();
    this.stateChanges.unsubscribe();
    this.descriptionChanges.unsubscribe();
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
    this._clients
      .getClientes()
      .subscribe((res: any) => (this.clients$ = res.data));
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
        mostrarBoton = true;
        break;
      case 6:
        mostrarBoton = false;
        break;
    }

    this.ABMoldesService.events.next({ mostrarBotonEdicion: mostrarBoton });
    switch (newTab) {
      case 0:
        this.ABMoldesService.viewEvents.next('Guardar Molde');
        break;
      case 1:
        break;
      case 2:
        break;
      case 3:
        this.ABMoldesService.viewEvents.next('Subir Plano');
        break;
      case 4:
        this.ABMoldesService.viewEvents.next('Subir Foto');
        break;
      case 5:
        break;
      case 6:
        break;
    }
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
    switch (this.currentTab) {
      case 0:
        this.editMolde();
        break;
      case 3:
        this.uploadPlano();
        break;
      case 4:
        this.uploadFoto();
        break;
      case 6:
        this.addObservacion();
        break;
    }
  }

  editMolde() {
    if (this.moldeForm.invalid) {

      if (this.moldeForm.get('codigo').hasError('required')) {
        this.openSnackBar('El código es requerido.', 'X', 'red-snackbar');
      } else if (this.moldeForm.get('codigo').hasError('maxlength')) {
        this.openSnackBar('El código no puede tener más de 30 caracteres.', 'X', 'red-snackbar');
      } else if (this.moldeForm.get('estado').hasError('required')) {
        this.openSnackBar('El estado es requerido.', 'X', 'red-snackbar');
      } else if (this.moldeForm.get('nombre').hasError('required')) {
        this.openSnackBar('El nombre es requerido.', 'X', 'red-snackbar');
      } else if (this.moldeForm.get('nombre').hasError('maxlength')) {
        this.openSnackBar('El nombre no puede tener más de 100 caracteres.', 'X', 'red-snackbar');
      } else if (this.moldeForm.get('client').hasError('required')) {
        this.openSnackBar('El propietario es requerido.', 'X', 'red-snackbar');
      } else {
        this.openSnackBar('Por favor, corrija los errores en el formulario.', 'X', 'red-snackbar');
      }
      return;
    }

    let client: any = this.clients$.find((element: any) => {
      return element.id === this.moldeForm.controls.client.value;
    });

    let model: Molde = {
      codigo: this.moldeForm.controls.codigo.value,
      estado: this.moldeForm.controls.estado.value,
      nombre: this.moldeForm.controls.nombre.value,
      observaciones: this.moldeForm.controls.observaciones.value,
      ubicacion: this.moldeForm.controls.ubicacion.value,
      idClienteDuenio: client ? client.id : null,
      clienteDuenio: client ? client.nombre : null,
      propio: client ? false : true,
      id: this.currentId,
    };

    this._molds.updateMolde(this.currentId, model).subscribe((res) => {
      if (res.status == 'OK') {
        this.moldeForm.markAsPristine();
        this.openSnackBar('Cambios realizados', 'X', 'green-snackbar');
      } else {
        this.openSnackBar(
          'No se pudieron realizar los cambios',
          'X',
          'red-snackbar'
        );
      }
    });
  }

  inicializar() {
    this.currentId = this.activatedRoute.snapshot.params['id'];
    this._molds.getMoldeById(this.currentId).subscribe((d) => {
      this.moldeForm.patchValue({
        codigo: d.data.codigo,
        estado: d.data.estado,
        nombre: d.data.nombre,
        observaciones: d.data.observaciones,
        ubicacion: d.data.ubicacion,
        client: d.data.idClienteDuenio === null ? -1 : d.data.idClienteDuenio,
      });
    });
    this._molds.getMoldeBocas(this.currentId).subscribe((d) => {
      this.bocas = d.data;
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
    this._molds.getMoldeDimensiones(this.currentId).subscribe((d) => {
      this.dimensiones = d.data;
    });
    this._molds.getPlanos(this.currentId).subscribe((d) => {
      this.planos.data = d.data;
    });
    this._molds.getFotos(this.currentId).subscribe((response) => {
      this.fotos.data = response.data;
    });

    this._molds
      .getClients(this.currentId)
      .subscribe((res: any) => (this.clients = res.data));

    this.getObservaciones();

    this.ABMoldesService.viewEvents.next('Guardar Molde');
  }

  public addClient(): void {
    if (!this.moldeForm.get('client').value) return;
    let selectedClient = this.clients$.find(
      (client: any) => client.id === this.moldeForm.get('client').value
    );

    let exists = this.clients.some(
      (client: any) => client.idCliente === selectedClient.id
    );
    if (exists) {
      this.openSnackBar(
        'El cliente ya esta asociado al molde.',
        'X',
        'red-snackbar'
      );
    } else {
      this.clients.push({
        idCliente: selectedClient.id,
        nombre: selectedClient.nombre,
      });
      this.clients.sort((a, b) => a.idCliente - b.idCliente);
      this.clients = [...this.clients];
      this.pristineClient = false;

      this.updateClientsOnBackend();
    }
  }

  public deleteClient(row: any): void {
    let i = this.clients.findIndex((client: any) => client.id === row.id);
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
          this.moldeForm.get('client').setValue(null);
          this.moldeForm.get('client').markAsUntouched();
          this.pristineClient = true;
          this.openSnackBar(
            'Lista de clientes actualizada. ',
            'X',
            'green-snackbar'
          );
        } else {
          this.openSnackBar(
            'No se pudieron guardar los cambios. ',
            'X',
            'red-snackbar'
          );
        }
      },
      error: (err: any) => {
        this.openSnackBar(`Se ha producido un error. `, 'X', 'red-snackbar');
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

  openSnackBar(message: string, action: string, className: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: className,
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
        this.openSnackBar('Observación agregada correctamente', 'X', 'green-snackbar');
        this.observacionForm.reset();
        this.getObservaciones();
      },
      error: (error) => {
        this.openSnackBar('Error al agregar la observación', 'X', 'red-snackbar');
        console.error('Error al agregar la observación:', error);
      },
    });
  }

  getObservaciones() {
    this._molds.getObservaciones(this.currentId).subscribe({
      next: (response: any) => {
        this.observaciones = response.data;
      },
      error: (error) => {
        this.openSnackBar('Error al obtener las observaciones', 'X', 'red-snackbar');
        console.error('Error al obtener las observaciones:', error);
      },
    });
  }

  public openFoto(foto: Fotos): void {
    console.log('Abriendo foto:', foto);

    this._molds.downloadFoto(foto.id).subscribe({
      next: (response: any) => {
        const base64Image = response?.data?.archivo;

        if (!base64Image) {
          console.error('No se recibió un string Base64 válido del backend.');
          this.snackBar.open('Error al obtener la imagen', 'Cerrar', { duration: 3000 });
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
        this.snackBar.open('Error al obtener la imagen', 'Cerrar', { duration: 3000 });
      }
    });
  }

  public downloadFoto(foto: Fotos): void {
    console.log('Descargar foto:', foto);
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

  public downloadPlano(plano: Plano): void {
    this._molds.downloadPlano(plano.id).subscribe((response: any) => {

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

      const blob = new Blob(byteArrays, { type: 'application/pdf' });
      FileSaver.saveAs(blob, plano.nombreArchivo);
    });
  }

  public openPlano(plano: Plano): void {

    this._molds.downloadPlano(plano.id).subscribe({
      next: (response: any) => {
        const base64Content = response?.data?.archivo;

        if (!base64Content) {
          console.error('No se recibió un string Base64 válido del backend.');
          this.snackBar.open('Error al obtener el plano', 'Cerrar', { duration: 3000 });
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
        this.snackBar.open('Error al obtener el plano', 'Cerrar', { duration: 3000 });
      }
    });
  }

  addDimension(): void {
    if (this.dimensionForm.invalid) {

      if (this.dimensionForm.get('dimension').hasError('required')) {
        this.openSnackBar('El tipo de dimensión es obligatorio.', 'X', 'red-snackbar');
      } else if (this.dimensionForm.get('valor').hasError('required')) {
        this.openSnackBar('El valor de la dimensión es obligatorio.', 'X', 'red-snackbar');
      } else if (this.dimensionForm.get('valor').hasError('pattern')) {
        this.openSnackBar('El valor de la dimensión debe contener solo números.', 'X', 'red-snackbar');
      } else {
        this.openSnackBar('Por favor, corrija los errores en el formulario.', 'X', 'red-snackbar');
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
      this.openSnackBar(
        'Ya existe una dimensión con este tipo.',
        'X',
        'red-snackbar'
      );
      return;
    }

    const updatedDimensions = [...this.dimensiones, newDimension];

    this._molds.updateMoldeDimensiones(this.currentId, updatedDimensions).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.openSnackBar('Dimensión agregada correctamente', 'X', 'green-snackbar');
          this.dimensionForm.reset();
          this.pristineDimensiones = false;
          this.getDimensiones();
        } else {
          this.openSnackBar('Error al agregar la dimensión', 'X', 'red-snackbar');
        }
      },
      error: (error) => {
        this.openSnackBar('Error al agregar la dimensión', 'X', 'red-snackbar');
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
              this.openSnackBar('Dimensión eliminada correctamente', 'X', 'green-snackbar');
              this.getDimensiones();
              this.pristineDimensiones = false;
            } else {
              this.openSnackBar('Error al eliminar la dimensión', 'X', 'red-snackbar');
            }
          },
          error: (error) => {
            this.openSnackBar('Error al eliminar la dimensión', 'X', 'red-snackbar');
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
            this.openSnackBar('Dimensión actualizada correctamente', 'X', 'green-snackbar');
            this.pristineDimensiones = false;
            this.getDimensiones();
          } else {
            this.openSnackBar('Error al actualizar la dimensión', 'X', 'red-snackbar');
          }
        },
        error: (error) => {
          this.openSnackBar('Error al actualizar la dimensión', 'X', 'red-snackbar');
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
    if (this.bocaForm.invalid) {

      if (this.bocaForm.get('boca').hasError('required')) {
        this.openSnackBar('El número de boca es obligatorio.', 'X', 'red-snackbar');
      } else if (this.bocaForm.get('boca').hasError('pattern')) {
        this.openSnackBar('El número de boca debe contener solo números.', 'X', 'red-snackbar');
      } else if (this.bocaForm.get('estado').hasError('required')) {
        this.openSnackBar('El estado es obligatorio.', 'X', 'red-snackbar');
      } else if (this.bocaForm.get('descripcion').hasError('maxlength')) {
        this.openSnackBar('La descripción no puede tener más de 100 caracteres.', 'X', 'red-snackbar');
      } else {
        this.openSnackBar('Por favor, corrija los errores en el formulario.', 'X', 'red-snackbar');
      }
      return;
    }
    if (this.bocaForm.invalid) {
      return;
    }

    const newBoca: Boca = {
      nroBoca: parseInt(this.bocaForm.get('boca').value, 10),
      estado: this.bocaForm.get('estado').value,
      descripcion: this.bocaForm.get('descripcion').value,
    };

    if (this.bocas.some(b => b.nroBoca === newBoca.nroBoca)) {
      this.openSnackBar('Ya existe una boca con ese número.', 'X', 'red-snackbar');
      return;
    }

    const updatedBocas = [...this.bocas, newBoca];

    this._molds.updateMoldeBocas(this.currentId, updatedBocas).subscribe({
      next: (response) => {
        if (response.status === 'OK') {
          this.openSnackBar('Boca agregada correctamente', 'X', 'green-snackbar');
          this.bocaForm.reset();
          this.pristineBocas = false;
          this.getBocas();
        } else {
          this.openSnackBar('Error al agregar la boca', 'X', 'red-snackbar');
        }
      },
      error: (error) => {
        this.openSnackBar('Error al agregar la boca', 'X', 'red-snackbar');
        console.error('Error al agregar la boca:', error);
      },
    });
  }

  deleteBoca(bocaToDelete: Boca): void {
    const dialogRef = this.dialog.open(RemoveDialogComponent, {
      maxWidth: '450px',
      data: { data: null, seccion: 'boca', boton: 'Eliminar' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedBocas = this.bocas.filter(boca => boca.nroBoca !== bocaToDelete.nroBoca);

        this._molds.updateMoldeBocas(this.currentId, updatedBocas).subscribe({
          next: (response) => {
            if (response.status === 'OK') {
              this.openSnackBar('Boca eliminada correctamente', 'X', 'green-snackbar');
              this.getBocas();
              this.pristineBocas = false;
            } else {
              this.openSnackBar('Error al eliminar la boca', 'X', 'red-snackbar');
            }
          },
          error: (error) => {
            this.openSnackBar('Error al eliminar la boca', 'X', 'red-snackbar');
            console.error('Error al eliminar la boca:', error);
          },
        });
      }
    });
  }

  onStateChange(boca: Boca, newState: string): void {
    boca.estado = newState;
    this.stateChanges.next(boca);
    this.pristineBocas = false;
  }

  onDescriptionInput(boca: Boca, newDescription: string): void {
    boca.descripcion = newDescription;
    this.descriptionChanges.next(boca);
    this.pristineBocas = false;
  }

  updateBocaDescription(bocaToUpdate: Boca): void {

    const bocaIndex = this.bocas.findIndex(boca => boca.nroBoca === bocaToUpdate.nroBoca);
    if (bocaIndex !== -1) {
      this.bocas[bocaIndex] = { ...this.bocas[bocaIndex], descripcion: bocaToUpdate.descripcion };
      const updatedBocas = [...this.bocas];

      this._molds.updateMoldeBocas(this.currentId, updatedBocas).subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.openSnackBar('Descripcion actualizada correctamente', 'X', 'green-snackbar');
            this.getBocas();
            this.pristineBocas = false;
          } else {
            this.openSnackBar('Error al actualizar la descripcion', 'X', 'red-snackbar');
          }
        },
        error: (error) => {
          this.openSnackBar('Error al actualizar la descripcion', 'X', 'red-snackbar');
          console.error('Error al actualizar la descripcion:', error);
        },
      });
    }
  }

  updateBocaState(bocaToUpdate: Boca): void {
    const bocaIndex = this.bocas.findIndex(boca => boca.nroBoca === bocaToUpdate.nroBoca);
    if (bocaIndex !== -1) {
      this.bocas[bocaIndex] = { ...this.bocas[bocaIndex], estado: bocaToUpdate.estado };
      const updatedBocas = [...this.bocas];

      this._molds.updateMoldeBocas(this.currentId, updatedBocas).subscribe({
        next: (response) => {
          if (response.status === 'OK') {
            this.openSnackBar('Estado actualizado correctamente', 'X', 'green-snackbar');
            this.getBocas();
            this.pristineBocas = false;
          } else {
            this.openSnackBar('Error al actualizar el estado', 'X', 'red-snackbar');
          }
        },
        error: (error) => {
          this.openSnackBar('Error al actualizar el estado', 'X', 'red-snackbar');
          console.error('Error al actualizar el estado:', error);
        },
      });
    }
  }

  getBocas(): void {
    this._molds.getMoldeBocas(this.currentId).subscribe((d) => {
      this.bocas = d.data;
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