// hrms-frontend/src/components/pages/HolidayManagement.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit, Trash2, Calendar, Filter } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

const HolidayManagement = () => {
  const { user, fetchData, postData, putData, deleteData, showMessage } = useHRMS();
  const { t } = useLanguage();

  const [holidays, setHolidays] = useState([]);
  const [formData, setFormData] = useState({ name: '', date: '', isPublic: true });
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const fetchHolidays = useCallback(async () => {
    setIsLoading(true);
    const startOfYear = `${filterYear}-01-01`;
    const endOfYear = `${filterYear}-12-31`;
    const fetched = await fetchData(`/holidays?startDate=${startOfYear}&endDate=${endOfYear}`);
    if (fetched) {
      // Sort holidays by date for display
      setHolidays(fetched.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } else {
      setHolidays([]);
    }
    setIsLoading(false);
  }, [fetchData, filterYear]);

  useEffect(() => {
    if (userIsAdmin) { // Only fetch if user is admin
      fetchHolidays();
    } else {
      showMessage(t('common.accessDenied'), 'error');
    }
  }, [userIsAdmin, fetchHolidays, showMessage, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleEdit = useCallback((holiday) => {
    setEditingHolidayId(holiday.id);
    setFormData({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0],
      isPublic: holiday.isPublic
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingHolidayId(null);
    setFormData({ name: '', date: '', isPublic: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.date) {
      showMessage(t('common.allFields'), 'error');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: formData.name,
      date: formData.date,
      isPublic: formData.isPublic
    };

    let result = null;
    if (editingHolidayId) {
      result = await putData(`/holidays/${editingHolidayId}`, payload, t('holidays.updateSuccess'), t('holidays.updateError'));
    } else {
      result = await postData('/holidays', payload, t('holidays.createSuccess'), t('holidays.createError'));
    }

    if (result) {
      setFormData({ name: '', date: '', isPublic: true });
      setEditingHolidayId(null);
      await fetchHolidays(); // Re-fetch all holidays to update list
    }
    setIsSubmitting(false);
  };

  const handleDelete = useCallback(async (id) => {
    showMessage(t('holidays.confirmDelete'), 'warning', [
      {
        label: t('common.yes'),
        onClick: async () => {
          const success = await deleteData('/holidays', id, t('holidays.deleteSuccess'));
          if (success) {
            await fetchHolidays(); // Re-fetch holidays to update list
          }
        },
        primary: true
      },
      { label: t('common.no'), onClick: () => {} }
    ]);
  }, [deleteData, fetchHolidays, showMessage, t]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push({ value: i.toString(), label: i.toString() });
    }
    return years;
  }, []);

  if (!userIsAdmin) {
    return (
      <Card>
        <p className="text-center text-red-600">{t('common.accessDenied')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('holidays.title')}</h1>

      {/* Filter by Year */}
      <Card>
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            {t('holidays.filterByYear')}
          </h3>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {yearOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>


      {/* Add/Edit Holiday Form */}
      <Card title={editingHolidayId ? t('holidays.editHoliday') : t('holidays.addHoliday')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('holidays.name')}
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={t('holidays.namePlaceholder')}
            required
          />
          <Input
            label={t('holidays.date')}
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              {t('holidays.isPublic')}
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            {editingHolidayId && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              {isSubmitting ? t('common.loading') : (editingHolidayId ? t('common.saveChanges') : t('holidays.add'))}
            </Button>
          </div>
        </form>
      </Card>

      {/* Holidays List */}
      <Card title={t('holidays.list')}>
        {isLoading ? (
          <p className="text-center">{t('common.loading')}</p>
        ) : holidays.length === 0 ? (
          <p className="text-center text-gray-500">{t('holidays.noHolidaysFound')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('holidays.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('holidays.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('holidays.public')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {holiday.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(holiday.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {holiday.isPublic ? t('common.yes') : t('common.no')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEdit(holiday)}
                          variant="outline"
                          size="small"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(holiday.id)}
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

export default HolidayManagement;