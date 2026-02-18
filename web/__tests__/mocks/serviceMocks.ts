// Mock franchise service
export const mockFranchiseService = {
  getFranchises: jest.fn(),
  getFranchiseById: jest.fn(),
  getMyFranchise: jest.fn(),
  createFranchise: jest.fn(),
  updateFranchise: jest.fn(),
  updateFranchiseStatus: jest.fn(),
  deleteFranchise: jest.fn(),
};

// Mock axios response helper
export const createMockAxiosResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
});

// Reset all mocks
export const resetAllMocks = () => {
  mockFranchiseService.getFranchises.mockReset();
  mockFranchiseService.getFranchiseById.mockReset();
  mockFranchiseService.getMyFranchise.mockReset();
  mockFranchiseService.createFranchise.mockReset();
  mockFranchiseService.updateFranchise.mockReset();
  mockFranchiseService.updateFranchiseStatus.mockReset();
  mockFranchiseService.deleteFranchise.mockReset();
};
