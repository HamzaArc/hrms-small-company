// hrms-frontend/src/components/pages/LeaveManagement.js
import React, { useEffect, useMemo, useState } from 'react';
import { useHRMS } from '../../contexts/HRMSContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Check, X } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const LeaveManagement = () => {
  const { 
    leaveRequests, 
    fetchLeaveRequests, 
    setCurrentPage, 
    user, 
    putData,
    showMessage,
    employees // NEW: Need employees to get their leave balances and policies
  } = useHRMS();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      await fetchLeaveRequests();
      // fetchEmployees is called globally in HRMSContext, so it should be available
      setIsLoading(false);
    };
    if (user) {
      loadRequests();
    }
  }, [user, fetchLeaveRequests]);

  const handleUpdateRequestStatus = async (id, status) => {
    // Show a confirmation dialog for rejection
    if (status === 'Rejected') {
        showMessage(t('leave.confirmReject'), 'warning', [ // NEW translation key
            {
                label: t('common.yes'),
                onClick: async () => {
                    const result = await putData(
                        `/leave-requests/${id}/status`,
                        { status },
                        t('leave.requestRejectedSuccess'), // NEW translation key
                        t('leave.updateError')
                    );
                    if (result) {
                        await fetchLeaveRequests();
                    } else {
                        showMessage(t('leave.updateError'), 'error'); // Generic error
                    }
                },
                primary: true
            },
            { label: t('common.no'), onClick: () => {} }
        ]);
    } else { // For approval, proceed directly
        const result = await putData(
            `/leave-requests/${id}/status`,
            { status },
            t('leave.requestApprovedSuccess'), // NEW translation key
            t('leave.updateError')
        );

        if (result) {
            await fetchLeaveRequests();
        } else {
            showMessage(t('leave.updateError'), 'error');
        }
    }
  };
  
  const userIsAdmin = useMemo(() => user?.role === 'admin', [user]);

  const requestsToShow = useMemo(() => {
    if (userIsAdmin) {
      return leaveRequests;
    }
    return leaveRequests ? leaveRequests.filter(req => req.employeeId === user?.employeeId) : [];
  }, [leaveRequests, userIsAdmin, user?.employeeId]);

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('leave.title')}</h1>
        <Button onClick={() => setCurrentPage('leaveRequest')} className="mt-4 sm:mt-0 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          <span>{t('leave.requestNew')}</span>
        </Button>
      </div>

      {/* NEW: Employee Leave Balances Overview (for HR/Admin) */}
      {userIsAdmin && (
        <Card title={t('leave.allEmployeeBalances')}> {/* NEW translation key */}
          {isLoading ? (
            <p className="text-center">{t('common.loading')}</p>
          ) : employees.length === 0 ? (
            <p className="text-center text-gray-500">{t('employees.noFound')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('leave.employee')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('leave.policy')}</th> {/* NEW translation key */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('leave.balances')} ({t('common.days')}) {/* NEW translation key */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.leavePolicy?.name || t('leave.noPolicyAssigned')} {/* NEW translation key */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Object.entries(employee.leaveBalances || {}).map(([type, balance]) => (
                          <div key={type} className="flex justify-between">
                            <span>{type}:</span>
                            <span className="font-bold">{balance}</span>
                          </div>
                        ))}
                        {Object.keys(employee.leaveBalances || {}).length === 0 && t('leave.noBalances')} {/* NEW translation key */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}


      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {userIsAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('leave.employee')}</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('leave.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('leave.startDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">{t('leave.endDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('leave.status')}
                </th>
                {userIsAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={userIsAdmin ? 6 : 4} className="text-center py-4">{t('common.loading')}</td></tr>
              ) : requestsToShow.length === 0 ? (
                <tr><td colSpan={userIsAdmin ? 6 : 4} className="text-center py-4 text-gray-500">No leave requests found.</td></tr>
              ) : (
                requestsToShow.map((request) => (
                  <tr key={request.id}>
                    {userIsAdmin && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.employee?.firstName} {request.employee?.lastName}</td>}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.type} {/* Display actual type name from request */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-sm text-gray-500">{new Date(request.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-sm text-gray-500">{new Date(request.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChip(request.status)}`}>{t(`leave.${request.status.toLowerCase()}`)}</span></td>
                    {userIsAdmin && request.status === 'Pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button onClick={() => handleUpdateRequestStatus(request.id, 'Approved')} size="small" variant="success" className="!p-2">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleUpdateRequestStatus(request.id, 'Rejected')} size="small" variant="danger" className="!p-2">
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                    {userIsAdmin && request.status !== 'Pending' && <td className="px-6 py-4"></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaveManagement;