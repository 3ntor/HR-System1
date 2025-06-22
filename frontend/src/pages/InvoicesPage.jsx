import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNotifications } from '../components/NotificationSystem';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { invoiceService, clientService } from '../services/api';

const InvoicesPage = () => {
  const { showSuccess, showError } = useNotifications();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0
  });
  const [formData, setFormData] = useState({
    client: '',
    amount: '',
    description: '',
    dueDate: '',
    paymentMethod: '',
    notes: ''
  });

  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoicesResponse, clientsResponse, statsResponse] = await Promise.all([
          invoiceService.getAll({
            status: selectedStatus,
            client: selectedClient,
            search: searchTerm
          }),
          clientService.getAll(),
          invoiceService.getStats()
        ]);

        setInvoices(invoicesResponse.data);
        setClients(clientsResponse.data);
        setStats(statsResponse.data);
      } catch (error) {
        showError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStatus, selectedClient, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        await invoiceService.update(editingInvoice._id, formData);
        showSuccess('Invoice updated successfully');
      } else {
        const response = await invoiceService.create(formData);
        setInvoices(prev => [...prev, response.data]);
        showSuccess('Invoice created successfully');
      }
      setShowAddModal(false);
      setEditingInvoice(null);
      setFormData({
        client: '',
        amount: '',
        description: '',
        dueDate: '',
        paymentMethod: '',
        notes: ''
      });
    } catch (error) {
      showError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحية لحذف الفواتير');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await invoiceService.delete(id);
        showSuccess('تم حذف الفاتورة بنجاح');
        setInvoices(prev => prev.filter(inv => inv._id !== id));
      } catch (error) {
        if (error.response?.status === 403) {
          showError('ليس لديك صلاحية لحذف الفواتير');
        } else {
          showError('فشل في حذف الفاتورة');
        }
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoiceService.update(id, { status });
      showSuccess('Invoice status updated successfully');
      setInvoices(prev => prev.map(inv => 
        inv._id === id ? { ...inv, status } : inv
      ));
    } catch (error) {
      showError('Failed to update invoice status');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || invoice.status === selectedStatus;
    const matchesClient = !selectedClient || invoice.client._id === selectedClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الفواتير</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة وتتبع الفواتير
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            إضافة فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الفواتير</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">قيد الانتظار</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مدفوعة</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">متأخرة</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغاة</option>
            </select>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">جميع العملاء</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              المزيد من الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInvoices.map(invoice => (
          <Card key={invoice._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                  <CardDescription>{invoice.client.name}</CardDescription>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoice.status === 'paid' ? 'مدفوعة' :
                   invoice.status === 'pending' ? 'قيد الانتظار' :
                   invoice.status === 'overdue' ? 'متأخرة' :
                   'ملغاة'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">المبلغ:</span>
                  <span className="font-bold">{formatCurrency(invoice.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">تاريخ الاستحقاق:</span>
                  <span>{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">طريقة الدفع:</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(invoice._id, 'paid')}
                    disabled={invoice.status === 'paid'}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingInvoice(invoice);
                      setFormData({
                        client: invoice.client._id,
                        amount: invoice.amount,
                        description: invoice.description,
                        dueDate: invoice.dueDate,
                        paymentMethod: invoice.paymentMethod,
                        notes: invoice.notes
                      });
                      setShowAddModal(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invoice._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>{editingInvoice ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">العميل</Label>
                    <select
                      id="client"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      required
                    >
                      <option value="">اختر العميل</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      required
                    >
                      <option value="">اختر طريقة الدفع</option>
                      <option value="cash">كاش</option>
                      <option value="bank_transfer">تحويل بنكي</option>
                      <option value="check">شيك</option>
                      <option value="credit_card">بطاقة ائتمان</option>
                      <option value="debit_card">بطاقة خصم</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingInvoice(null);
                      setFormData({
                        client: '',
                        amount: '',
                        description: '',
                        dueDate: '',
                        paymentMethod: '',
                        notes: ''
                      });
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingInvoice ? 'تحديث' : 'إضافة'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage; 