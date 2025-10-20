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

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedActivities = React.useMemo(() => {
    if (!reportData?.allActivities) return [];

    let sortableItems = [...reportData.allActivities];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (sortConfig.key === 'date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else {
          // Convert to string for consistent comparison
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [reportData?.allActivities, sortConfig]);

  const getSortIndicator = (columnName) => {
    if (sortConfig.key !== columnName) {
      return ' ↕️'; // Both arrows when not sorted
    }
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const formatReportData = (data, sortedActivities) => {
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
              <p><strong>Patents:</strong> {data.summary.patents}</p>
              <p><strong>Funded Projects:</strong> {data.summary.fundings}</p>
              <p><strong>Funding Proposals:</strong> {data.summary.fundingProposals}</p>
              <p><strong>Achievements:</strong> {data.summary.achievements}</p>
              <p><strong>Trainings Conducted:</strong> {data.summary.trainingsConducted}</p>
              <p><strong>Internships:</strong> {data.summary.internships}</p>
              <p><strong>Talks/Trainings Attended:</strong> {data.summary.talkTrainingConference}</p>
              <p><strong>Competitions:</strong> {data.summary.competitions}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-2">All Activities ({sortedActivities.length})</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    Type{getSortIndicator('type')}
                  </th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    Title{getSortIndicator('title')}
                  </th>
                  <th className="px-4 py-2 text-left">Details</th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date{getSortIndicator('date')}
                  </th>
                  <th
                    className="px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status{getSortIndicator('status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedActivities.map((activity, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{activity.type}</td>
                    <td className="px-4 py-2">{activity.title || 'N/A'}</td>
                    <td className="px-4 py-2">
                      {(() => {
                        const details = [];
                        if (activity.type === 'Industry/Commercial Project' && activity.clientCompany) details.push(`Client: ${activity.clientCompany}`);
                        if (activity.type === 'Publication' && activity.publicationType) details.push(`Type: ${activity.publicationType}`);
                        if (activity.type === 'Collaboration' && activity.collaboratingInstitute) details.push(`Institute: ${activity.collaboratingInstitute}`);
                        if (activity.type === 'Patent' && activity.patentOrg) details.push(`Organization: ${activity.patentOrg}`);
                        if (activity.type === 'Event' && activity.organizer) details.push(`Organizer: ${activity.organizer}`);
                        if (activity.type === 'Funding' && activity.fundingAgency) details.push(`Agency: ${activity.fundingAgency}`);
                        if (activity.type === 'Funding Proposal' && activity.fundingAgency) details.push(`Team: ${activity.fundingAgency}`);
                        if (activity.type === 'Achievement' && activity.organizer) details.push(`Organizer: ${activity.organizer}`);
                        if (activity.type === 'Training Conducted' && activity.resourcePersons) details.push(`Resource: ${activity.resourcePersons}`);
                        if (activity.type === 'Internship' && activity.centerName) details.push(`Center: ${activity.centerName}`);
                        if (activity.type === 'TalkTrainingConference' && activity.resourcePerson) details.push(`Resource: ${activity.resourcePerson}`);
                        if (activity.type === 'Competition' && activity.organizer) details.push(`Organizer: ${activity.organizer}`);
                        return details.length > 0 ? details.join(', ') : 'N/A';
                      })()}
                    </td>
                    <td className="px-4 py-2">{activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-2">{activity.status || 'N/A'}</td>
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

      {reportData && formatReportData(reportData, sortedActivities)}
    </div>
  );
};

export default AccountReportsPage;
