/**
 * Customers API – GET /customers, GET /customers/:id
 */
import api from '../../axios';

export interface CustomerResponse {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  city: string | null;
  notes: string | null;
  franchiseId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getCustomers(): Promise<CustomerResponse[]> {
  const res = await api.get<{ data: CustomerResponse[] }>('/customers');
  return res.data.data;
}

export async function getCustomerById(id: number): Promise<CustomerResponse> {
  const res = await api.get<{ data: CustomerResponse }>(`/customers/${id}`);
  return res.data.data;
}
