import React, { useState, useEffect } from 'react';

const initialProjects = [
  {
    id: 1,
    projectTitle: 'Sample Project',
    supervisor: 'John Doe',
    rndTeam: ['Alice', 'Bob'],
    clientCompany: 'ACME Inc',
    dateOfContractSign: '2023-01-01',
    dateOfDeploymentAsPerContract: '2023-06-01',
    amountInPKRM: 1000000,
    advPaymentPercentage: 30,
    advPaymentAmount: 300000,
    dateOfReceivingAdvancePayment: '2023-01-15',
    actualDateOfDeployment: '2023-06-15',
    dateOfReceivingCompletePayment: '2023-07-15',
    remarks: 'Sample project for testing'
  },
];

const ProjectsView = () => {
  const [projects, setProjects] = useState(initialProjects);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    projectTitle: '',
    supervisor: '',
    rndTeam: '',
    clientCompany: '',
    dateOfContractSign: '',
    dateOfDeploymentAsPerContract: '',
    amountInPKRM: '',
    advPaymentPercentage: '',
    advPaymentAmount: '',
    dateOfReceivingAdvancePayment: '',
    actualDateOfDeployment: '',
    dateOfReceivingCompletePayment: '',
    remarks: ''
  });
  const [filterCriteria, setFilterCriteria] = useState({
    projectTitle: '',
    supervisor: '',
    clientCompany: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleNewProject = () => {
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectToAdd = {
      ...newProject,
      id: projects.length + 1,
      rndTeam: newProject.rndTeam.split(',').map(member => member.trim()),
      amountInPKRM: parseFloat(newProject.amountInPKRM),
      advPaymentPercentage: parseFloat(newProject.advPaymentPercentage),
      advPaymentAmount: parseFloat(newProject.advPaymentAmount)
    };
    setProjects(prev => [...prev, projectToAdd]);
    setShowModal(false);
    setNewProject({
      projectTitle: '',
      supervisor: '',
      rndTeam: '',
      clientCompany: '',
      dateOfContractSign: '',
      dateOfDeploymentAsPerContract: '',
      amountInPKRM: '',
      advPaymentPercentage: '',
      advPaymentAmount: '',
      dateOfReceivingAdvancePayment: '',
      actualDateOfDeployment: '',
      dateOfReceivingCompletePayment: '',
      remarks: ''
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({ ...prev, [name]: value }));
  };

  const filteredProjects = projects.filter(project => {
    return project.projectTitle.toLowerCase().includes(filterCriteria.projectTitle.toLowerCase()) &&
           project.supervisor.toLowerCase().includes(filterCriteria.supervisor.toLowerCase()) &&
           project.clientCompany.toLowerCase().includes(filterCriteria.clientCompany.toLowerCase()) &&
           (filterCriteria.dateFrom === '' || project.dateOfContractSign >= filterCriteria.dateFrom) &&
           (filterCriteria.dateTo === '' || project.dateOfContractSign <= filterCriteria.dateTo);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Industry/Commercial Projects</h2>
        <div>
          <button onClick={handleNewProject} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            New Project
          </button>
          <button 
            onClick={() => setFilterCriteria({ projectTitle: '', supervisor: '', clientCompany: '', dateFrom: '', dateTo: '' })} 
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        <input
          type="text"
          placeholder="Filter by Project Title"
          name="projectTitle"
          value={filterCriteria.projectTitle}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Filter by Supervisor"
          name="supervisor"
          value={filterCriteria.supervisor}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Filter by Client Company"
          name="clientCompany"
          value={filterCriteria.clientCompany}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          placeholder="From Date"
          name="dateFrom"
          value={filterCriteria.dateFrom}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          placeholder="To Date"
          name="dateTo"
          value={filterCriteria.dateTo}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R&D Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deployment Date (Contract)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (PKR M)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adv. Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Deployment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complete Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">{project.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.projectTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.supervisor}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.rndTeam.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.clientCompany}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfContractSign}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfDeploymentAsPerContract}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.amountInPKRM.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.advPaymentPercentage}%</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.advPaymentAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfReceivingAdvancePayment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.actualDateOfDeployment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.dateOfReceivingCompletePayment}</td>
                <td className="px-6 py-4 whitespace-nowrap">{project.remarks}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">New Project</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectTitle">
                  Project Title
                </label>
                <input
                  type="text"
                  id="projectTitle"
                  name="projectTitle"
                  value={newProject.projectTitle}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supervisor">
                  Supervisor
                </label>
                <input
                  type="text"
                  id="supervisor"
                  name="supervisor"
                  value={newProject.supervisor}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rndTeam">
                  R&D Team (comma-separated)
                </label>
                <input
                  type="text"
                  id="rndTeam"
                  name="rndTeam"
                  value={newProject.rndTeam}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientCompany">
                  Client Company
                </label>
                <input
                  type="text"
                  id="clientCompany"
                  name="clientCompany"
                  value={newProject.clientCompany}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfContractSign">
                  Date of Contract Sign
                </label>
                <input
                  type="date"
                  id="dateOfContractSign"
                  name="dateOfContractSign"
                  value={newProject.dateOfContractSign}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfDeploymentAsPerContract">
                  Date of Deployment (As Per Contract)
                </label>
                <input
                  type="date"
                  id="dateOfDeploymentAsPerContract"
                  name="dateOfDeploymentAsPerContract"
                  value={newProject.dateOfDeploymentAsPerContract}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amountInPKRM">
                  Amount in PKR M
                </label>
                <input
                  type="number"
                  id="amountInPKRM"
                  name="amountInPKRM"
                  value={newProject.amountInPKRM}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="advPaymentPercentage">
                  Advance Payment Percentage
                </label>
                <input
                  type="number"
                  id="advPaymentPercentage"
                  name="advPaymentPercentage"
                  value={newProject.advPaymentPercentage}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="advPaymentAmount">
                  Advance Payment Amount
                </label>
                <input
                  type="number"
                  id="advPaymentAmount"
                  name="advPaymentAmount"
                  value={newProject.advPaymentAmount}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfReceivingAdvancePayment">
                  Date of Receiving Advance Payment
                </label>
                <input
                  type="date"
                  id="dateOfReceivingAdvancePayment"
                  name="dateOfReceivingAdvancePayment"
                  value={newProject.dateOfReceivingAdvancePayment}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="actualDateOfDeployment">
                  Actual Date of Deployment
                </label>
                <input
                  type="date"
                  id="actualDateOfDeployment"
                  name="actualDateOfDeployment"
                  value={newProject.actualDateOfDeployment}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfReceivingCompletePayment">
                  Date of Receiving Complete Payment
                </label>
                <input
                  type="date"
                  id="dateOfReceivingCompletePayment"
                  name="dateOfReceivingCompletePayment"
                  value={newProject.dateOfReceivingCompletePayment}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="remarks">
                  Remarks
                </label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={newProject.remarks}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;