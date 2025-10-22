import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';

axios.defaults.withCredentials = true;
const API_BASE_URL = process.env.REACT_APP_BACKEND;

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableAnalytics, setTableAnalytics] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);

  const { user } = useUser();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/analytics/data-usage`);
      setAnalytics(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTableAnalytics = async (tableName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/data-usage/table/${tableName}`);
      setTableAnalytics(response.data);
      setSelectedTable(tableName);
      setUserAnalytics(null);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error fetching table analytics:', error);
      setError('Failed to load table analytics.');
    }
  };

  const fetchUserAnalytics = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/data-usage/user/${userId}`);
      setUserAnalytics(response.data);
      setSelectedUser(userId);
      setTableAnalytics(null);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      setError('Failed to load user analytics.');
    }
  };

  const formatSize = (sizeInKB) => {
    if (sizeInKB < 1) {
      return `${Math.round(sizeInKB * 1024)} bytes`;
    }
    return `${sizeInKB.toFixed(2)} KB`;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'center Head': return 'bg-blue-100 text-blue-800';
      case 'wing head': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-lg">No analytics data available.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Usage Analytics</h1>
        <p className="text-gray-600">Comprehensive overview of data usage across all accounts and tables</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRecords.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">💾</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Data Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatSize(analytics.totalDataSize)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Record Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatSize(analytics.averageRecordSize)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Table Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analytics.tableStats).map(([tableName, stats]) => (
                <tr key={tableName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{stats.tableName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {stats.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatSize(stats.totalSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatSize(stats.averageSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => fetchTableAnalytics(tableName)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Statistics */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Data Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.userStats.map((userStat) => (
                <tr key={userStat.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{userStat.userName}</div>
                        <div className="text-sm text-gray-500">{userStat.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(userStat.role)}`}>
                      {userStat.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {userStat.totalRecords.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {formatSize(userStat.totalSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => fetchUserAnalytics(userStat.userId)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed View Modals */}
      {tableAnalytics && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{tableAnalytics.tableName} Analytics</h3>
              <button
                onClick={() => { setTableAnalytics(null); setSelectedTable(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{tableAnalytics.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Size</p>
                <p className="text-2xl font-bold text-green-900">{formatSize(tableAnalytics.totalSize)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Average Size</p>
                <p className="text-2xl font-bold text-purple-900">{formatSize(tableAnalytics.averageSize)}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium mb-3">Per-User Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Records</th>
                      <th className="px-4 py-2">Size</th>
                      <th className="px-4 py-2">Avg Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(tableAnalytics.userBreakdown).map(([userId, userData]) => (
                      <tr key={userId} className="border-t">
                        <td className="px-4 py-2 font-medium">{userData.userName}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(userData.role)}`}>
                            {userData.role}
                          </span>
                        </td>
                        <td className="px-4 py-2">{userData.count}</td>
                        <td className="px-4 py-2">{formatSize(userData.totalSize)}</td>
                        <td className="px-4 py-2">{formatSize(userData.averageSize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {userAnalytics && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{userAnalytics.userName} - Data Usage</h3>
              <button
                onClick={() => { setUserAnalytics(null); setSelectedUser(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{userAnalytics.totalRecords.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Size</p>
                <p className="text-2xl font-bold text-green-900">{formatSize(userAnalytics.totalSize)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Role</p>
                <p className="text-lg font-bold text-purple-900">{userAnalytics.role}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium mb-3">Table Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                      <th className="px-4 py-2">Table</th>
                      <th className="px-4 py-2">Records</th>
                      <th className="px-4 py-2">Size</th>
                      <th className="px-4 py-2">Avg Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(userAnalytics.tableBreakdown).map(([tableName, tableData]) => (
                      <tr key={tableName} className="border-t">
                        <td className="px-4 py-2 font-medium">
                          {tableData.tableName}
                          {tableData.note && <div className="text-xs text-gray-500 italic">{tableData.note}</div>}
                        </td>
                        <td className="px-4 py-2">{tableData.count}</td>
                        <td className="px-4 py-2">{formatSize(tableData.totalSize)}</td>
                        <td className="px-4 py-2">{formatSize(tableData.averageSize)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
