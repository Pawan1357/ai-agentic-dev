export interface Broker {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
