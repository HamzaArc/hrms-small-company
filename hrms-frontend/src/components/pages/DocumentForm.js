import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, FileText, X, Calendar, Shield, AlertCircle, Save, Edit3 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

// DocumentForm now accepts a documentId prop for editing existing documents
const DocumentForm = ({ documentId }) => {
  const { 
    employees, 
    setCurrentPage,
    showMessage,
    postData, 
    putData, 
    fetchData 
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    type: '',
    expiryDate: '',
    requiresSignature: false, // This will map to backend status if it's 'Pending'
    notes: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Manages loading state for form data
  const [isSubmitting, setIsSubmitting] = useState(false); // Manages loading state for form submission

  // Effect to load document data if editing
  useEffect(() => {
    const loadDocumentData = async () => {
      if (documentId) {
        setIsLoading(true);
        const fetchedDoc = await fetchData(`/documents/${documentId}`);
        if (fetchedDoc) {
          setFormData({
            employeeId: fetchedDoc.employeeId,
            name: fetchedDoc.name,
            type: fetchedDoc.type,
            expiryDate: fetchedDoc.expiryDate ? new Date(fetchedDoc.expiryDate).toISOString().split('T')[0] : '',
            requiresSignature: fetchedDoc.status === 'Pending', // Infer from status
            notes: fetchedDoc.notes || ''
          });
          setSelectedFile({ name: fetchedDoc.fileUrl ? fetchedDoc.fileUrl.split('/').pop() : 'No file', size: 0 });
        } else {
            showMessage(t('documents.errorLoadingDoc'), 'error');
            setCurrentPage('documents');
        }
        setIsLoading(false);
      } else {
        if (employees.length > 0) {
            setFormData(prev => ({ ...prev, employeeId: employees[0].id }));
        }
        setIsLoading(false);
      }
    };
    loadDocumentData();
  }, [documentId, fetchData, employees, setCurrentPage, showMessage, t]);


  const employeeOptions = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    })), [employees]);

  const documentTypes = [
    { value: 'Contract', label: 'Employment Contract' },
    { value: 'Identification', label: 'ID/Passport' },
    { value: 'Certification', label: 'Professional Certification' },
    { value: 'Policy', label: 'Policy Acknowledgment' },
    { value: 'Tax', label: 'Tax Documents' },
    { value: 'Insurance', label: 'Insurance Documents' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback((file) => {
    if (!documentId) { // Only validate file in creation mode
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (file.size > maxSize) {
            showMessage(t('documents.fileTooLarge'), 'error');
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            showMessage(t('documents.invalidFileType'), 'error');
            return;
        }
    }
    
    setSelectedFile(file);
    
    if (!documentId && !formData.name) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, name: fileName }));
    }
  }, [documentId, formData.name, showMessage, t]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.name) {
      newErrors.name = 'Please enter document name';
    }
    if (!formData.type) {
      newErrors.type = 'Please select document type';
    }
    if (!documentId && !selectedFile) { // If creating and no file selected
      newErrors.file = 'Please select a file to upload';
    }
    
    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expiryDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [documentId, formData, selectedFile]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      employeeId: formData.employeeId,
      name: formData.name,
      type: formData.type,
      expiryDate: formData.expiryDate || null,
      status: formData.requiresSignature ? 'Pending' : 'Active',
      notes: formData.notes
    };

    let result = null;
    if (documentId) {
        result = await putData(`/documents/${documentId}`, payload, t('documents.updateSuccess'), t('documents.saveError')); // Added error message
    } else {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        // FIX: Do NOT append uploadDate here; let backend set it
        Object.keys(payload).forEach(key => {
            if (payload[key] !== null && payload[key] !== undefined) {
                uploadFormData.append(key, payload[key]);
            }
        });
        
        result = await postData('/documents/upload', uploadFormData, t('documents.uploadSuccess'), t('documents.uploadError')); // Added error message
    }
    
    if (result) {
      await fetchData(formData.employeeId ? `/documents?employeeId=${formData.employeeId}` : '/documents');
      setCurrentPage('documents');
    }
    
    setIsSubmitting(false);
  }, [documentId, formData, selectedFile, validateForm, postData, putData, fetchData, setCurrentPage, showMessage, t]);

  const handleCancel = useCallback(() => {
    setCurrentPage('documents');
  }, [setCurrentPage]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
      return <Card><p className="text-center">{t('common.loading')}</p></Card>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {documentId ? t('documents.editDocument') : t('documents.uploadNew')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card>
          <Select
            label={t('onboarding.employee')}
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            options={employeeOptions}
            placeholder="Select employee"
            error={errors.employeeId}
            required
            disabled={documentId}
          />
        </Card>

        {/* File Upload/Info */}
        <Card title={documentId ? t('documents.fileInformation') : t('documents.uploadDocument')}>
          <div className="space-y-4">
            {errors.file && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.file}</span>
              </div>
            )}
            
            {documentId ? (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div className="text-left">
                        <p className="font-medium text-gray-800">{selectedFile?.name || 'No file selected'}</p>
                        {selectedFile?.size > 0 && <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>}
                        <p className="text-xs text-gray-500">File cannot be changed during edit mode.</p>
                    </div>
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    
                    {selectedFile ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                        <FileText className="w-12 h-12 text-blue-500" />
                        <div className="text-left">
                            <p className="font-medium text-gray-800">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="ml-4 text-red-500 hover:text-red-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        </div>
                    </div>
                    ) : (
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                        Drag and drop your file here, or{' '}
                        <span className="text-blue-600 hover:text-blue-700">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                        PDF, JPG, PNG, DOC, DOCX up to 10MB
                        </p>
                    </label>
                    )}
                </div>
            )}
          </div>
        </Card>

        {/* Document Details */}
        <Card title="Document Information">
          <div className="space-y-4">
            <Input
              label={t('documents.name')}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Employment Contract 2025"
              error={errors.name}
              required
            />

            <Select
              label={t('documents.type')}
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              options={documentTypes}
              placeholder="Select document type"
              error={errors.type}
              required
            />

            <Input
              label={t('documents.expiryDate') + ' (Optional)'}
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleInputChange}
              error={errors.expiryDate}
              min={new Date().toISOString().split('T')[0]}
            />

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requiresSignature"
                name="requiresSignature"
                checked={formData.requiresSignature}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiresSignature" className="text-sm text-gray-700">
                This document requires employee signature
              </label>
            </div>

            <TextArea
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional notes about this document"
            />
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Document Security</p>
              <p>All documents are encrypted and stored securely. Only authorized personnel can access employee documents.</p>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {documentId ? <><Save className="w-4 h-4 mr-2" /> {isSubmitting ? t('common.loading') : t('documents.saveChanges')}</> : <><Upload className="w-4 h-4 mr-2" /> {isSubmitting ? t('common.loading') : t('documents.uploadDocumentButton')}</>} {/* New translation key */}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;