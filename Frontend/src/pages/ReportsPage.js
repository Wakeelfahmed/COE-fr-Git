import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import { useUser } from '../context/UserContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND;

const ReportsView = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    fetchReports();
  }, [showOnlyMine]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports`, {
        params: { onlyMine: showOnlyMine }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      alert('Error fetching reports. Please try again.');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
  };

  const closeReportModal = () => {
    setSelectedReport(null);
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await axios.delete(`${API_BASE_URL}/reports/${reportId}`);
        fetchReports();
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('Failed to delete the report. Please try again.');
      }
    }
  };

  const renderTable = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return <p>No report data available</p>;
    }

    const headers = Object.keys(data[0]).filter(key => key !== '_id');

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {headers.map((header) => (
                <th key={header} className="py-2 px-4 border-b text-left font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {headers.map((header) => (
                  <td key={header} className="py-2 px-4 border-b">{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const downloadReport = () => {
    if (!selectedReport) return;

    const doc = new jsPDF('l', 'pt');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginX = 40;
    const marginY = 40;

    // Helper function to add wrapped text
    const addWrappedText = (text, y) => {
      const textLines = doc.splitTextToSize(text, pageWidth - 2 * marginX);
      doc.text(textLines, marginX, y);
      return y + (textLines.length * 5);
    };

    // Title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    let yPos = addWrappedText(selectedReport.title, marginY);

    // Report info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    yPos = addWrappedText(`Source Type: ${selectedReport.sourceType}`, yPos + 15);
    yPos = addWrappedText(`Created At: ${new Date(selectedReport.createdAt).toLocaleString()}`, yPos + 5);
    yPos = addWrappedText(`Created By: ${selectedReport.createdBy || 'N/A'}`, yPos + 5);
    yPos = addWrappedText(`Last Updated: ${new Date(selectedReport.updatedAt).toLocaleString()}`, yPos + 5);

    // Report data table
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    yPos = addWrappedText('Report Data:', yPos + 15);

    if (Array.isArray(selectedReport.reportData) && selectedReport.reportData.length > 0) {
      const headers = Object.keys(selectedReport.reportData[0]).filter(key => key !== '_id');
      const data = selectedReport.reportData.map(row => 
        headers.map(header => {
          const cellData = row[header];
          return cellData !== null && cellData !== undefined ? cellData.toString() : '';
        })
      );

      doc.autoTable({
        head: [headers],
        body: data,
        startY: yPos + 10,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: headers.reduce((acc, header, index) => {
          acc[index] = { cellWidth: 'auto' };
          return acc;
        }, {}),
        didDrawPage: (data) => {
          // Footer with page number
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber}`, marginX, pageHeight - 20);
        },
      });
    } else {
      yPos = addWrappedText('No report data available', yPos + 10);
    }

    // Save the PDF
    doc.save(`${selectedReport.title}.pdf`);
  };

  const prepareCSVData = () => {
    if (!selectedReport || !Array.isArray(selectedReport.reportData)) return [];
    
    const headers = Object.keys(selectedReport.reportData[0]).filter(key => key !== '_id');
    const csvData = [headers, ...selectedReport.reportData.map(row => headers.map(header => row[header]))];
    
    return csvData;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Reports</h2>
        {user?.role === 'director' && (
          <button
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
          >
            {showOnlyMine ? 'All Reports' : 'My Reports'}
          </button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left font-semibold">Title</th>
              <th className="py-2 px-4 border-b text-left font-semibold">Source Type</th>
              <th className="py-2 px-4 border-b text-left font-semibold">Created At</th>
              <th className="py-2 px-4 border-b text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{report.title}</td>
                <td className="py-2 px-4 border-b">{report.sourceType}</td>
                <td className="py-2 px-4 border-b">{new Date(report.createdAt).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleViewReport(report)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2 transition duration-300"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-start pt-10">
          <div className="relative bg-white w-3/4 max-w-4xl shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 border-b">
              <h3 className="text-xl font-semibold text-gray-800">{selectedReport.title}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Source Type</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.sourceType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.createdBy || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedReport.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">Report Data</h4>
                {renderTable(selectedReport.reportData)}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-100 border-t flex justify-end">
              <button
                onClick={downloadReport}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2 transition duration-300"
              >
                Download PDF
              </button>
              <CSVLink
                data={prepareCSVData()}
                filename={`${selectedReport.title}.csv`}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2 transition duration-300"
              >
                Download CSV
              </CSVLink>
              <button
                onClick={closeReportModal}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;