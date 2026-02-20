import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PropertyDetailsComponent } from './property-details.component';

const routes: Routes = [{ path: '', component: PropertyDetailsComponent }];

@NgModule({
  declarations: [PropertyDetailsComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PropertyDetailsModule {}
