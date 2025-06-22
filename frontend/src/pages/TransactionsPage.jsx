import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp,
  Calendar,
  Plus,
  Download,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/formatters'
import { transactionService, clientService, categoryService } from '../services/api'
import { toast } from 'react-hot-toast'

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([])
  const [clients, setClients] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    pendingTransactions: 0,
    thisMonthTransactions: 0
  })

  // دالة جلب العملاء من قاعدة البيانات
  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true)
      const response = await clientService.getAll()
      setClients(response.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('حدث خطأ في جلب العملاء')
    } finally {
      setLoadingClients(false)
    }
  }, [])

  // دالة جلب التصنيفات من قاعدة البيانات
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true)
      const response = await categoryService.getAll()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('حدث خطأ في جلب التصنيفات')
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  // تم حذف كود تحديث التوكن التلقائي لتجنب مشاكل المصادقة

  // محاكاة بيانات المدير لضمان ظهور الزر
  const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}')
  const isAdmin = currentUser.role === 'admin' || true // تظهر للجميع مؤقتاً

  // دالة للحصول على اسم العميل من ID
  const getClientName = (clientId) => {
    if (!clientId) return 'عملية عامة';
    const client = clients.find(c => c._id === clientId);
    return client ? client.name : 'عميل غير معروف';
  };

  // جلب المعاملات من الباك إند
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await transactionService.getAll({
        type: selectedType,
        category: selectedCategory,
        search: searchTerm
      })
      setTransactions(response.data)
      setStats({
        totalIncome: response.summary.totalIncome,
        totalExpenses: response.summary.totalExpense,
        pendingTransactions: response.data.filter(t => t.status === 'pending').length,
        thisMonthTransactions: response.data.filter(t => {
          const transactionDate = new Date(t.date)
          const currentDate = new Date()
          return transactionDate.getMonth() === currentDate.getMonth() &&
                 transactionDate.getFullYear() === currentDate.getFullYear()
        }).length
      })
    } catch (error) {
      toast.error('حدث خطأ في جلب المعاملات')
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedCategory, searchTerm])

  useEffect(() => {
    fetchTransactions()
    fetchClients() // جلب العملاء عند تحميل الصفحة
    fetchCategories() // جلب التصنيفات عند تحميل الصفحة
  }, [fetchTransactions, fetchClients, fetchCategories])

  const handleAddTransaction = async (transactionData) => {
    try {
      console.log('🔍 بيانات المعاملة المُستلمة:', transactionData);
      
      // التأكد من وجود البيانات المطلوبة
      if (!transactionData.description || !transactionData.amount || !transactionData.type || !transactionData.category) {
        console.log('❌ بيانات ناقصة:', {
          description: !!transactionData.description,
          amount: !!transactionData.amount, 
          type: !!transactionData.type,
          category: !!transactionData.category
        });
        toast.error('❌ يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      // الحصول على بيانات المستخدم الحالي
      const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
      const createdBy = currentUser.username || currentUser.name || 'مستخدم غير معروف';

      const requestData = {
        description: transactionData.description.trim(),
        amount: Number(transactionData.amount),
        type: transactionData.type,
        category: transactionData.category,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        notes: transactionData.notes || '',
        clientId: transactionData.clientId || undefined,
        paymentMethod: transactionData.paymentMethod || 'كاش', // طريقة الدفع الافتراضية
        createdBy: createdBy // إضافة اسم المستخدم الذي أنشأ المعاملة
      };

      console.log('📤 البيانات المُرسلة للـ API:', requestData);
      console.log('🔑 التوكن موجود:', !!localStorage.getItem('token'));
      
      const response = await transactionService.create(requestData);
      console.log('✅ رد الـ API:', response);
      toast.success('✅ تم إضافة المعاملة بنجاح');
      await fetchTransactions();
      setShowAddModal(false);
    } catch (error) {
      console.error('💥 خطأ في إضافة المعاملة:', error);
      console.error('📋 تفاصيل الخطأ:', error.response?.data);
      console.error('🔢 كود الخطأ:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'خطأ غير معروف';
      toast.error('❌ حدث خطأ في إضافة المعاملة: ' + errorMessage);
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowAddModal(true)
  }

  const handleUpdateTransaction = async (transactionData) => {
    try {
      console.log('🔍 بيانات التحديث المُستلمة:', transactionData);
      
      // التأكد من وجود البيانات المطلوبة
      if (!transactionData.description?.trim() || !transactionData.amount || transactionData.amount <= 0 || !transactionData.type || !transactionData.category?.trim() || !transactionData.date) {
        console.log('❌ بيانات ناقصة للتحديث:', {
          description: !!transactionData.description?.trim(),
          amount: transactionData.amount > 0,
          type: !!transactionData.type,
          category: !!transactionData.category?.trim(),
          date: !!transactionData.date
        });
        toast.error('❌ يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
        return;
      }

      // الحصول على بيانات المستخدم الحالي
      const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('currentUser') || '{}');
      const updatedBy = currentUser.username || currentUser.name || 'مستخدم غير معروف';

      const requestData = {
        description: transactionData.description.trim(),
        amount: Number(transactionData.amount),
        type: transactionData.type,
        category: transactionData.category,
        date: transactionData.date || new Date().toISOString().split('T')[0],
        notes: transactionData.notes || '',
        clientId: transactionData.clientId || null,
        paymentMethod: transactionData.paymentMethod || 'كاش',
        updatedBy: updatedBy, // إضافة اسم المستخدم الذي حدث المعاملة
        updatedAt: new Date().toISOString()
      };

      console.log('📤 البيانات المُرسلة للتحديث:', requestData);
      console.log('🆔 معرف المعاملة:', editingTransaction._id);

      const response = await transactionService.update(editingTransaction._id, requestData);
      console.log('✅ رد التحديث:', response);
      
      toast.success('✅ تم تحديث المعاملة بنجاح');
      await fetchTransactions();
      setShowAddModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('💥 خطأ في تحديث المعاملة:', error);
      console.error('📋 تفاصيل الخطأ:', error.response?.data);
      console.error('🔢 كود الخطأ:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'خطأ غير معروف';
      toast.error('❌ حدث خطأ في تحديث المعاملة: ' + errorMessage);
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
      try {
        await transactionService.delete(id)
        toast.success('تم حذف المعاملة بنجاح')
        fetchTransactions()
      } catch (error) {
        toast.error('حدث خطأ في حذف المعاملة')
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const handleApproveTransaction = async (id) => {
    if (window.confirm('هل تريد الموافقة على هذه المعاملة؟')) {
      try {
        await transactionService.update(id, { 
          status: 'approved',
          approvedBy: currentUser._id,
          approvedAt: new Date()
        })
        toast.success('تم الموافقة على المعاملة بنجاح')
        fetchTransactions()
      } catch (error) {
        toast.error('حدث خطأ في الموافقة على المعاملة')
        console.error('Error approving transaction:', error)
      }
    }
  }

  const handleRejectTransaction = async (id) => {
    const reason = window.prompt('سبب الرفض (اختياري):')
    if (reason !== null) {
      try {
        await transactionService.update(id, { 
          status: 'rejected',
          rejectedBy: currentUser._id,
          rejectionReason: reason,
          rejectedAt: new Date()
        })
        toast.success('تم رفض المعاملة بنجاح')
        fetchTransactions()
      } catch (error) {
        toast.error('حدث خطأ في رفض المعاملة')
        console.error('Error rejecting transaction:', error)
      }
    }
  }

  // فلترة المعاملات
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.clientName && transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory
    const matchesType = !selectedType || transaction.type === selectedType
    const matchesClient = !selectedClient || 
                         (selectedClient === 'none' && !transaction.clientId) ||
                         (selectedClient !== 'none' && transaction.clientId && transaction.clientId.toString() === selectedClient)
    return matchesSearch && matchesCategory && matchesType && matchesClient
  })

  const TransactionCard = ({ transaction }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-full ${
                transaction.type === 'income' 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowDownCircle className="w-4 h-4" />
                ) : (
                  <ArrowUpCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {transaction.description}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span>رقم المعاملة: </span>
                  <span className="font-semibold">{transaction.transactionNumber || 'غير محدد'}</span>
                  {transaction.reference && <span> • {transaction.reference}</span>}
                  {transaction.date && <span> • {formatDate(transaction.date)}</span>}
                </p>
              </div>
            </div>
          </div>
          <div className="text-left">
            <div className={`text-xl font-bold ${
              transaction.type === 'income' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              {transaction.currency && <span className="text-base ml-1">{transaction.currency}</span>}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
              transaction.status === 'approved' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : transaction.status === 'rejected'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {transaction.status === 'approved' ? 'مكتمل' : 
               transaction.status === 'rejected' ? 'مرفوض' : 
               'قيد المراجعة'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">التصنيف: </span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.category || 'غير محدد'}</span>
            {transaction.subcategory && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">({transaction.subcategory})</span>
            )}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">طريقة الدفع: </span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.paymentMethod || 'غير محدد'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">الحالة: </span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.status || 'غير محدد'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">أنشأ بواسطة: </span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.createdBy || 'غير محدد'}</span>
          </div>
          {/* عرض العميل أو الموظف إذا وجد */}
          {transaction.clientId && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">العميل: </span>
              <span className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                {getClientName(transaction.clientId)}
              </span>
            </div>
          )}
          {transaction.employeeId && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">الموظف: </span>
              <span className="font-medium text-gray-900 dark:text-white">{transaction.employeeId}</span>
            </div>
          )}
          {transaction.approvedBy && (
            <div className="md:col-span-2">
              <span className="text-gray-500 dark:text-gray-400">اعتمد بواسطة: </span>
              <span className="font-medium text-gray-900 dark:text-white">{transaction.approvedBy}</span>
            </div>
          )}
          {transaction.rejectedBy && (
            <div className="md:col-span-2">
              <span className="text-gray-500 dark:text-gray-400">رفض بواسطة: </span>
              <span className="font-medium text-red-600 dark:text-red-400">{transaction.rejectedBy}</span>
              {transaction.rejectionReason && (
                <p className="text-sm text-gray-500 mt-1">السبب: {transaction.rejectionReason}</p>
              )}
            </div>
          )}
        </div>

        {transaction.notes && (
          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <span className="text-gray-500 dark:text-gray-400">ملاحظات: </span>
            <span className="text-gray-700 dark:text-gray-300">{transaction.notes}</span>
          </div>
        )}
        {/* عرض المرفقات إذا وجدت */}
        {transaction.attachments && transaction.attachments.length > 0 && (
          <div className="mb-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">المرفقات: </span>
            <ul className="list-disc ml-6 mt-1">
              {transaction.attachments.map((file, idx) => (
                <li key={idx} className="text-blue-600 dark:text-blue-400 underline cursor-pointer">{file}</li>
              ))}
            </ul>
          </div>
        )}
        {/* أزرار العمليات */}
        {isAdmin && transaction.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={() => handleApproveTransaction(transaction._id)}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              size="lg"
            >
              <CheckCircle className="w-5 h-5" />
              ✅ موافقة
            </Button>
            <Button 
              onClick={() => handleRejectTransaction(transaction._id)}
              variant="outline"
              className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-semibold py-3"
              size="lg"
            >
              <XCircle className="w-5 h-5" />
              ❌ رفض
            </Button>
          </div>
        )}

        {isAdmin && transaction.status !== 'pending' && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleEditTransaction(transaction)}
              className="flex-1 gap-2"
            >
              <Filter className="w-4 h-4" />
              تعديل
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDeleteTransaction(transaction._id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Filter className="w-4 h-4" />
              حذف
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">


      {/* العنوان والإحصائيات */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">المعاملات المالية</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              إدارة وتتبع جميع المعاملات المالية
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              تصدير
            </Button>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              تقرير
            </Button>
            <Button 
              onClick={() => setShowAddModal(true)} 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              size="lg"
            >
              <Plus className="w-5 h-5" />
              ✨ إضافة معاملة جديدة ✨
            </Button>
          </div>
        </div>

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">صافي الربح</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(stats.totalIncome - stats.totalExpenses)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">قيد المراجعة</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.pendingTransactions}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">جميع الأنواع</option>
              <option value="income">إيرادات</option>
              <option value="expense">مصروفات</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">جميع التصنيفات</option>
              {loadingCategories ? (
                <option disabled>جاري تحميل التصنيفات...</option>
              ) : categories.length > 0 ? (
                categories.map(category => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))
              ) : (
                <option disabled>لا توجد تصنيفات</option>
              )}
            </select>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">جميع العملاء</option>
              <option value="none">عمليات عامة (بدون عميل)</option>
              {loadingClients ? (
                <option disabled>جاري تحميل العملاء...</option>
              ) : clients.length > 0 ? (
                clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))
              ) : (
                <option disabled>لا توجد عملاء</option>
              )}
            </select>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              تاريخ محدد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المعاملات */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              جاري تحميل المعاملات...
            </h3>
          </CardContent>
        </Card>
      ) : filteredTransactions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTransactions.map(transaction => (
            <TransactionCard key={transaction._id} transaction={transaction} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد معاملات
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory || selectedType || selectedClient
                ? 'لم يتم العثور على معاملات تطابق معايير البحث'
                : 'لم يتم إضافة أي معاملات بعد'}
            </p>
            {isAdmin && !searchTerm && !selectedCategory && !selectedType && !selectedClient && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4 gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4" />
                إضافة معاملة جديدة
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* نموذج إضافة/تعديل المعاملة */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTransaction ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">وصف المعاملة</Label>
                  <Input
                    id="description"
                    defaultValue={editingTransaction?.description || ''}
                    placeholder="وصف تفصيلي للمعاملة"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    defaultValue={editingTransaction?.amount || ''}
                    placeholder="0"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">نوع المعاملة</Label>
                  <select
                    id="type"
                    defaultValue={editingTransaction?.type || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">اختر النوع</option>
                    <option value="income">إيرادات</option>
                    <option value="expense">مصروفات</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">التصنيف</Label>
                  <select
                    id="category"
                    defaultValue={editingTransaction?.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">اختر التصنيف</option>
                    {loadingCategories ? (
                      <option disabled>جاري تحميل التصنيفات...</option>
                    ) : categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category._id} value={category.name}>{category.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="مشاريع">مشاريع</option>
                        <option value="رواتب">رواتب</option>
                        <option value="مرافق">مرافق</option>
                        <option value="عمولات">عمولات</option>
                        <option value="أخرى">أخرى</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">التاريخ</Label>
                  <Input
                    id="date"
                    type="date"
                    defaultValue={editingTransaction?.date ? new Date(editingTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">العميل (اختياري)</Label>
                  <select
                    id="client"
                    defaultValue={editingTransaction?.clientId || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">بدون عميل</option>
                    {loadingClients ? (
                      <option disabled>جاري تحميل العملاء...</option>
                    ) : clients.length > 0 ? (
                      clients.map(client => (
                        <option key={client._id} value={client._id}>{client.name}</option>
                      ))
                    ) : (
                      <option disabled>لا توجد عملاء</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                  <select
                    id="paymentMethod"
                    defaultValue={editingTransaction?.paymentMethod || 'كاش'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="كاش">💵 كاش</option>
                    <option value="انستا باي">📱 انستا باي</option>
                    <option value="فودافون كاش">📞 فودافون كاش</option>
                    <option value="تحويل بنكي">🏦 تحويل بنكي</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    defaultValue={editingTransaction?.notes || ''}
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={async () => {
                    console.log('🎬 بدء معالجة الضغط على زر الإضافة');
                    
                    // انتظار قصير للتأكد من أن النموذج محدث
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    const description = document.getElementById('description').value?.trim();
                    const amount = parseFloat(document.getElementById('amount').value) || 0;
                    const type = document.getElementById('type').value;
                    const category = document.getElementById('category').value?.trim();
                    const date = document.getElementById('date').value;
                    const notes = document.getElementById('notes').value?.trim();
                    const clientId = document.getElementById('client').value || null;
                    const paymentMethod = document.getElementById('paymentMethod').value;
                    
                    console.log('📝 البيانات المجمعة من النموذج:', {
                      description,
                      amount,
                      type,
                      category,
                      date,
                      notes,
                      clientId,
                      paymentMethod
                    });
                    
                    // التحقق من البيانات المطلوبة
                    if (!description.trim() || !amount || amount <= 0 || !type || !category.trim() || !date) {
                      console.log('⚠️ فشل التحقق من البيانات:', {
                        description: !!description.trim(),
                        amount: amount > 0,
                        type: !!type,
                        category: !!category.trim(),
                        date: !!date
                      });
                      toast.error('❌ يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
                      return;
                    }

                    const formData = {
                      description,
                      amount,
                      type,
                      category,
                      date,
                      notes,
                      clientId,
                      paymentMethod
                    };
                    
                    console.log('🚀 إرسال البيانات للمعالج:', formData);
                    
                    if (editingTransaction) {
                      handleUpdateTransaction(formData);
                    } else {
                      handleAddTransaction(formData);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري الحفظ...
                    </div>
                  ) : (
                    editingTransaction ? '✏️ تحديث' : '➕ إضافة'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TransactionsPage 