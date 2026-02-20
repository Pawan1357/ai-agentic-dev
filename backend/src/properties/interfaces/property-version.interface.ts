export interface PropertyVersionProjection {
  propertyId: string;
  version: string;
  revision: number;
  isLatest: boolean;
  isHistorical: boolean;
}
