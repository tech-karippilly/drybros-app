import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/utils/test-utils';
import { mockPush } from '@/jest.setup';
import EditFranchisePage from '@/app/admin/franchises/[id]/edit/page';
import { franchiseService } from '@/services/franchiseService';
import { mockFranchiseResponse, mockUpdateFranchiseResponse } from '@/__tests__/mocks/franchiseMocks';
import { createMockAxiosResponse } from '@/__tests__/mocks/serviceMocks';

// Mock the franchise service
jest.mock('@/services/franchiseService', () => ({
  franchiseService: {
    getFranchiseById: jest.fn(),
    updateFranchise: jest.fn(),
  },
}));

describe('Edit Franchise Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (franchiseService.getFranchiseById as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockFranchiseResponse)
    );
    (franchiseService.updateFranchise as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockUpdateFranchiseResponse)
    );
  });

  it('renders the edit franchise page with header', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Franchise')).toBeInTheDocument();
    });

    expect(screen.getByText(/Update franchise information for/)).toBeInTheDocument();
  });

  it('loads and displays franchise data', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(franchiseService.getFranchiseById).toHaveBeenCalledWith('1');
    });

    const nameInput = screen.getByLabelText(/franchise name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('London Prime');

    const cityInput = screen.getByLabelText(/city/i) as HTMLInputElement;
    expect(cityInput.value).toBe('London');

    const emailInput = screen.getByLabelText(/franchise email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('london.prime@drybros.com');
  });

  it('displays franchise information section', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Franchise Information')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/franchise email/i)).toBeInTheDocument();
  });

  it('displays manager information section', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Manager Information')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/manager name/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/email/i)[1]).toBeInTheDocument();
    expect(screen.getByLabelText(/manager phone/i)).toBeInTheDocument();
  });

  it('displays legal compliance section', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Legal Compliance')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/legal documents have been collected/i)).toBeInTheDocument();
  });

  it('navigates back to franchise detail', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Back to Franchise Details')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Franchise Details');
    await userEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises/1');
  });

  it('shows validation errors for required fields', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    });

    // Clear required fields
    const nameInput = screen.getByLabelText(/franchise name/i);
    await userEvent.clear(nameInput);

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Franchise name is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/franchise email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('successfully updates franchise with valid data', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    });

    // Update franchise name
    const nameInput = screen.getByLabelText(/franchise name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Franchise Name');

    // Submit form
    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(franchiseService.updateFranchise).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Franchise Name',
        })
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises/1');
  });

  it('clears validation error when field is edited', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/franchise name/i);
    await userEvent.clear(nameInput);

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Franchise name is required')).toBeInTheDocument();
    });

    await userEvent.type(nameInput, 'New Name');

    await waitFor(() => {
      expect(screen.queryByText('Franchise name is required')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (franchiseService.updateFranchise as jest.Mock).mockRejectedValue(
      new Error('Failed to update')
    );

    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update franchise:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('disables submit button while submitting', async () => {
    (franchiseService.updateFranchise as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('displays loading state while fetching data', () => {
    (franchiseService.getFranchiseById as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<EditFranchisePage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('updates manager information', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/manager name/i)).toBeInTheDocument();
    });

    const managerNameInput = screen.getByLabelText(/manager name/i);
    await userEvent.clear(managerNameInput);
    await userEvent.type(managerNameInput, 'New Manager');

    const managerEmailInput = screen.getAllByLabelText(/email/i)[1];
    await userEvent.clear(managerEmailInput);
    await userEvent.type(managerEmailInput, 'new.manager@drybros.com');

    const managerPhoneInput = screen.getByLabelText(/manager phone/i);
    await userEvent.clear(managerPhoneInput);
    await userEvent.type(managerPhoneInput, '+44 20 9999 8888');

    const submitButton = screen.getByText('Save Changes');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(franchiseService.updateFranchise).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          inchargeName: 'New Manager',
          managerEmail: 'new.manager@drybros.com',
          managerPhone: '+44 20 9999 8888',
        })
      );
    });
  });

  it('toggles legal documents checkbox', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/legal documents have been collected/i)).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/legal documents have been collected/i) as HTMLInputElement;
    
    // Initially should be checked based on mock data
    expect(checkbox.checked).toBe(true);

    await userEvent.click(checkbox);

    expect(checkbox.checked).toBe(false);
  });

  it('cancels edit and navigates back', async () => {
    render(<EditFranchisePage />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises/1');
  });
});
