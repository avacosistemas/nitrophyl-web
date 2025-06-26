import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

import { AbmPiezaTipoService } from '../../abm-pieza-tipo.service';
import { IPiezaTipo, IErrorResponse } from '../../models/pieza-tipo.interface';
import { PiezaTipoModalComponent } from '../pieza-tipo-modal/pieza-tipo-modal.component';
import { GenericModalComponent } from 'app/modules/prompts/modal/generic-modal.component';

@Component({
  selector: 'app-pieza-tipos-list',
  templateUrl: './pieza-tipos-list.component.html',
})
export class PiezaTiposListComponent implements OnInit, OnDestroy {
  isLoading = true;
  dataSource = new MatTableDataSource<IPiezaTipo>([]);
  displayedColumns: string[] = ['nombre', 'acciones'];

  private subscriptions = new Subscription();

  constructor(
    private abmPiezaTipoService: AbmPiezaTipoService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    this.dataSource.filterPredicate = (data: IPiezaTipo, filter: string): boolean => {
      return data.nombre.toLowerCase().includes(filter);
    };
  }

  ngOnInit(): void {
    this.loadPiezaTipos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadPiezaTipos(): void {
    this.isLoading = true;
    const sub = this.abmPiezaTipoService.getPiezaTipos().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar tipos de pieza:', err);
        this.openSnackBar(false, 'No se pudieron cargar los tipos de pieza.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openEditModal(piezaTipo: IPiezaTipo): void {
    const dialogRef = this.dialog.open(PiezaTipoModalComponent, {
      width: '500px',
      data: { mode: 'edit', piezaTipo }
    });

    const sub = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadPiezaTipos();
      }
    });
    this.subscriptions.add(sub);
  }

  openDeleteDialog(piezaTipo: IPiezaTipo): void {
    const message = this.sanitizer.bypassSecurityTrustHtml(
      `¿Estás seguro que deseas eliminar el tipo de pieza <strong>"${piezaTipo.nombre}"</strong>?`
    );

    const dialogRef = this.dialog.open(GenericModalComponent, {
      width: '450px',
      data: {
        title: 'Confirmar Eliminación',
        message: message,
        showConfirmButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        type: 'warning'
      }
    });

    const sub = dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deletePiezaTipo(piezaTipo.id);
      }
    });
    this.subscriptions.add(sub);
  }

  private deletePiezaTipo(id: number): void {
    const sub = this.abmPiezaTipoService.deletePiezaTipo(id).subscribe({
      next: () => {
        this.openSnackBar(true, 'Tipo de pieza eliminado correctamente.', 'green');
        this.loadPiezaTipos();
      },
      error: (err) => {
        if (err.status === 409) {
          const errorData: IErrorResponse = err.error;
          this.openSnackBar(false, errorData.data);
        } else {
          console.error('Error al eliminar:', err);
          this.openSnackBar(false, 'Ocurrió un error al intentar eliminar el elemento.');
        }
      }
    });
    this.subscriptions.add(sub);
  }

  private openSnackBar(option: boolean, message?: string, css?: string, duration?: number): void {
    const defaultMessage: string = option ? 'Cambios realizados.' : 'No se pudieron realizar los cambios.';
    const defaultCss: string = css ? css : 'red';
    const snackBarMessage = message ? message : defaultMessage;
    const snackBarCss = css ? css : defaultCss;
    const snackBarDuration = duration ? duration : 5000;

    this.snackBar.open(snackBarMessage, 'X', {
      duration: snackBarDuration,
      panelClass: `${snackBarCss}-snackbar`,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}