// src/components/Table.js
import React from 'react';

const Table = ({ data, schema, onEdit, onDelete }) => {
  const headers = Object.keys(schema);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            {headers.map((header) => (
              <th key={header} className="py-3 px-6 text-left">{header}</th>
            ))}
            <th className="py-3 px-6 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {data.map((item, index) => (
            <tr key={index} className="border-b border-gray-200 hover:bg-gray-100">
              {headers.map((header) => (
                <td key={header} className="py-3 px-6 text-left whitespace-nowrap">
                  {item[header].toString()}
                </td>
              ))}
              <td className="py-3 px-6 text-center">
                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

