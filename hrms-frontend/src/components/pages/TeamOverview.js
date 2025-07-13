import React from 'react';
import Card from '../common/Card';
import { useLanguage } from '../../contexts/LanguageContext';

const CompanyProfile = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('nav.companyProfile')}</h1>
      <Card>
        <p className="text-center text-gray-500">This page is under construction.</p>
        <p className="text-center text-gray-500 mt-2">Company profile details will be displayed here.</p>
      </Card>
    </div>
  );
};

export default CompanyProfile;