import React, { useState, useMemo, useCallback } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  FileText, Download, Copy, Check, Printer, 
  Calendar, Mail, Building, User 
} from 'lucide-react';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import Card from '../common/Card';

const HRLetters = () => {
  const { employees, showMessage, tenant, user } = useHRMS();
  const { t } = useLanguage();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [letterType, setLetterType] = useState('');
  const [customFields, setCustomFields] = useState({
    purpose: '',
    addressedTo: '',
    includeCompensation: false,
    includeBenefits: false,
    includeJobDescription: false,
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const employeeOptions = useMemo(() => employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} - ${emp.role}`
    })), [employees]);

  const letterTypes = useMemo(() => [
    { value: 'employment', label: t('letters.employment') },
    { value: 'salary', label: t('letters.salary') },
    { value: 'experience', label: t('letters.experience') },
    { value: 'promotion', label: t('letters.promotion') },   
    { value: 'confirmation', label: t('letters.confirmation') }, 
    { value: 'appreciation', label: t('letters.appreciation') }  
  ], [t]);

  const selectedEmployee = useMemo(() => employees.find(emp => emp.id === selectedEmployeeId), [employees, selectedEmployeeId]);

  const handleGenerateLetter = useCallback(() => {
    if (!selectedEmployeeId || !letterType) {
      showMessage(t('letters.selectEmployeeAndType'), 'error');
      setGeneratedLetter('');
      return;
    }

    let letterContent = '';
    const todayFormatted = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const companyInfo = {
      name: tenant?.name || 'Your Company Name',
      address: '123 Business Plaza, Suite 500', // Placeholder, ideally from tenant data
      city: 'Headquarters City, ZIP', // Placeholder
      phone: '+1 (XXX) XXX-XXXX', // Placeholder
      email: tenant?.contactEmail || 'contact@yourcompany.com' 
    };

    const defaultSignerName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'HR Manager';
    const defaultSignerTitle = user?.role === 'admin' ? 'Admin' : 'HR Manager';


    const header = `${companyInfo.name}
${companyInfo.address}
${companyInfo.city}
Tel: ${companyInfo.phone}
Email: ${companyInfo.email}

Date: ${todayFormatted}

${customFields.addressedTo ? `${t('letters.to')}: ${customFields.addressedTo}\n\n` : ''}`;

    switch (letterType) {
      case 'employment':
        letterContent = `${header}${t('letters.employmentLetterTitle')}

${t('letters.toWhomItMayConcern')},

${t('letters.employmentConfirmStart')} ${selectedEmployee.firstName} ${selectedEmployee.lastName} ${t('letters.employmentConfirmMid')} ${companyInfo.name} ${t('letters.employmentConfirmEnd')} ${selectedEmployee.role} ${t('letters.inOur')} ${selectedEmployee.department} ${t('letters.department')}.

${selectedEmployee.firstName} ${t('letters.employmentSince')} ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ${t('letters.andIsCurrently')}.

${customFields.includeJobDescription ? `\n${t('letters.jobResponsibilities')}:\n• ${t('letters.jobDuty1')}\n• ${t('letters.jobDuty2')}\n• ${t('letters.jobDuty3')}\n• ${t('letters.jobDuty4')}\n` : ''}

${customFields.includeCompensation ? `\n${t('letters.compensationInfo')}\n` : ''}

${customFields.purpose ? `\n${t('letters.purposeTextStart')} ${customFields.purpose}.${t('letters.purposeTextEnd')}\n` : ''}

${t('letters.additionalInfoContact')}.

${t('letters.sincerely')},

_____________________
${defaultSignerName}
${defaultSignerTitle}
${companyInfo.name}`;
        break;

      case 'salary':
        letterContent = `${header}${t('letters.salaryCertificateTitle')}

${t('letters.thisIsToCertify')} ${selectedEmployee.firstName} ${selectedEmployee.lastName}, ${t('letters.holdingPosition')} ${selectedEmployee.role} ${t('letters.inOur')} ${selectedEmployee.department} ${t('letters.department')}, ${t('letters.isEmployedSince')} ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

${t('letters.currentCompensationDetails')}:
• ${t('letters.annualBaseSalary')}: $85,000 USD
• ${t('letters.monthlyGrossSalary')}: $7,083.33 USD
• ${t('letters.paymentFrequency')}: Bi-weekly

${customFields.includeBenefits ? `\n${t('letters.additionalBenefits')}:\n• ${t('letters.benefit1')}\n• ${t('letters.benefit2')}\n• ${t('letters.benefit3')}\n• ${t('letters.benefit4', { days: selectedEmployee.vacationBalance || 0 })}\n• ${t('letters.benefit5', { days: selectedEmployee.sickBalance || 0 })}\n• ${t('letters.benefit6', { days: selectedEmployee.personalBalance || 0 })}\n` : ''} {/* FIX: Added sick and personal days and their translation keys */}

${t('letters.certificateIssuedPurposeStart')} ${customFields.purpose ? `${t('letters.certificateIssuedPurposeMid')} ${customFields.purpose}.` : '.'}

${t('letters.verificationContact')}.

${t('letters.sincerely')},

_____________________
${defaultSignerName}
${defaultSignerTitle}
${companyInfo.name}`;
        break;

      case 'experience':
        letterContent = `${header}${t('letters.experienceCertificateTitle')}

${t('letters.thisIsToCertify')} ${selectedEmployee.firstName} ${selectedEmployee.lastName} ${t('letters.employedFrom')} ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} ${t('letters.toPresentAs')} ${selectedEmployee.role}.

${t('letters.duringTenure')}:

• ${t('letters.experienceBullet1')}
• ${t('letters.experienceBullet2')}
• ${t('letters.experienceBullet3')}
• ${t('letters.experienceBullet4')}
• ${t('letters.experienceBullet5')}

${selectedEmployee.firstName} ${t('letters.valuableMember')}.

${t('letters.wishSuccess')}.

${t('letters.sincerely')},

_____________________
${defaultSignerName}
${defaultSignerTitle}
${companyInfo.name}`;
        break;

      case 'promotion':
        letterContent = `${header}${t('letters.promotionLetterTitle')}

${t('letters.dear')} ${selectedEmployee.firstName} ${selectedEmployee.lastName},

${t('letters.pleasedToInform')} ${companyInfo.name}, ${t('letters.promotedTo')} Senior ${selectedEmployee.role}, ${t('letters.effective')} ${new Date(customFields.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

${t('letters.newResponsibilities')}:
• ${t('letters.responsibility1')}
• ${t('letters.responsibility2')}
• ${t('letters.responsibility3')}
• ${t('letters.responsibility4')}

${t('letters.compensationRevised')}:
• ${t('letters.newAnnualSalary')}: $105,000 USD
• ${t('letters.performanceBonus')}: Up to 20% of base salary
• ${t('letters.additionalStockOptions')}: 500 units

${t('letters.otherTermsUnchanged')}.

${t('letters.confidentInRole')}.

${t('letters.congratulations')}.

${t('letters.sincerely')},

_____________________
John Smith {/* FIX: This signer name/title is still hardcoded for now, for simplicity. Can be made dynamic from user input later if required. */}
CEO
${companyInfo.name}`;
        break;

      case 'confirmation':
        letterContent = `${header}${t('letters.confirmationLetterTitle')}

${t('letters.dear')} ${selectedEmployee.firstName} ${selectedEmployee.lastName},

${t('letters.pleasedToConfirmEmployment')} ${companyInfo.name} ${t('letters.permanentPosition')} ${selectedEmployee.role} ${t('letters.inThe')} ${selectedEmployee.department} ${t('letters.department')}, ${t('letters.effective')} ${new Date(customFields.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

${t('letters.probationSuccess')}.

${t('letters.termsOfEmployment')}:
• ${t('letters.position')}: ${selectedEmployee.role}
• ${t('letters.department')}: ${selectedEmployee.department}
• ${t('letters.employmentType')}: ${t('letters.fullTimePermanent')}
• ${t('letters.workLocation')}: ${companyInfo.city}

${t('letters.acknowledgeReceipt')}.

${t('letters.lookForwardContinued')}.

${t('letters.sincerely')},

_____________________
${defaultSignerName}
${defaultSignerTitle}
${companyInfo.name}`;
        break;

      case 'appreciation':
        letterContent = `${header}${t('letters.appreciationLetterTitle')}

${t('letters.dear')} ${selectedEmployee.firstName} ${selectedEmployee.lastName},

${t('letters.onBehalfOf')} ${companyInfo.name}, ${t('letters.sincereAppreciationStart')} ${selectedEmployee.role}.

${t('letters.recentContributions')}

${t('letters.specificAchievements')}:
• ${t('letters.achievement1')}
• ${t('letters.achievement2')}
• ${t('letters.achievement3')}
• ${t('letters.achievement4')}

${t('letters.positiveAttitude')}.

${t('letters.thankYouContinued')}.

${t('letters.sincerely')},

_____________________
Sarah Johnson {/* FIX: This signer name/title is still hardcoded for now. */}
Department Head
${selectedEmployee.department}
${companyInfo.name}`;
        break;

      default:
        letterContent = t('letters.selectLetterTypeDefault');
    }

    setGeneratedLetter(letterContent);
  }, [selectedEmployeeId, letterType, selectedEmployee, customFields, tenant, user, showMessage, t]);

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedLetter).then(() => {
      setCopied(true);
      showMessage(t('letters.copied'), 'success');
      setTimeout(() => setCopied(false), 3000);
    });
  }, [generatedLetter, showMessage, t]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letterType}_letter_${selectedEmployee?.firstName}_${selectedEmployee?.lastName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(t('letters.downloadSuccess'), 'success');
  }, [generatedLetter, letterType, selectedEmployee, showMessage, t]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${letterType} Letter - ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <pre>${generatedLetter}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [generatedLetter, letterType, selectedEmployee]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setCustomFields(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  return (
    <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between"> {/* ADD THIS WRAPPER */}
      <h1 className="text-2xl font-bold text-gray-800">{t('letters.title')}</h1>
    </div>  

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letter Configuration */}
        <div className="space-y-6">
          <Card title={t('letters.letterConfiguration')}>
            <div className="space-y-4">
              <Select
                label={t('letters.selectEmployee')}
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={employeeOptions}
                placeholder="Select an employee"
              />

              <Select
                label={t('letters.selectType')}
                value={letterType}
                onChange={(e) => setLetterType(e.target.value)}
                options={letterTypes}
                placeholder="Select letter type"
              />

              {selectedEmployeeId && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">{t('letters.employeeDetails')}:</p>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• {t('common.name')}: {selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                    <p>• {t('employee.position')}: {selectedEmployee?.role}</p>
                    <p>• {t('employee.department')}: {selectedEmployee?.department}</p>
                    <p>• {t('employee.hireDate')}: {selectedEmployee?.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title={t('letters.additionalOptions')}>
            <div className="space-y-4">
              <Input
                label={t('letters.purposeOptional')} /* Corrected JSX comment syntax */
                name="purpose"
                value={customFields.purpose}
                onChange={handleInputChange}
                placeholder="e.g., Visa application, Bank loan"
              />

              <Input
                label={t('letters.addressedToOptional')}
                name="addressedTo"
                value={customFields.addressedTo}
                onChange={handleInputChange}
                placeholder="e.g., Visa Office, Bank Manager"
              />

              {(letterType === 'promotion' || letterType === 'confirmation') && (
                <Input
                  label={t('letters.effectiveDate')}
                  name="effectiveDate"
                  type="date"
                  value={customFields.effectiveDate}
                  onChange={handleInputChange}
                />
              )}

              {(letterType === 'employment' || letterType === 'salary') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">{t('letters.include')}:</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="includeCompensation"
                        checked={customFields.includeCompensation}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{t('letters.compensationDetails')}</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="includeBenefits"
                        checked={customFields.includeBenefits}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{t('letters.benefitsInformation')}</span>
                    </label>
                    {letterType === 'employment' && (
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name="includeJobDescription"
                          checked={customFields.includeJobDescription}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{t('letters.jobDescription')}</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleGenerateLetter}
                className="w-full"
                disabled={!selectedEmployeeId || !letterType}
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('letters.generate')}
              </Button>
            </div>
          </Card>
        </div>

        {/* Generated Letter */}
        <div className="space-y-4">
          <Card title={t('letters.generatedLetterTitle')} className="h-full">
            {generatedLetter ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {t('letters.letterReadyForUse')}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="small"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t('letters.copied') : t('letters.copy')}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="small"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="small"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg overflow-auto max-h-96">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {generatedLetter}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText className="w-16 h-16 mb-4" />
                <p className="text-center">
                  {t('letters.selectToGenerate')}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Letter Templates Info */}
      <Card title={t('letters.availableTemplatesTitle')}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letterTypes.map((type) => (
            <div key={type.value} className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">{type.label}</h4>
              <p className="text-sm text-gray-600">
                {type.value === 'employment' && t('letters.employmentDesc')}
                {type.value === 'salary' && t('letters.salaryDesc')}
                {type.value === 'experience' && t('letters.experienceDesc')}
                {type.value === 'promotion' && t('letters.promotionDesc')}
                {type.value === 'confirmation' && t('letters.confirmationDesc')}
                {type.value === 'appreciation' && t('letters.appreciationDesc')}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default HRLetters;