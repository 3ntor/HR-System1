import api from './api';

export const attendanceService = {
  // Get today's attendance status
  getTodayStatus: async () => {
    try {
      const response = await api.get('/attendance/employee/me/today');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get attendance records for a specific period
  getAttendanceRecords: async (startDate, endDate, status) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;

      const response = await api.get('/attendance/employee/me', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check in
  checkIn: async (location, device) => {
    try {
      const response = await api.post('/attendance/check-in', {
        location,
        device
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Check out
  checkOut: async (location, device) => {
    try {
      const response = await api.post('/attendance/check-out', {
        location,
        device
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get attendance statistics (for managers/admins)
  getAttendanceStats: async (startDate, endDate, department) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (department) params.department = department;

      const response = await api.get('/attendance/stats', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 