const API_BASE_URL = 'http://localhost:5001/api';

const authService = {
  login: async (credentials) => {
    try {
      console.log('🔐 محاولة تسجيل دخول:', credentials);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login failed:', errorText);
        throw new Error(`فشل في تسجيل الدخول: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Login successful:', data);
      
      if (data.success && data.data && data.data.token) {
        // حفظ التوكن والبيانات
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user || {
          username: credentials.username,
          role: 'admin'
        }));
        
        return data;
      } else {
        throw new Error('لم يتم إرجاع توكن صحيح');
      }
    } catch (error) {
      console.error('🚨 Auth service error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // لا نقوم بإعادة توجيه تلقائي - ندع الكود المستدعي يتولى ذلك
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // فحص انتهاء صلاحية التوكن (لكن لا نحذف البيانات تلقائياً)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        console.warn('🕐 Token expired - user should login again');
        // لا نحذف البيانات تلقائياً، ندع المستخدم يقرر
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      // لا نحذف البيانات تلقائياً في حالة أخطاء التحليل
      return false;
    }
  }
};

export default authService; 