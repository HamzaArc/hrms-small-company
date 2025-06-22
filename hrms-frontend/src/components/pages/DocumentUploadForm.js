import React, { useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload, FileText, X, Calendar, Shield, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Card from '../common/Card';

const DocumentUploadForm = () => {
  const { 
    employees, 
    setEmployees, 
    setCurrentPage,
    showMessage 
  } = useHRMS();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employeeId: '',
    documentName: '',
    documentType: '',
    expiryDate: '',
    requiresSignature: false,
    notes: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
    }));

  const documentTypes = [
    { value: 'Contract', label: 'Employment Contract' },
    { value: 'Identification', label: 'ID/Passport' },
    { value: 'Certification', label: 'Professional Certification' },
    { value: 'Policy', label: 'Policy Acknowledgment' },
    { value: 'Tax', label: 'Tax Documents' },
    { value: 'Insurance', label: 'Insurance Documents' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      showMessage('File size must be less than 10MB', 'error');
      return;
    }
    
    if (!allowedTypes.includes(file.type)) {
      showMessage('Only PDF, JPG, PNG, DOC, and DOCX files are allowed', 'error');
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-fill document name if empty
    if (!formData.documentName) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, documentName: fileName }));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.documentName) {
      newErrors.documentName = 'Please enter document name';
    }
    if (!formData.documentType) {
      newErrors.documentType = 'Please select document type';
    }
    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }
    
    // Validate expiry date if provided
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create new document
    const newDocument = {
      id: `doc-${Date.now()}`,
      name: formData.documentName,
      type: formData.documentType,
      uploadDate: new Date().toISOString().split('T')[0],
      expiryDate: formData.expiryDate || null,
      status: formData.requiresSignature ? 'Pending' : 'Active',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      notes: formData.notes
    };

    // Add document to employee
    setEmployees(prev => 
      prev.map(emp => {
        if (emp.id === formData.employeeId) {
          return {
            ...emp,
            documents: [...(emp.documents || []), newDocument]
          };
        }
        return emp;
      })
    );

    showMessage('Document uploaded successfully', 'success');
    setCurrentPage('documents');
  };

  const handleCancel = () => {
    setCurrentPage('documents');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('documents.uploadNew')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <Card>
          <Select
            label="Employee"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            options={employeeOptions}
            placeholder="Select employee"
            error={errors.employeeId}
            required
          />
        </Card>

        {/* File Upload */}
        <Card title="Upload Document">
          <div className="space-y-4">
            {errors.file && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.file}</span>
              </div>
            )}
            
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
          </div>
        </Card>

        {/* Document Details */}
        <Card title="Document Information">
          <div className="space-y-4">
            <Input
              label={t('documents.name')}
              name="documentName"
              value={formData.documentName}
              onChange={handleInputChange}
              placeholder="e.g., Employment Contract 2025"
              error={errors.documentName}
              required
            />

            <Select
              label={t('documents.type')}
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              options={documentTypes}
              placeholder="Select document type"
              error={errors.documentType}
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

            <Input
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
          <Button type="submit">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploadForm;