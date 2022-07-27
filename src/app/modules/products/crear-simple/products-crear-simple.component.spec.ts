import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsCrearSimpleComponent } from './products-crear-simple.component';

describe('ProductsCrearSimpleComponent', () => {
  let component: ProductsCrearSimpleComponent;
  let fixture: ComponentFixture<ProductsCrearSimpleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsCrearSimpleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsCrearSimpleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
