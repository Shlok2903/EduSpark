import api from './api';

const getDashboardData = async () => {
  try {
    const response = await api.get('/api/dashboard');
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch dashboard data');
    }
    return response;
  } catch (error) {
    console.error('Dashboard error:', error);
    throw new Error(error.formattedMessage || error.message || 'Failed to fetch dashboard data');
  }
};

export default {
  getDashboardData
}; 