// hrms-frontend/src/components/pages/CompanyProfile.js
// Fix the import syntax here: change '=>' to 'from'
import React, { useState, useEffect, useCallback } from 'react'; // Corrected line 1
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { Building, Mail, Check, Save } from 'lucide-react';

const CompanyProfile = () => {
  const { user, fetchData, putData, showMessage, setTenant } = useHRMS();
  const { t } = useLanguage();

  const [companyData, setCompanyData] = useState({
    name: '',
    contactEmail: '',
    status: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = user?.role === 'admin';

  useEffect(() => {
    const loadCompanyData = async () => {
      if (user?.tenantId) {
        setIsLoading(true);
        const data = await fetchData(`/tenants/${user.tenantId}`);
        if (data) {
          setCompanyData(data);
        } else {
          showMessage(t('common.error') + ': ' + t('company.loadError'), 'error');
        }
        setIsLoading(false);
      }
    };
    loadCompanyData();
  }, [user?.tenantId, fetchData, showMessage, t]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      name: companyData.name,
      contactEmail: companyData.contactEmail,
      status: companyData.status
    };

    const result = await putData(
      `/tenants/${user.tenantId}`,
      payload,
      t('company.saveSuccess'),
      t('company.saveError')
    );

    if (result) {
      if (typeof setTenant === 'function') {
        setTenant(result);
      } else {
        console.error('HRMSContext: setTenant is not a function. This should not happen. Forcing data refetch.');
        const refetchedTenant = await fetchData(`/tenants/${user.tenantId}`);
        if (refetchedTenant && typeof setTenant === 'function') {
            setTenant(refetchedTenant);
        } else if (refetchedTenant) {
            setCompanyData(refetchedTenant);
        }
      }
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <Card><p className="text-center">{t('common.loading')}</p></Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('nav.companyProfile')}</h1>

      <Card title={t('company.details')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('company.name')}
            name="name"
            value={companyData.name}
            onChange={handleInputChange}
            readOnly={!isEditing}
            icon={<Building />}
          />
          <Input
            label={t('company.contactEmail')}
            name="contactEmail"
            type="email"
            value={companyData.contactEmail}
            onChange={handleInputChange}
            readOnly={!isEditing}
            icon={<Mail />}
          />
          <Input
            label={t('company.status')}
            name="status"
            value={companyData.status}
            onChange={handleInputChange}
            readOnly={true}
          />
        </div>
        {canEdit && (
          <div className="mt-6 flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? t('common.loading') : t('common.saveChanges')}
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="secondary">
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Check className="w-4 h-4 mr-2" />
                {t('common.edit')}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyProfile;