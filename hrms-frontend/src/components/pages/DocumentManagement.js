
import React, { useState, useMemo, useEffect } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  FileText, Upload, Download, Edit3, Trash2, 
  AlertCircle, Shield, Calendar, Filter, Search 
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const DocumentManagement = () => {
  const { 
    employees, 
    setEmployees,
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add this after the state declarations:
   useEffect(() => {
     if (employees.length > 0 && !selectedEmployeeId) {
       setSelectedEmployeeId(employees[0].id);
     }
   }, [employees]);

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const documentTypes = [
    { value: 'Contract', label: 'Contract' },
    { value: 'Identification', label: 'Identification' },
    { value: 'Certification', label: 'Certification' },
    { value: 'Policy', label: 'Policy Acknowledgment' },
    { value: 'Other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Pending', label: 'Pending Signature' }
  ];

  // Get selected employee's documents
  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const documents = selectedEmployee?.documents || [];

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filterType || doc.type === filterType;
      const matchesStatus = !filterStatus || doc.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchTerm, filterType, filterStatus]);

  // Check document status
  const getDocumentStatus = (doc) => {
    if (!doc.expiryDate) return doc.status || 'Active';
    
    const today = new Date();
    const expiryDate = new Date(doc.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 90) return 'Expiring Soon';
    return doc.status || 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (doc) => {
    showMessage(`Downloaded: ${doc.name}`, 'success');
  };

  const handleESign = (docId) => {
    if (!selectedEmployeeId) return;

    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === selectedEmployeeId) {
          return {
            ...emp,
            documents: emp.documents.map(doc => 
              doc.id === docId 
                ? { ...doc, status: 'Active', signedDate: new Date().toISOString().split('T')[0] }
                : doc
            )
          };
        }
        return emp;
      })
    );

    showMessage(t('documents.signed'), 'success');
  };

  const handleDelete = (docId) => {
    showMessage('Are you sure you want to delete this document?', 'warning', [
      {
        label: t('common.yes'),
        onClick: () => {
          setEmployees(prev => 
            prev.map(emp => {
              if (emp.id === selectedEmployeeId) {
                return {
                  ...emp,
                  documents: emp.documents.filter(doc => doc.id !== docId)
                };
              }
              return emp;
            })
          );
          showMessage('Document deleted successfully', 'success');
        },
        primary: true
      },
      {
        label: t('common.no'),
        onClick: () => {}
      }
    ]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!selectedEmployee) return null;
    
    const docs = selectedEmployee.documents;
    const today = new Date();
    
    return {
      total: docs.length,
      active: docs.filter(d => getDocumentStatus(d) === 'Active').length,
      expired: docs.filter(d => getDocumentStatus(d) === 'Expired').length,
      expiringSoon: docs.filter(d => {
        if (!d.expiryDate) return false;
        const expiryDate = new Date(d.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
      }).length
    };
  }, [selectedEmployee]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('documents.title')}</h1>
        {selectedEmployeeId && (
          <Button 
            onClick={() => setCurrentPage('documentUpload')}
            className="mt-4 sm:mt-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('documents.uploadNew')}
          </Button>
        )}
      </div>

      {/* Employee Selector */}
      <Card>
        <Select
          label={t('documents.selectEmployee')}
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          options={employeeOptions}
          placeholder="Select an employee to view documents"
        />
      </Card>

      {selectedEmployeeId && (
        <>
          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Documents</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.expiringSoon}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expired</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.expired}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-500" />
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </h3>
                {(searchTerm || filterType || filterStatus) && (
                  <Button onClick={clearFilters} variant="outline" size="small">
                    Clear Filters
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  options={documentTypes}
                  placeholder="All Types"
                />
                
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={statusOptions}
                  placeholder="All Status"
                />
              </div>
            </div>
          </Card>

          {/* Documents Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('documents.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('documents.type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('documents.uploadDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('documents.expiryDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const status = getDocumentStatus(doc);
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                {doc.signedDate && (
                                  <p className="text-xs text-gray-500">
                                    Signed: {new Date(doc.signedDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="text-blue-600 hover:text-blue-900"
                                title={t('documents.download')}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {doc.status === 'Pending' && (
                                <button
                                  onClick={() => handleESign(doc.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title={t('documents.eSign')}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="text-red-600 hover:text-red-900"
                                title={t('documents.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default DocumentManagement;