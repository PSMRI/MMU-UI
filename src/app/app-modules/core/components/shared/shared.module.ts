import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { MaterialModule } from '../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AppHeaderComponent, AppFooterComponent],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  exports: [AppHeaderComponent, AppFooterComponent],
})
export class SharedModule {}
