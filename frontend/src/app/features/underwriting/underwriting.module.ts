import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UnderwritingComponent } from './underwriting.component';

const routes: Routes = [{ path: '', component: UnderwritingComponent }];

@NgModule({
  declarations: [UnderwritingComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class UnderwritingModule {}
