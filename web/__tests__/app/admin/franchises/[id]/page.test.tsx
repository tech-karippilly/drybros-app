import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/utils/test-utils';
import { mockPush } from '@/jest.setup';
import FranchiseDetailPage from '@/app/admin/franchises/[id]/page';
import { franchiseService } from '@/services/franchiseService';
import { mockFranchiseResponse, mockUpdateFranchiseResponse, mockUpdateStatusResponse } from '@/__tests__/mocks/franchiseMocks';
import { createMockAxiosResponse } from '@/__tests__/mocks/serviceMocks';

// Mock the franchise service
jest.mock('@/services/franchiseService', () => ({
  franchiseService: {
    getFranchiseById: jest.fn(),
    updateFranchise: jest.fn(),
    updateFranchiseStatus: jest.fn(),
  },
}));

describe('Franchise Detail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (franchiseService.getFranchiseById as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockFranchiseResponse)
    );
  });

  it('renders the franchise detail page with header', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('London Prime')).toBeInTheDocument();
    });
  });

  it('displays franchise code', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('LP')).toBeInTheDocument();
    });
  });

  it('displays status badge', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('displays driver count', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('152')).toBeInTheDocument();
    });
  });

  it('displays staff count', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('28')).toBeInTheDocument();
    });
  });

  it('displays monthly revenue', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('$124,500')).toBeInTheDocument();
    });
  });

  it('displays document status as complete when collected', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  it('displays address', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('123 Mayfair Street, London, UK')).toBeInTheDocument();
    });
  });

  it('displays contact information section', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    expect(screen.getByText('+44 20 7123 4567')).toBeInTheDocument();
    expect(screen.getByText('london.prime@drybros.com')).toBeInTheDocument();
    expect(screen.getByText('Mayfair, London, United Kingdom')).toBeInTheDocument();
  });

  it('displays manager details section', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Manager Details')).toBeInTheDocument();
    });

    expect(screen.getByText('James Carter')).toBeInTheDocument();
    expect(screen.getByText('james.carter@drybros.com')).toBeInTheDocument();
    expect(screen.getByText('+44 20 7123 4568')).toBeInTheDocument();
  });

  it('navigates back to franchises list', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Franchises')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Franchises');
    await userEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises');
  });

  it('navigates to edit page', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Franchise')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Edit Franchise');
    await userEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises/1/edit');
  });

  it('opens update status modal', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });

    const updateStatusButton = screen.getByText('Update Status');
    await userEvent.click(updateStatusButton);

    expect(screen.getByText('Update Franchise Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Temporarily Closed')).toBeInTheDocument();
  });

  it('updates franchise status', async () => {
    (franchiseService.updateFranchiseStatus as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockUpdateStatusResponse)
    );

    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });

    const updateStatusButton = screen.getByText('Update Status');
    await userEvent.click(updateStatusButton);

    const blockedOption = screen.getByText('Blocked');
    await userEvent.click(blockedOption);

    const confirmButton = screen.getByText('Update Status');
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(franchiseService.updateFranchiseStatus).toHaveBeenCalledWith('1', { status: 'BLOCKED' });
    });
  });

  it('opens change manager modal', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Change Manager')).toBeInTheDocument();
    });

    const changeManagerButton = screen.getAllByText('Change Manager')[0];
    await userEvent.click(changeManagerButton);

    expect(screen.getByText('Manager Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
  });

  it('updates manager information', async () => {
    (franchiseService.updateFranchise as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockUpdateFranchiseResponse)
    );

    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Change Manager')).toBeInTheDocument();
    });

    const changeManagerButton = screen.getAllByText('Change Manager')[0];
    await userEvent.click(changeManagerButton);

    const nameInput = screen.getByPlaceholderText('Enter manager name');
    const emailInput = screen.getByPlaceholderText('Enter email address');
    const phoneInput = screen.getByPlaceholderText('Enter phone number');

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Manager');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.manager@drybros.com');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '+44 20 9999 8888');

    const updateButton = screen.getByText('Update Manager');
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(franchiseService.updateFranchise).toHaveBeenCalledWith('1', {
        inchargeName: 'New Manager',
        managerEmail: 'new.manager@drybros.com',
        managerPhone: '+44 20 9999 8888',
      });
    });
  });

  it('displays franchise image when available', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      const img = document.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });
  });

  it('displays created date', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Created Date')).toBeInTheDocument();
    });

    expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
  });

  it('displays franchise ID', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Franchise ID')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays loading state', async () => {
    (franchiseService.getFranchiseById as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<FranchiseDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (franchiseService.getFranchiseById as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch franchise:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('closes modals when clicking cancel', async () => {
    render(<FranchiseDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument();
    });

    const updateStatusButton = screen.getByText('Update Status');
    await userEvent.click(updateStatusButton);

    expect(screen.getByText('Update Franchise Status')).toBeInTheDocument();

    const cancelButton = screen.getAllByText('Cancel')[0];
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Update Franchise Status')).not.toBeInTheDocument();
    });
  });
});
