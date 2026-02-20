import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Broker, PropertyVersion, Tenant } from '../models/property.model';
import { environment } from '../../../environments/environment';

export interface ApiMutationResult<T> {
  data: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PropertyApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/properties`;

  constructor(private readonly http: HttpClient) {}

  getVersions(
    propertyId: string,
  ): Observable<
    Array<{ version: string; revision: number; isHistorical: boolean }>
  > {
    return this.http
      .get<
        ApiSuccessResponse<
          Array<{ version: string; revision: number; isHistorical: boolean }>
        >
      >(`${this.baseUrl}/${propertyId}/versions`)
      .pipe(map((response) => response.data));
  }

  getVersion(propertyId: string, version: string): Observable<PropertyVersion> {
    return this.http
      .get<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}`)
      .pipe(map((response) => response.data));
  }

  saveVersion(
    propertyId: string,
    version: string,
    payload: unknown,
  ): Observable<ApiMutationResult<PropertyVersion>> {
    return this.http
      .put<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}`, payload)
      .pipe(map((response) => ({ data: response.data, message: response.message })));
  }

  saveAs(
    propertyId: string,
    version: string,
    payload: {
      expectedRevision: number;
      propertyDetails?: PropertyVersion['propertyDetails'];
      underwritingInputs?: PropertyVersion['underwritingInputs'];
      brokers?: PropertyVersion['brokers'];
      tenants?: PropertyVersion['tenants'];
    },
  ): Observable<ApiMutationResult<PropertyVersion>> {
    return this.http
      .post<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/save-as`, payload)
      .pipe(map((response) => ({ data: response.data, message: response.message })));
  }

  createBroker(
    propertyId: string,
    version: string,
    expectedRevision: number,
    payload: Omit<Broker, 'id' | 'isDeleted'>,
  ): Observable<PropertyVersion> {
    return this.http
      .post<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/brokers?expectedRevision=${expectedRevision}`, payload)
      .pipe(map((response) => response.data));
  }

  updateBroker(
    propertyId: string,
    version: string,
    brokerId: string,
    expectedRevision: number,
    payload: Omit<Broker, 'id' | 'isDeleted'>,
  ): Observable<PropertyVersion> {
    return this.http
      .put<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/brokers/${brokerId}?expectedRevision=${expectedRevision}`, payload)
      .pipe(map((response) => response.data));
  }

  softDeleteBroker(
    propertyId: string,
    version: string,
    brokerId: string,
    expectedRevision: number,
  ): Observable<PropertyVersion> {
    return this.http
      .delete<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/brokers/${brokerId}?expectedRevision=${expectedRevision}`)
      .pipe(map((response) => response.data));
  }

  createTenant(
    propertyId: string,
    version: string,
    expectedRevision: number,
    payload: Omit<Tenant, 'id' | 'isVacant' | 'isDeleted'>,
  ): Observable<PropertyVersion> {
    return this.http
      .post<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/tenants?expectedRevision=${expectedRevision}`, payload)
      .pipe(map((response) => response.data));
  }

  updateTenant(
    propertyId: string,
    version: string,
    tenantId: string,
    expectedRevision: number,
    payload: Omit<Tenant, 'id' | 'isVacant' | 'isDeleted'>,
  ): Observable<PropertyVersion> {
    return this.http
      .put<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/tenants/${tenantId}?expectedRevision=${expectedRevision}`, payload)
      .pipe(map((response) => response.data));
  }

  softDeleteTenant(
    propertyId: string,
    version: string,
    tenantId: string,
    expectedRevision: number,
  ): Observable<PropertyVersion> {
    return this.http
      .delete<
        ApiSuccessResponse<PropertyVersion>
      >(`${this.baseUrl}/${propertyId}/versions/${version}/tenants/${tenantId}?expectedRevision=${expectedRevision}`)
      .pipe(map((response) => response.data));
  }
}
