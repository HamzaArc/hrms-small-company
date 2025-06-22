import React, { useState } from 'react';
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
  const { employees, showMessage } = useHRMS();
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

  const employeeOptions = employees
    .filter(emp => emp.status === 'Active')
    .map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName} - ${emp.role}`
    }));

  const letterTypes = [
    { value: 'employment', label: t('letters.employment') },
    { value: 'salary', label: t('letters.salary') },
    { value: 'experience', label: 'Experience Certificate' },
    { value: 'promotion', label: 'Promotion Letter' },
    { value: 'confirmation', label: 'Confirmation Letter' },
    { value: 'appreciation', label: 'Letter of Appreciation' }
  ];

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  const handleGenerateLetter = () => {
    if (!selectedEmployeeId || !letterType) {
      showMessage('Please select both employee and letter type', 'error');
      return;
    }

    let letter = '';
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const companyInfo = {
      name: 'TechCorp Solutions Inc.',
      address: '123 Business Plaza, Suite 500',
      city: 'New York, NY 10001',
      phone: '+1 (555) 123-4567',
      email: 'hr@techcorp.com'
    };

    // Common header for all letters
    const header = `${companyInfo.name}
${companyInfo.address}
${companyInfo.city}
Tel: ${companyInfo.phone}
Email: ${companyInfo.email}

Date: ${today}

${customFields.addressedTo ? `To: ${customFields.addressedTo}\n\n` : ''}`;

    switch (letterType) {
      case 'employment':
        letter = `${header}EMPLOYMENT VERIFICATION LETTER

To Whom It May Concern,

This letter is to confirm that ${selectedEmployee.firstName} ${selectedEmployee.lastName} is currently employed with ${companyInfo.name} as a ${selectedEmployee.role} in our ${selectedEmployee.department} department.

${selectedEmployee.firstName} has been employed with our organization since ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} and is currently an active employee in good standing.

${customFields.includeJobDescription ? `\nJob Responsibilities:\n• Develop and maintain software applications\n• Collaborate with cross-functional teams\n• Participate in code reviews and technical discussions\n• Contribute to project planning and execution\n` : ''}

${customFields.includeCompensation ? `\nThis employment is on a full-time basis with standard company benefits including health insurance, paid time off, and retirement plans.\n` : ''}

${customFields.purpose ? `\nThis letter is being provided at the request of the employee for ${customFields.purpose}.\n` : ''}

If you require any additional information, please feel free to contact our Human Resources department at the above contact information.

Sincerely,

_____________________
Carol Williams
HR Manager
${companyInfo.name}`;
        break;

      case 'salary':
        letter = `${header}SALARY CERTIFICATE

This is to certify that ${selectedEmployee.firstName} ${selectedEmployee.lastName}, holding the position of ${selectedEmployee.role} in our ${selectedEmployee.department} department, is employed with ${companyInfo.name} since ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.

Current Compensation Details:
• Annual Base Salary: $85,000 USD
• Monthly Gross Salary: $7,083.33 USD
• Payment Frequency: Bi-weekly

${customFields.includeBenefits ? `\nAdditional Benefits:\n• Health Insurance (Medical, Dental, Vision)\n• Life Insurance\n• 401(k) Retirement Plan with company matching\n• Paid Time Off (${selectedEmployee.leaveBalances.vacation} days annually)\n• Professional Development Allowance\n` : ''}

This certificate is issued upon the request of the employee${customFields.purpose ? ` for ${customFields.purpose}` : ''}.

For verification of this information, please contact our HR department.

Sincerely,

_____________________
Carol Williams
HR Manager
${companyInfo.name}`;
        break;

      case 'experience':
        letter = `${header}EXPERIENCE CERTIFICATE

This is to certify that ${selectedEmployee.firstName} ${selectedEmployee.lastName} has been employed with ${companyInfo.name} from ${new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} to present as a ${selectedEmployee.role}.

During their tenure with our organization, ${selectedEmployee.firstName} has:

• Demonstrated excellent technical skills and professional competence
• Successfully completed multiple projects and deliverables
• Shown strong teamwork and collaboration abilities
• Maintained high standards of work quality and ethics
• Contributed significantly to team and organizational goals

${selectedEmployee.firstName} has been a valuable member of our team and we appreciate their contributions to our organization.

We wish them continued success in their professional endeavors.

Sincerely,

_____________________
Carol Williams
HR Manager
${companyInfo.name}`;
        break;

      case 'promotion':
        letter = `${header}PROMOTION LETTER

Dear ${selectedEmployee.firstName} ${selectedEmployee.lastName},

We are pleased to inform you that based on your outstanding performance and valuable contributions to ${companyInfo.name}, you have been promoted to the position of Senior ${selectedEmployee.role}, effective ${customFields.effectiveDate}.

Your new responsibilities will include:
• Leading technical initiatives and mentoring junior team members
• Contributing to strategic planning and decision-making
• Managing key client relationships and projects
• Driving innovation and process improvements

Your compensation package has been revised as follows:
• New Annual Salary: $105,000 USD
• Performance Bonus Eligibility: Up to 20% of base salary
• Additional Stock Options: 500 units

All other benefits and terms of employment remain unchanged.

We are confident that you will excel in your new role and continue to be a valuable asset to our organization.

Congratulations on this well-deserved promotion!

Sincerely,

_____________________
John Smith
CEO
${companyInfo.name}`;
        break;

      case 'confirmation':
        letter = `${header}CONFIRMATION OF EMPLOYMENT

Dear ${selectedEmployee.firstName} ${selectedEmployee.lastName},

We are pleased to confirm your employment with ${companyInfo.name} as a permanent ${selectedEmployee.role} in the ${selectedEmployee.department} department, effective ${customFields.effectiveDate}.

Having successfully completed your probationary period, we are happy to confirm you as a permanent member of our team. Your performance during the probation period has been satisfactory, and we believe you will continue to be a valuable contributor to our organization.

Terms of Employment:
• Position: ${selectedEmployee.role}
• Department: ${selectedEmployee.department}
• Employment Type: Full-time, Permanent
• Work Location: ${companyInfo.city}

Please acknowledge receipt of this letter by signing and returning a copy to the HR department.

We look forward to your continued association with ${companyInfo.name}.

Sincerely,

_____________________
Carol Williams
HR Manager
${companyInfo.name}`;
        break;

      case 'appreciation':
        letter = `${header}LETTER OF APPRECIATION

Dear ${selectedEmployee.firstName} ${selectedEmployee.lastName},

On behalf of ${companyInfo.name}, I would like to express our sincere appreciation for your exceptional performance and dedication to your role as ${selectedEmployee.role}.

Your recent contributions, particularly in the successful completion of the Q2 project deliverables, have been instrumental in achieving our departmental goals. Your technical expertise, problem-solving abilities, and collaborative approach have set a high standard for the team.

Specific achievements we would like to recognize:
• Successfully led the implementation of new features that improved system efficiency by 30%
• Mentored new team members, contributing to their rapid integration
• Consistently delivered high-quality work within tight deadlines
• Demonstrated initiative in identifying and resolving technical challenges

Your positive attitude and commitment to excellence have not gone unnoticed. You are a valued member of our team, and we are fortunate to have you as part of ${companyInfo.name}.

Thank you for your continued hard work and dedication.

Sincerely,

_____________________
Sarah Johnson
Department Head
${selectedEmployee.department}
${companyInfo.name}`;
        break;

      default:
        letter = 'Please select a letter type';
    }

    setGeneratedLetter(letter);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter).then(() => {
      setCopied(true);
      showMessage(t('letters.copied'), 'success');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letterType}_letter_${selectedEmployee?.firstName}_${selectedEmployee?.lastName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage('Letter downloaded successfully', 'success');
  };

  const handlePrint = () => {
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
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomFields(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('letters.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letter Configuration */}
        <div className="space-y-6">
          <Card title="Letter Configuration">
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
                  <p className="text-sm font-medium text-blue-800 mb-2">Employee Details:</p>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Name: {selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                    <p>• Position: {selectedEmployee?.role}</p>
                    <p>• Department: {selectedEmployee?.department}</p>
                    <p>• Hire Date: {selectedEmployee?.hireDate}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Additional Options">
            <div className="space-y-4">
              <Input
                label="Purpose (Optional)"
                name="purpose"
                value={customFields.purpose}
                onChange={handleInputChange}
                placeholder="e.g., Visa application, Bank loan"
              />

              <Input
                label="Addressed To (Optional)"
                name="addressedTo"
                value={customFields.addressedTo}
                onChange={handleInputChange}
                placeholder="e.g., Visa Office, Bank Manager"
              />

              {(letterType === 'promotion' || letterType === 'confirmation') && (
                <Input
                  label="Effective Date"
                  name="effectiveDate"
                  type="date"
                  value={customFields.effectiveDate}
                  onChange={handleInputChange}
                />
              )}

              {(letterType === 'employment' || letterType === 'salary') && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Include:</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="includeCompensation"
                        checked={customFields.includeCompensation}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Compensation Details</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="includeBenefits"
                        checked={customFields.includeBenefits}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Benefits Information</span>
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
                        <span className="text-sm text-gray-700">Job Description</span>
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
          <Card title="Generated Letter" className="h-full">
            {generatedLetter ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Letter ready for use
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="small"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : t('letters.copy')}
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
                  Select an employee and letter type to generate a letter
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Letter Templates Info */}
      <Card title="Available Letter Templates">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {letterTypes.map((type) => (
            <div key={type.value} className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">{type.label}</h4>
              <p className="text-sm text-gray-600">
                {type.value === 'employment' && 'Confirms current employment status and details'}
                {type.value === 'salary' && 'Provides salary and compensation information'}
                {type.value === 'experience' && 'Certifies work experience and contributions'}
                {type.value === 'promotion' && 'Official promotion announcement'}
                {type.value === 'confirmation' && 'Confirms permanent employment status'}
                {type.value === 'appreciation' && 'Recognizes exceptional performance'}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default HRLetters;