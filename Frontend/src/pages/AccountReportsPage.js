import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND;

const AccountReportsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/accounts`);
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedAccount) {
      alert('Please select an account');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reports/account`, {
        accountId: selectedAccount
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const formatReportData = (data) => {
    if (!data) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Account Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-2">Account Information</h4>
            <div className="space-y-2">
              <p><strong>Name:</strong> {data.account.firstName} {data.account.lastName}</p>
              <p><strong>Email:</strong> {data.account.email}</p>
              <p><strong>Role:</strong> {data.account.role}</p>
              <p><strong>UID:</strong> {data.account.uid}</p>
              <p><strong>Join Date:</strong> {new Date(data.account.joinDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-2">Activity Summary</h4>
            <div className="space-y-2">
              <p><strong>Total Activities:</strong> {data.summary.totalActivities}</p>
              <p><strong>Projects:</strong> {data.summary.projects}</p>
              <p><strong>Publications:</strong> {data.summary.publications}</p>
              <p><strong>Collaborations:</strong> {data.summary.collaborations}</p>
              <p><strong>Events:</strong> {data.summary.events}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-2">All Activities ({data.allActivities.length})</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.allActivities.map((activity, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{activity.type}</td>
                    <td className="px-4 py-2">{activity.title}</td>
                    <td className="px-4 py-2">{new Date(activity.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{activity.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Account Reports</h2>
        <p className="text-gray-600 mb-4">Generate detailed reports for individual accounts</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Account</h3>
        <div className="flex gap-4">
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="flex-1 p-2 border rounded-md"
          >
            <option value="">Select an account...</option>
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.firstName} {account.lastName} ({account.email}) - {account.role}
              </option>
            ))}
          </select>
          <button
            onClick={generateReport}
            disabled={loading || !selectedAccount}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {reportData && formatReportData(reportData)}
    </div>
  );
};

export default AccountReportsPage;
