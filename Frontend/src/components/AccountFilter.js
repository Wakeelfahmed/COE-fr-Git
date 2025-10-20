import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND;

const AccountFilter = ({ value, onChange, className = "border rounded px-2 py-1" }) => {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    console.log('AccountFilter: Component mounted, fetching accounts...');
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      console.log('AccountFilter: Fetching accounts from API...');
      const response = await axios.get(`${API_BASE_URL}/auth/accounts`);
      const accounts = response.data.accounts || [];
      console.log('AccountFilter: Accounts fetched:', accounts.length, 'accounts');
      setAccounts(accounts);
    } catch (error) {
      console.error('AccountFilter: Error fetching accounts:', error);
    }
  };

  console.log('AccountFilter: Rendering with value:', value, 'accounts:', accounts.length);

  return (
    <select
      name="accountFilter"
      value={value}
      onChange={onChange}
      className={className}
    >
      <option value="">All Accounts</option>
      {accounts.map((account) => (
        <option key={account._id} value={account._id}>
          {account.firstName} {account.lastName} ({account.email})
        </option>
      ))}
    </select>
  );
};

export default AccountFilter;
