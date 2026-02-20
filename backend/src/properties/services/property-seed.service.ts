import { Injectable, OnModuleInit } from '@nestjs/common';
import { BrokerRepository } from '../../brokers/repositories/broker.repository';
import { TenantRepository } from '../../tenants/repositories/tenant.repository';
import { PropertyRepository } from '../repositories/property.repository';

@Injectable()
export class PropertySeedService implements OnModuleInit {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly brokerRepository: BrokerRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async onModuleInit() {
    const existing = await this.propertyRepository.findOne('property-1', '1.1');
    if (existing) {
      return;
    }

    const created = await this.propertyRepository.create({
      propertyId: 'property-1',
      version: '1.1',
      isLatest: true,
      isHistorical: false,
      revision: 0,
      updatedBy: 'mock.user@assessment.local',
      propertyDetails: {
        address: '504 N Ashe Ave 504 N Ashe Ave, Dunn, NC 28334',
        market: 'Charlotte',
        subMarket: 'Southwest Charlotte',
        propertyType: 'Industrial',
        propertySubType: 'Multi Tenant',
        zoning: 'Light Industrial',
        zoningDetails: 'M-1',
        listingType: 'Broker Listed',
        businessPlan: 'Light Value Add',
        sellerType: 'Unsophisticated | Private Investor',
        lastTradePrice: 349583,
        lastTradeDate: '2025-02-09',
        askingPrice: 1250000,
        bidAmount: 1515000,
        yearOneCapRate: 5.8,
        stabilizedCapRate: 6.2,
        vintage: 1989,
        buildingSizeSf: 90012,
        warehouseSf: 24512,
        officeSf: 13562,
        propertySizeAcres: 34,
        coverageRatio: 20,
        outdoorStorage: 'Yes',
        constructionType: 'Hybrid',
        clearHeightFt: 32,
        dockDoors: 12,
        driveInDoors: 2,
        heavyPower: 'Yes',
        sprinklerType: 'Wet',
      },
      underwritingInputs: {
        listPrice: 0,
        bid: 0,
        gpEquityStack: 0,
        lpEquityStack: 0,
        acqFee: 10,
        amFee: 0,
        promote: 6,
        prefHurdle: 30,
        propMgmtFee: 0,
        estStartDate: '2020-10-25',
        holdPeriodYears: 5,
        closingCostsPct: 5,
        saleCostsPct: 0,
        vacancyPct: 0,
        annualCapexReservesPct: 0,
        annualAdminExpPct: 0,
        expenseInflationPct: 0,
        exitCapRate: 0,
      },
    });

    await this.brokerRepository.replaceByPropertyVersionId(created._id, 'property-1', '1.1', [
      {
        id: 'broker-1',
        name: 'Ashay Kandylia',
        phone: '+1 (555) 867-5309',
        email: 'example@company.com',
        company: 'Agile Infoways',
        isDeleted: false,
      },
    ] as any);

    await this.tenantRepository.replaceByPropertyVersionId(created._id, 'property-1', '1.1', [
      {
        id: 'tenant-1',
        tenantName: 'Grandma\'s Pizza',
        creditType: 'National',
        squareFeet: 12000,
        rentPsf: 18,
        annualEscalations: 5,
        leaseStart: '2025-10-25',
        leaseEnd: '2030-12-31',
        leaseType: 'NNN',
        renew: 'Yes',
        downtimeMonths: 2,
        tiPsf: 7,
        lcPsf: 2.5,
        isVacant: false,
        isDeleted: false,
      },
      {
        id: 'vacant-row',
        tenantName: 'VACANT',
        creditType: 'N/A',
        squareFeet: 78012,
        rentPsf: 0,
        annualEscalations: 0,
        leaseStart: '2025-10-25',
        leaseEnd: '2030-12-31',
        leaseType: 'N/A',
        renew: 'N/A',
        downtimeMonths: 0,
        tiPsf: 0,
        lcPsf: 0,
        isVacant: true,
        isDeleted: false,
      },
    ] as any);
  }
}
