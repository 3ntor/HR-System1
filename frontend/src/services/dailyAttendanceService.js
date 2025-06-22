import api from './api';

class DailyAttendanceService {
  // جلب سجل التأخيرات الشهري
  async getMonthlyAttendance(employeeId, year, month) {
    try {
      const response = await api.get(`/daily-attendance/monthly/${employeeId}/${year}/${month}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في جلب سجل التأخيرات الشهري:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في جلب البيانات'
      };
    }
  }

  // تحديث سجل حضور يوم واحد
  async updateDailyRecord(recordId, data) {
    try {
      const response = await api.put(`/daily-attendance/update/${recordId}`, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في تحديث سجل الحضور:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في تحديث السجل'
      };
    }
  }

  // تحديث عدة سجلات دفعة واحدة
  async bulkUpdateRecords(records) {
    try {
      const response = await api.put('/daily-attendance/bulk-update', { records });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في تحديث السجلات:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في تحديث السجلات'
      };
    }
  }

  // إعادة توليد بيانات الشهر بالكامل
  async regenerateMonthlyData(employeeId, year, month) {
    try {
      const response = await api.post(`/daily-attendance/regenerate/${employeeId}/${year}/${month}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في إعادة توليد البيانات:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في إعادة توليد البيانات'
      };
    }
  }

  // إعادة تعيين النظام من تاريخ اليوم
  async resetFromToday(employeeId) {
    try {
      const response = await api.post(`/daily-attendance/reset-from-today/${employeeId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في إعادة تعيين النظام:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في إعادة تعيين النظام'
      };
    }
  }



  // تحديث جميع سجلات الشهر من بيانات التطبيق
  async syncMonth(employeeId) {
    try {
      const response = await api.post(`/daily-attendance/sync-month/${employeeId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('خطأ في تحديث سجلات الشهر:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطأ في تحديث سجلات الشهر'
      };
    }
  }
}

export default new DailyAttendanceService(); 