import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingChangesGuard } from './core/guards/pending-changes.guard';
import { ShellComponent } from './features/shell/shell.component';

const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    canDeactivate: [PendingChangesGuard],
    children: [
      {
        path: 'property-details',
        loadChildren: () => import('./features/property-details/property-details.module').then((m) => m.PropertyDetailsModule),
      },
      {
        path: 'underwriting',
        loadChildren: () => import('./features/underwriting/underwriting.module').then((m) => m.UnderwritingModule),
      },
      { path: '', pathMatch: 'full', redirectTo: 'property-details' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
