import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsCrearCompuestaComponent } from './products-crear-compuesta.component';

describe('ProductsCrearCompuestaComponent', () => {
  let component: ProductsCrearCompuestaComponent;
  let fixture: ComponentFixture<ProductsCrearCompuestaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsCrearCompuestaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsCrearCompuestaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
