import { PendingChangesGuard } from './pending-changes.guard';

describe('PendingChangesGuard', () => {
  it('allows when store is clean', () => {
    const guard = new PendingChangesGuard({ hasUnsavedChanges: () => false } as any);
    expect(guard.canDeactivate()).toBeTrue();
  });

  it('prompts when dirty and user confirms', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const guard = new PendingChangesGuard({ hasUnsavedChanges: () => true } as any);
    expect(guard.canDeactivate()).toBeTrue();
    expect(window.confirm).toHaveBeenCalled();
  });

  it('blocks when dirty and user declines', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const guard = new PendingChangesGuard({ hasUnsavedChanges: () => true } as any);
    expect(guard.canDeactivate()).toBeFalse();
  });
});
