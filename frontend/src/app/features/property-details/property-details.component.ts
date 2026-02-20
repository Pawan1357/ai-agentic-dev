import { Component } from '@angular/core';
import { Broker, PropertyDetails } from '../../core/models/property.model';
import { PropertyStoreService } from '../../core/state/property-store.service';
import { extractErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css'],
})
export class PropertyDetailsComponent {
  actionError = '';
  private readonly brokerFieldErrors = new Map<string, string>();
  private readonly numericPropertyFields = new Set<keyof PropertyDetails>([
    'lastTradePrice',
    'askingPrice',
    'bidAmount',
    'yearOneCapRate',
    'stabilizedCapRate',
    'vintage',
    'buildingSizeSf',
    'warehouseSf',
    'officeSf',
    'propertySizeAcres',
    'coverageRatio',
    'clearHeightFt',
    'dockDoors',
    'driveInDoors',
  ]);

  readonly leftInfoFields: Array<{ label: string; key: keyof PropertyDetails }> = [
    { label: 'Market', key: 'market' },
    { label: 'Sub Market', key: 'subMarket' },
    { label: 'Property Type', key: 'propertyType' },
    { label: 'Property Sub Type', key: 'propertySubType' },
    { label: 'Zoning', key: 'zoning' },
    { label: 'Zoning Details', key: 'zoningDetails' },
    { label: 'Listing Type', key: 'listingType' },
    { label: 'Business Plan', key: 'businessPlan' },
    { label: 'Seller Type', key: 'sellerType' },
    { label: 'Last Trade Date', key: 'lastTradeDate' },
  ];

  readonly listingFields: Array<{ label: string; key: keyof PropertyDetails }> = [
    { label: 'Asking Price', key: 'askingPrice' },
    { label: 'Bid Amount', key: 'bidAmount' },
    { label: 'Year 1 Cap Rate', key: 'yearOneCapRate' },
    { label: 'Stabilized Cap Rate', key: 'stabilizedCapRate' },
  ];

  readonly specsFields: Array<{ label: string; key: keyof PropertyDetails }> = [
    { label: 'Vintage', key: 'vintage' },
    { label: 'Building Size (SF)', key: 'buildingSizeSf' },
    { label: 'Warehouse (SF)', key: 'warehouseSf' },
    { label: 'Office (SF)', key: 'officeSf' },
    { label: 'Property Size (Acres)', key: 'propertySizeAcres' },
    { label: 'Coverage Ratio', key: 'coverageRatio' },
    { label: 'Outdoor Storage', key: 'outdoorStorage' },
    { label: 'Construction Type', key: 'constructionType' },
    { label: 'Clear Height (Ft)', key: 'clearHeightFt' },
    { label: 'Dock Doors', key: 'dockDoors' },
    { label: 'Drive-In Doors', key: 'driveInDoors' },
    { label: 'Heavy Power', key: 'heavyPower' },
    { label: 'Sprinkler Type', key: 'sprinklerType' },
  ];

  constructor(public readonly store: PropertyStoreService) {}

  onAddBroker() {
    this.actionError = '';
    if (!this.store.canAddBrokerOrTenant()) {
      return;
    }
    this.store.addBrokerDraft();
  }

  onDeleteBroker(brokerId: string) {
    this.actionError = '';
    this.store.deleteBroker(brokerId).subscribe({
      error: (error: unknown) => {
        this.actionError = extractErrorMessage(error);
      },
    });
  }

  onSaveBroker(brokerId: string) {
    this.actionError = '';
    this.store.saveBroker(brokerId).subscribe({
      error: (error: unknown) => {
        this.actionError = extractErrorMessage(error);
      },
    });
  }

  onBrokerFieldChange(broker: Broker, key: keyof Broker, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (key === 'phone') {
      if (!/^[0-9+\-()\s]*$/.test(value)) {
        return;
      }
      this.store.updateBrokerField(broker.id, key, value);
      return;
    }
    this.store.updateBrokerField(broker.id, key, value);
  }

  onBrokerFieldChangeWithIndex(broker: Broker, brokerIndex: number, key: keyof Broker, event: Event) {
    this.store.clearServerFieldErrors([`brokers.${brokerIndex}.${String(key)}`, `brokers.${String(key)}`]);
    this.clearBrokerFieldError(brokerIndex, key);
    this.onBrokerFieldChange(broker, key, event);

    if (key === 'email') {
      const value = (event.target as HTMLInputElement).value.trim();
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        this.setBrokerFieldError(brokerIndex, key, 'Enter a valid email address');
      }
    }
    if (key === 'phone') {
      const value = (event.target as HTMLInputElement).value.trim();
      if (value && !/^[0-9+\-()\s]+$/.test(value)) {
        this.setBrokerFieldError(brokerIndex, key, 'Enter a valid phone number');
      }
    }
  }

  onDetailFieldChange(key: keyof PropertyDetails, event: Event) {
    this.store.clearServerFieldErrors([`propertyDetails.${String(key)}`]);
    const value = (event.target as HTMLInputElement).value;
    if (this.numericPropertyFields.has(key)) {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        return;
      }
      this.store.updatePropertyDetailsField(key, parsed as PropertyDetails[typeof key]);
      return;
    }

    this.store.updatePropertyDetailsField(key, value as PropertyDetails[typeof key]);
  }

  getPropertyFieldError(key: keyof PropertyDetails): string | null {
    return this.store.getServerFieldError(`propertyDetails.${String(key)}`);
  }

  getBrokerFieldError(key: 'name' | 'phone' | 'email' | 'company'): string | null {
    return this.store.getServerFieldError(`brokers.${key}`);
  }

  getBrokerFieldErrorAtIndex(brokerIndex: number, key: 'name' | 'phone' | 'email' | 'company'): string | null {
    return (
      this.brokerFieldErrors.get(this.brokerErrorKey(brokerIndex, key)) ??
      this.store.getServerFieldError(`brokers.${brokerIndex}.${key}`) ??
      this.getBrokerFieldError(key)
    );
  }

  trackByBrokerId(_index: number, broker: Broker): string {
    return broker.id;
  }

  private brokerErrorKey(brokerIndex: number, key: keyof Broker): string {
    return `${brokerIndex}.${String(key)}`;
  }

  private setBrokerFieldError(brokerIndex: number, key: keyof Broker, message: string) {
    this.brokerFieldErrors.set(this.brokerErrorKey(brokerIndex, key), message);
  }

  private clearBrokerFieldError(brokerIndex: number, key: keyof Broker) {
    this.brokerFieldErrors.delete(this.brokerErrorKey(brokerIndex, key));
  }

  getFieldInputType(key: keyof PropertyDetails): 'text' | 'number' | 'date' {
    if (key === 'lastTradeDate') {
      return 'date';
    }
    return this.numericPropertyFields.has(key) ? 'number' : 'text';
  }
}
