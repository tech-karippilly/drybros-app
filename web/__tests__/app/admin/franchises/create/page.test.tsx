import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/__tests__/utils/test-utils';
import { mockPush } from '@/jest.setup';
import CreateFranchisePage from '@/app/admin/franchises/create/page';
import { franchiseService } from '@/services/franchiseService';
import { mockCreateFranchiseResponse } from '@/__tests__/mocks/franchiseMocks';
import { createMockAxiosResponse } from '@/__tests__/mocks/serviceMocks';

// Mock the franchise service
jest.mock('@/services/franchiseService', () => ({
  franchiseService: {
    createFranchise: jest.fn(),
  },
}));

describe('Create Franchise Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (franchiseService.createFranchise as jest.Mock).mockResolvedValue(
      createMockAxiosResponse(mockCreateFranchiseResponse)
    );
  });

  it('renders the create franchise page with header', () => {
    render(<CreateFranchisePage />);

    expect(screen.getByText('Create New Franchise')).toBeInTheDocument();
    expect(screen.getByText('Add a new franchise location to your network.')).toBeInTheDocument();
  });

  it('displays franchise information section', () => {
    render(<CreateFranchisePage />);

    expect(screen.getByText('Franchise Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/franchise code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/franchise name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/franchise email/i)).toBeInTheDocument();
  });

  it('displays manager information section', () => {
    render(<CreateFranchisePage />);

    expect(screen.getByText('Manager Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/manager name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/manager email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/manager phone/i)).toBeInTheDocument();
  });

  it('displays legal compliance section', () => {
    render(<CreateFranchisePage />);

    expect(screen.getByText('Legal Compliance')).toBeInTheDocument();
    expect(screen.getByLabelText(/legal documents have been collected/i)).toBeInTheDocument();
  });

  it('navigates back to franchises list', async () => {
    render(<CreateFranchisePage />);

    const backButton = screen.getByText('Back to Franchises');
    await userEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises');
  });

  it('shows validation errors for required fields', async () => {
    render(<CreateFranchisePage />);

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Franchise code is required')).toBeInTheDocument();
    });

    expect(screen.getByText('Franchise name is required')).toBeInTheDocument();
    expect(screen.getByText('City is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<CreateFranchisePage />);

    const emailInput = screen.getByLabelText(/franchise email/i);
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('validates manager email format', async () => {
    render(<CreateFranchisePage />);

    const managerEmailInput = screen.getAllByLabelText(/email/i)[1]; // Second email input (manager email)
    await userEvent.type(managerEmailInput, 'invalid-email');

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('successfully creates a franchise with valid data', async () => {
    render(<CreateFranchisePage />);

    // Fill in franchise information
    await userEvent.type(screen.getByLabelText(/franchise code/i), 'NF-001');
    await userEvent.type(screen.getByLabelText(/franchise name/i), 'New Franchise');
    await userEvent.type(screen.getByLabelText(/city/i), 'New York');
    await userEvent.type(screen.getByLabelText(/region/i), 'Northeast');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St, New York, NY 10001');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+1 555 123 4567');
    await userEvent.type(screen.getByLabelText(/franchise email/i), 'contact@newfranchise.com');

    // Fill in manager information
    await userEvent.type(screen.getByLabelText(/manager name/i), 'John Doe');
    await userEvent.type(screen.getAllByLabelText(/email/i)[1], 'john.doe@drybros.com');
    await userEvent.type(screen.getByLabelText(/manager phone/i), '+1 555 987 6543');

    // Check legal documents checkbox
    const checkbox = screen.getByLabelText(/legal documents have been collected/i);
    await userEvent.click(checkbox);

    // Submit form
    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(franchiseService.createFranchise).toHaveBeenCalledWith({
        code: 'NF-001',
        name: 'New Franchise',
        city: 'New York',
        region: 'Northeast',
        address: '123 Main St, New York, NY 10001',
        phone: '+1 555 123 4567',
        email: 'contact@newfranchise.com',
        inchargeName: 'John Doe',
        managerEmail: 'john.doe@drybros.com',
        managerPhone: '+1 555 987 6543',
        storeImage: '',
        legalDocumentsCollected: true,
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/admin/franchises');
  });

  it('clears validation error when field is edited', async () => {
    render(<CreateFranchisePage />);

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Franchise code is required')).toBeInTheDocument();
    });

    const codeInput = screen.getByLabelText(/franchise code/i);
    await userEvent.type(codeInput, 'NF-001');

    await waitFor(() => {
      expect(screen.queryByText('Franchise code is required')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (franchiseService.createFranchise as jest.Mock).mockRejectedValue(
      new Error('Failed to create')
    );

    render(<CreateFranchisePage />);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/franchise code/i), 'NF-001');
    await userEvent.type(screen.getByLabelText(/franchise name/i), 'New Franchise');
    await userEvent.type(screen.getByLabelText(/city/i), 'New York');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+1 555 123 4567');
    await userEvent.type(screen.getByLabelText(/franchise email/i), 'contact@test.com');
    await userEvent.type(screen.getByLabelText(/manager name/i), 'John Doe');
    await userEvent.type(screen.getAllByLabelText(/email/i)[1], 'john@test.com');
    await userEvent.type(screen.getByLabelText(/manager phone/i), '+1 555 987 6543');

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create franchise:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('disables submit button while submitting', async () => {
    (franchiseService.createFranchise as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<CreateFranchisePage />);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/franchise code/i), 'NF-001');
    await userEvent.type(screen.getByLabelText(/franchise name/i), 'New Franchise');
    await userEvent.type(screen.getByLabelText(/city/i), 'New York');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+1 555 123 4567');
    await userEvent.type(screen.getByLabelText(/franchise email/i), 'contact@test.com');
    await userEvent.type(screen.getByLabelText(/manager name/i), 'John Doe');
    await userEvent.type(screen.getAllByLabelText(/email/i)[1], 'john@test.com');
    await userEvent.type(screen.getByLabelText(/manager phone/i), '+1 555 987 6543');

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('allows optional fields to be empty', async () => {
    render(<CreateFranchisePage />);

    // Fill in only required fields
    await userEvent.type(screen.getByLabelText(/franchise code/i), 'NF-001');
    await userEvent.type(screen.getByLabelText(/franchise name/i), 'New Franchise');
    await userEvent.type(screen.getByLabelText(/city/i), 'New York');
    await userEvent.type(screen.getByLabelText(/address/i), '123 Main St');
    await userEvent.type(screen.getByLabelText(/phone number/i), '+1 555 123 4567');
    await userEvent.type(screen.getByLabelText(/franchise email/i), 'contact@test.com');
    await userEvent.type(screen.getByLabelText(/manager name/i), 'John Doe');
    await userEvent.type(screen.getAllByLabelText(/email/i)[1], 'john@test.com');
    await userEvent.type(screen.getByLabelText(/manager phone/i), '+1 555 987 6543');

    const submitButton = screen.getByText('Create Franchise');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(franchiseService.createFranchise).toHaveBeenCalled();
    });
  });
});
