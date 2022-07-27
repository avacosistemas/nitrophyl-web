import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsGrillaComponent } from './products-grilla.component';

describe('ProductsGrillaComponent', () => {
  let component: ProductsGrillaComponent;
  let fixture: ComponentFixture<ProductsGrillaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductsGrillaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductsGrillaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
