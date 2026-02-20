import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { PropertyStoreService } from '../state/property-store.service';

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard implements CanDeactivate<unknown> {
  constructor(private readonly store: PropertyStoreService) {}

  canDeactivate(): boolean {
    if (!this.store.hasUnsavedChanges()) {
      return true;
    }
    return window.confirm('You have unsaved changes. Leave without saving?');
  }
}
