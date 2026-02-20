import { BrokersController } from './brokers.controller';

describe('BrokersController', () => {
  const service = {
    createBroker: jest.fn(),
    updateBroker: jest.fn(),
    softDeleteBroker: jest.fn(),
  } as any;

  const controller = new BrokersController(service);

  beforeEach(() => jest.clearAllMocks());

  it('delegates broker create/update/delete actions', async () => {
    service.createBroker.mockResolvedValue({ ok: true });
    service.updateBroker.mockResolvedValue({ ok: true });
    service.softDeleteBroker.mockResolvedValue({ ok: true });

    await controller.createBroker('p1', '1.1', 2, {
      name: 'n',
      phone: '1',
      email: 'a@a.com',
      company: 'c',
    });
    await controller.updateBroker('p1', '1.1', 'b1', 2, {
      name: 'n',
      phone: '1',
      email: 'a@a.com',
      company: 'c',
    });
    await controller.softDeleteBroker('p1', '1.1', 'b1', 2);

    expect(service.createBroker).toHaveBeenCalledWith('p1', '1.1', 2, expect.any(Object));
    expect(service.updateBroker).toHaveBeenCalledWith('p1', '1.1', 'b1', 2, expect.any(Object));
    expect(service.softDeleteBroker).toHaveBeenCalledWith('p1', '1.1', 'b1', 2);
  });
});
