// hrms-frontend/src/components/pages/LeavePolicyManagement.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit, Trash2, FileSpreadsheet as FileSpreadsheetIcon } from 'lucide-react'; // Renamed FileSpreadsheet to avoid conflict
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Card from '../common/Card';

const LeavePolicyManagement = () => {
  const { user, fetchData, postData, putData, deleteData, showMessage, employees } = useHRMS();
  const { t } = useLanguage();

  const [policies, setPolicies] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    accrualRate: '', 
    accrualUnit: 'month', 
    maxAccumulation: '', 
    maxPerRequest: '', 
    isPaid: true,
    applicableRoles: []
  });
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const fetchPolicies = useCallback(async () => {
    setIsLoading(true);
    const fetched = await fetchData('/leave-policies');
    if (fetched) {
      setPolicies(fetched.sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setPolicies([]);
    }
    setIsLoading(false);
  }, [fetchData]);

  useEffect(() => {
    if (userIsAdmin) {
      fetchPolicies();
    } else {
      showMessage(t('common.accessDenied'), 'error');
    }
  }, [userIsAdmin, fetchPolicies, showMessage, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleRolesChange = useCallback((e) => {
    const { options } = e.target;
    const selectedRoles = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selectedRoles.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, applicableRoles: selectedRoles }));
  }, []);

  const handleEdit = useCallback((policy) => {
    setEditingPolicyId(policy.id);
    setFormData({
      name: policy.name,
      description: policy.description,
      accrualRate: policy.accrualRate,
      accrualUnit: policy.accrualUnit,
      maxAccumulation: policy.maxAccumulation || '',
      maxPerRequest: policy.maxPerRequest || '',
      isPaid: policy.isPaid,
      applicableRoles: policy.applicableRoles || []
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPolicyId(null);
    setFormData({ name: '', description: '', accrualRate: '', accrualUnit: 'month', maxAccumulation: '', maxPerRequest: '', isPaid: true, applicableRoles: [] });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.description || formData.accrualRate === '') {
      showMessage(t('common.allFields'), 'error');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      accrualRate: parseFloat(formData.accrualRate),
      accrualUnit: formData.accrualUnit,
      maxAccumulation: formData.maxAccumulation !== '' ? parseFloat(formData.maxAccumulation) : null,
      maxPerRequest: formData.maxPerRequest !== '' ? parseFloat(formData.maxPerRequest) : null,
      isPaid: formData.isPaid,
      applicableRoles: formData.applicableRoles
    };

    let result = null;
    if (editingPolicyId) {
      result = await putData(`/leave-policies/${editingPolicyId}`, payload, t('leavePolicies.updateSuccess'), t('leavePolicies.updateError'));
    } else {
      result = await postData('/leave-policies', payload, t('leavePolicies.createSuccess'), t('leavePolicies.createError'));
    }

    if (result) {
      setFormData({ name: '', description: '', accrualRate: '', accrualUnit: 'month', maxAccumulation: '', maxPerRequest: '', isPaid: true, applicableRoles: [] });
      setEditingPolicyId(null);
      await fetchPolicies();
    }
    setIsSubmitting(false);
  };

  const handleDelete = useCallback(async (id) => {
    // Check if any employees are assigned to this policy before deleting
    const employeesAssigned = employees.filter(emp => emp.leavePolicyId === id);
    if (employeesAssigned.length > 0) {
      showMessage(t('leavePolicies.cannotDeleteAssignedPolicy'), 'error'); // NEW translation key
      return;
    }

    showMessage(t('leavePolicies.confirmDelete'), 'warning', [
      {
        label: t('common.yes'),
        onClick: async () => {
          const success = await deleteData('/leave-policies', id, t('leavePolicies.deleteSuccess'));
          if (success) {
            await fetchPolicies();
          }
        },
        primary: true
      },
      { label: t('common.no'), onClick: () => {} }
    ]);
  }, [deleteData, fetchPolicies, showMessage, t, employees]); // Added employees dependency

  const accrualUnitOptions = useMemo(() => [
    { value: 'month', label: t('leavePolicies.accrualUnitMonth') },
    { value: 'year', label: t('leavePolicies.accrualUnitYear') },
    { value: 'once', label: t('leavePolicies.accrualUnitOnce') }
  ], [t]);

  const allRolesOptions = useMemo(() => {
    const roles = [...new Set(employees.map(emp => emp.role).filter(Boolean))];
    return roles.map(role => ({ value: role, label: role }));
  }, [employees]);

  if (!userIsAdmin) {
    return (
      <Card>
        <p className="text-center text-red-600">{t('common.accessDenied')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('leavePolicies.title')}</h1>

      {/* Add/Edit Policy Form */}
      <Card title={editingPolicyId ? t('leavePolicies.editPolicy') : t('leavePolicies.addPolicy')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('leavePolicies.name')}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('leavePolicies.namePlaceholder')}
            required
          />
          <TextArea
            label={t('leavePolicies.description')}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder={t('leavePolicies.descriptionPlaceholder')}
            rows="3"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('leavePolicies.accrualRate')}
              name="accrualRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.accrualRate}
              onChange={handleInputChange}
              placeholder="e.g., 1.5"
              required
            />
            <Select
              label={t('leavePolicies.accrualUnit')}
              name="accrualUnit"
              value={formData.accrualUnit}
              onChange={handleInputChange}
              options={accrualUnitOptions}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('leavePolicies.maxAccumulation')}
              name="maxAccumulation"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxAccumulation}
              onChange={handleInputChange}
              placeholder={t('leavePolicies.unlimited')} // NEW translation key
            />
            <Input
              label={t('leavePolicies.maxPerRequest')}
              name="maxPerRequest"
              type="number"
              step="0.01"
              min="0"
              value={formData.maxPerRequest}
              onChange={handleInputChange}
              placeholder={t('leavePolicies.noLimit')} // NEW translation key
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPaid"
              name="isPaid"
              checked={formData.isPaid}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPaid" className="text-sm text-gray-700">
              {t('leavePolicies.isPaid')}
            </label>
          </div>
          <Select
            label={t('leavePolicies.applicableRoles')}
            name="applicableRoles"
            value={formData.applicableRoles}
            onChange={handleRolesChange}
            options={allRolesOptions}
            multiple={true} // Allow multiple selections
            placeholder={t('leavePolicies.allRoles')}
          />
          <div className="flex justify-end space-x-2">
            {editingPolicyId && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? t('common.loading') : (editingPolicyId ? t('common.saveChanges') : t('leavePolicies.add'))}
            </Button>
          </div>
        </form>
      </Card>

      {/* Policies List */}
      <Card title={t('leavePolicies.list')}>
        {isLoading ? (
          <p className="text-center">{t('common.loading')}</p>
        ) : policies.length === 0 ? (
          <p className="text-center text-gray-500">{t('leavePolicies.noPoliciesFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.accrualRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.maxAccumulationShort')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.maxPerRequestShort')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.isPaid')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('leavePolicies.applicableTo')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {policy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.accrualRate} {t('common.days')} / {t(`leavePolicies.accrualUnit${policy.accrualUnit.charAt(0).toUpperCase() + policy.accrualUnit.slice(1)}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.maxAccumulation !== null ? `${policy.maxAccumulation} ${t('common.days')}` : t('leavePolicies.unlimitedShort')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.maxPerRequest !== null ? `${policy.maxPerRequest} ${t('common.days')}` : t('leavePolicies.noLimitShort')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {policy.isPaid ? t('common.yes') : t('common.no')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {policy.applicableRoles.length > 0 ? policy.applicableRoles.join(', ') : t('leavePolicies.all')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEdit(policy)}
                          variant="outline"
                          size="small"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(policy.id)}
                          variant="danger"
                          size="small"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LeavePolicyManagement;