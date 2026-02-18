import { Franchise, FranchiseListResponse, FranchiseResponse } from '@/lib/types/franchise';

export const mockFranchises: Franchise[] = [
  {
    id: '1',
    name: 'London Prime',
    code: 'LP',
    city: 'London',
    region: 'Mayfair, London, United Kingdom',
    address: '123 Mayfair Street, London, UK',
    phone: '+44 20 7123 4567',
    email: 'london.prime@drybros.com',
    inchargeName: 'James Carter',
    managerEmail: 'james.carter@drybros.com',
    managerPhone: '+44 20 7123 4568',
    status: 'ACTIVE',
    driverCount: 152,
    staffCount: 28,
    monthlyRevenue: 124500,
    legalDocumentsCollected: true,
    storeImage: 'https://example.com/image1.jpg',
    createdAt: '2023-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Manhattan Executive',
    code: 'ME',
    city: 'New York',
    region: 'Manhattan, NY, United States',
    address: '456 Park Avenue, New York, NY 10022',
    phone: '+1 212 555 0123',
    email: 'manhattan.exec@drybros.com',
    inchargeName: 'Sarah Williams',
    managerEmail: 'sarah.williams@drybros.com',
    managerPhone: '+1 212 555 0124',
    status: 'BLOCKED',
    driverCount: 98,
    staffCount: 20,
    monthlyRevenue: 98200,
    legalDocumentsCollected: true,
    createdAt: '2023-02-20T14:00:00Z',
  },
  {
    id: '3',
    name: 'Dubai Oasis',
    code: 'DO',
    city: 'Dubai',
    region: 'Downtown Dubai, United Arab Emirates',
    address: '789 Sheikh Zayed Road, Dubai, UAE',
    phone: '+971 4 123 4567',
    email: 'dubai.oasis@drybros.com',
    inchargeName: 'Omar Farooq',
    managerEmail: 'omar.farooq@drybros.com',
    managerPhone: '+971 4 123 4568',
    status: 'TEMPORARILY_CLOSED',
    driverCount: 210,
    staffCount: 35,
    monthlyRevenue: 82100,
    legalDocumentsCollected: false,
    createdAt: '2023-03-10T09:00:00Z',
  },
];

export const mockFranchiseListResponse: FranchiseListResponse = {
  success: true,
  message: 'Franchises retrieved successfully',
  data: {
    franchises: mockFranchises,
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
    },
  },
};

export const mockFranchiseResponse: FranchiseResponse = {
  success: true,
  message: 'Franchise retrieved successfully',
  data: mockFranchises[0],
};

export const mockCreateFranchiseResponse: FranchiseResponse = {
  success: true,
  message: 'Franchise created successfully',
  data: {
    ...mockFranchises[0],
    id: '4',
    name: 'New Franchise',
    code: 'NF',
  },
};

export const mockUpdateFranchiseResponse: FranchiseResponse = {
  success: true,
  message: 'Franchise updated successfully',
  data: {
    ...mockFranchises[0],
    name: 'Updated Franchise Name',
  },
};

export const mockUpdateStatusResponse = {
  success: true,
  message: 'Franchise status updated successfully',
};
