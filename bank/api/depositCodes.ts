import { depositCodesApi } from ".";

export interface DepositCode {
  id: string;
  code: string;
  amount: number;
  type: 'get' | 'send';
  expiryDate: string;
  status: 'pending' | 'success' | 'failed' | 'expired' | 'cancelled';
  createdAt: string;
  userId?: string;
  recipientId?: string;
  usedBy?: string;
  usedAt?: string;
}

// Create a new deposit code
const createDepositCode = async (data: {
  userId: string;
  amount: number;
  type: 'get' | 'send';
  expiryDays: number;
  creatorToken?: string; // Required for "send" type codes
}) => {
  try {
    const { data: response } = await depositCodesApi.post('/api/deposit-codes', data);
    return response;
  } catch (error: any) {
    console.error('Error creating deposit code:', error);
    throw error;
  }
};

// Get all deposit codes for a user
const getDepositCodes = async (userId: string) => {
  try {
    const { data } = await depositCodesApi.get(`/api/deposit-codes?userId=${encodeURIComponent(userId)}`);
    return data;
  } catch (error: any) {
    console.error('Error getting deposit codes:', error);
    throw error;
  }
};

// Get a deposit code by code string
const getDepositCodeByCode = async (code: string) => {
  try {
    const { data } = await depositCodesApi.get(`/api/deposit-codes/${code}`);
    return data;
  } catch (error: any) {
    console.error('Error getting deposit code:', error);
    throw error;
  }
};

// Update deposit code status (e.g., cancel)
const updateDepositCode = async (codeId: string, status: DepositCode['status']) => {
  try {
    const { data } = await depositCodesApi.put(`/api/deposit-codes/${codeId}`, { status });
    return data;
  } catch (error: any) {
    console.error('Error updating deposit code:', error);
    throw error;
  }
};

// Use a deposit code (process payment)
const useDepositCode = async (code: string, userId: string, recipientUsername?: string) => {
  try {
    const { data } = await depositCodesApi.post(`/api/deposit-codes/${code}/use`, {
      userId,
      recipientUsername // For "send" type codes, this is the username of the person receiving money
    });
    return data;
  } catch (error: any) {
    console.error('Error using deposit code:', error);
    throw error;
  }
};

export {
  createDepositCode,
  getDepositCodes,
  getDepositCodeByCode,
  updateDepositCode,
  useDepositCode,
};

