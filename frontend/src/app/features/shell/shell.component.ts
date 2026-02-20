import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { AuditChange, AuditLogEntry } from '../../core/models/property.model';
import { PropertyStoreService } from '../../core/state/property-store.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css'],
})
export class ShellComponent implements OnInit, OnDestroy {
  errorMessage = '';
  successMessage = '';
  validationErrors: string[] = [];
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private errorTimer: ReturnType<typeof setTimeout> | null = null;
  private validationTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(public readonly store: PropertyStoreService) {}

  ngOnInit(): void {
    this.store
      .loadVersions()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((versions) => {
          const selected = versions.find((item) => !item.isHistorical)?.version ?? versions[0]?.version ?? '1.1';
          return this.store.loadVersion(selected);
        }),
      )
      .subscribe({
      error: (error: unknown) => {
        this.store.setServerErrors(error);
        this.errorMessage = extractErrorMessage(error);
        this.successMessage = '';
      },
    });

    this.store.validationErrors$.pipe(takeUntil(this.destroy$)).subscribe((errors) => {
      this.validationErrors = errors;
      if (this.validationTimer) {
        clearTimeout(this.validationTimer);
        this.validationTimer = null;
      }
      if (errors.length > 0) {
        this.validationTimer = setTimeout(() => {
          this.validationErrors = [];
          this.validationTimer = null;
        }, 4500);
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.store.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
    if (this.validationTimer) {
      clearTimeout(this.validationTimer);
      this.validationTimer = null;
    }
  }

  onVersionChange(version: string, event?: Event) {
    if (!version) {
      return;
    }

    if (this.store.hasUnsavedChanges() && !window.confirm('You have unsaved changes. Switch version anyway?')) {
      const currentVersion = this.store.getCurrentVersion();
      if (event && currentVersion) {
        (event.target as HTMLSelectElement).value = currentVersion;
      }
      return;
    }

    this.store.loadVersion(version).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = '';
      },
      error: (error: unknown) => {
        this.store.setServerErrors(error);
        this.setErrorMessage(extractErrorMessage(error), this.store.hasServerFieldErrors());
        this.successMessage = '';
      },
    });
  }

  onSave() {
    try {
      this.store.saveCurrent().subscribe({
        next: (result) => {
          this.errorMessage = '';
          this.setSuccessMessage(result.message);
        },
        error: (error: unknown) => {
          this.store.setServerErrors(error);
          if (this.validationErrors.length > 0) {
            this.errorMessage = '';
            this.successMessage = '';
            return;
          }
          this.setErrorMessage(extractErrorMessage(error), this.store.hasServerFieldErrors());
          this.successMessage = '';
        },
      });
    } catch (error) {
      if (this.validationErrors.length > 0) {
        this.errorMessage = '';
        this.successMessage = '';
        return;
      }
      this.setErrorMessage(extractErrorMessage(error), this.store.hasServerFieldErrors());
      this.successMessage = '';
    }
  }

  onSaveAs() {
    try {
      this.store.saveAsNextVersion().subscribe({
        next: (result) => {
          this.errorMessage = '';
          this.setSuccessMessage(result.message);
        },
        error: (error: unknown) => {
          this.store.setServerErrors(error);
          if (this.validationErrors.length > 0) {
            this.errorMessage = '';
            this.successMessage = '';
            return;
          }
          this.setErrorMessage(extractErrorMessage(error), this.store.hasServerFieldErrors());
          this.successMessage = '';
        },
      });
    } catch (error) {
      if (this.validationErrors.length > 0) {
        this.errorMessage = '';
        this.successMessage = '';
        return;
      }
      this.setErrorMessage(extractErrorMessage(error), this.store.hasServerFieldErrors());
      this.successMessage = '';
    }
  }

  private setSuccessMessage(message: string) {
    this.successMessage = message;
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
    this.successTimer = setTimeout(() => {
      this.successMessage = '';
      this.successTimer = null;
    }, 3500);
  }

  private setErrorMessage(message: string, _isFieldError: boolean) {
    this.errorMessage = message;
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
      this.errorTimer = null;
    }
    this.errorTimer = setTimeout(() => {
      this.errorMessage = '';
      this.errorTimer = null;
    }, 4500);
  }

  formatAuditChange(change: AuditChange): string {
    const oldValue = this.stringifyAuditValue(change.oldValue);
    const newValue = this.stringifyAuditValue(change.newValue);
    return `${change.field}: ${oldValue} -> ${newValue}`;
  }

  trackByAuditLog(_index: number, item: AuditLogEntry): string {
    return `${item.version}-${item.revision}-${item.createdAt}`;
  }

  private stringifyAuditValue(value: unknown): string {
    if (value === null || typeof value === 'undefined') {
      return 'null';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
}
