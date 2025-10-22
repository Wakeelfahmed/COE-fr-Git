import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND;

const AccountReportsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [detailedReportData, setDetailedReportData] = useState(null);

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
      const response = await axios.get(`${API_BASE_URL}/auth/account-report/${selectedAccount}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const generateDetailedReport = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/account-report/${selectedAccount}?detailed=true`);
      setDetailedReportData(response.data);
    } catch (error) {
      console.error('Error generating detailed report:', error);
      alert('Error generating detailed report. Please try again.');
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

  const formatDetailedReportData = (data) => {
    if (!data) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-bold mb-4">Detailed Account Report</h3>

        {/* Projects Table */}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Projects ({data.projects.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Start Date</th>
                    <th className="px-4 py-2 text-left">End Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Team Members</th>
                    <th className="px-4 py-2 text-left">Budget</th>
                    <th className="px-4 py-2 text-left">Funding Agency</th>
                    <th className="px-4 py-2 text-left">Project Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((project, index) => (
                    <tr key={project._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{project.title}</td>
                      <td className="px-4 py-2">{project.description}</td>
                      <td className="px-4 py-2">{new Date(project.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-2">{project.status}</td>
                      <td className="px-4 py-2">{project.teamMembers}</td>
                      <td className="px-4 py-2">{project.budget}</td>
                      <td className="px-4 py-2">{project.fundingAgency}</td>
                      <td className="px-4 py-2">{project.projectType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Publications Table */}
        {data.publications && data.publications.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Publications ({data.publications.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Authors</th>
                    <th className="px-4 py-2 text-left">Journal/Conference</th>
                    <th className="px-4 py-2 text-left">Publication Date</th>
                    <th className="px-4 py-2 text-left">DOI</th>
                    <th className="px-4 py-2 text-left">Publication Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.publications.map((pub, index) => (
                    <tr key={pub._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{pub.title}</td>
                      <td className="px-4 py-2">{pub.authors}</td>
                      <td className="px-4 py-2">{pub.journalConference}</td>
                      <td className="px-4 py-2">{new Date(pub.publicationDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{pub.doi}</td>
                      <td className="px-4 py-2">{pub.publicationType}</td>
                      <td className="px-4 py-2">{pub.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Table */}
        {data.events && data.events.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Events ({data.events.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Activity</th>
                    <th className="px-4 py-2 text-left">Organizer</th>
                    <th className="px-4 py-2 text-left">Resource Person</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Participants</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event, index) => (
                    <tr key={event._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{event.activity}</td>
                      <td className="px-4 py-2">{event.organizer}</td>
                      <td className="px-4 py-2">{event.resourcePerson}</td>
                      <td className="px-4 py-2">{event.role === 'other' ? event.otherRole : event.role}</td>
                      <td className="px-4 py-2">{event.type}</td>
                      <td className="px-4 py-2">{event.participantsOfEvent}</td>
                      <td className="px-4 py-2">{new Date(event.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Collaborations Table */}
        {data.collaborations && data.collaborations.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Collaborations ({data.collaborations.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Member of CoE</th>
                    <th className="px-4 py-2 text-left">Collaborating Institute</th>
                    <th className="px-4 py-2 text-left">Duration Start</th>
                    <th className="px-4 py-2 text-left">Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.collaborations.map((collab, index) => (
                    <tr key={collab._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{collab.memberOfCoE || 'N/A'}</td>
                      <td className="px-4 py-2">{collab.foreignCollaboratingInstitute}</td>
                      <td className="px-4 py-2">{collab.durationStart ? new Date(collab.durationStart).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-2">{collab.currentStatus || 'Active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patents Table */}
        {data.patents && data.patents.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Patents ({data.patents.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Patent Organization</th>
                    <th className="px-4 py-2 text-left">Date of Submission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.patents.map((patent, index) => (
                    <tr key={patent._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{patent.title}</td>
                      <td className="px-4 py-2">{patent.patentOrg}</td>
                      <td className="px-4 py-2">{new Date(patent.dateOfSubmission).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fundings Table */}
        {data.fundings && data.fundings.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Funded Projects ({data.fundings.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Project Title</th>
                    <th className="px-4 py-2 text-left">Funding Source</th>
                    <th className="px-4 py-2 text-left">Date of Submission</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fundings.map((funding, index) => (
                    <tr key={funding._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{funding.projectTitle || 'N/A'}</td>
                      <td className="px-4 py-2">{funding.fundingSource}</td>
                      <td className="px-4 py-2">{new Date(funding.dateOfSubmission).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Funding Proposals Table */}
        {data.fundingProposals && data.fundingProposals.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Funding Proposals ({data.fundingProposals.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Project Title</th>
                    <th className="px-4 py-2 text-left">Team</th>
                    <th className="px-4 py-2 text-left">Date of Submission</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fundingProposals.map((proposal, index) => (
                    <tr key={proposal._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{proposal.projectTitle}</td>
                      <td className="px-4 py-2">{proposal.team}</td>
                      <td className="px-4 py-2">{new Date(proposal.dateOfSubmission).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{proposal.status || 'Submitted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Achievements Table */}
        {data.achievements && data.achievements.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Achievements ({data.achievements.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Event</th>
                    <th className="px-4 py-2 text-left">Organizer</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.achievements.map((achievement, index) => (
                    <tr key={achievement._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{achievement.event}</td>
                      <td className="px-4 py-2">{achievement.organizer}</td>
                      <td className="px-4 py-2">{new Date(achievement.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trainings Conducted Table */}
        {data.trainingsConducted && data.trainingsConducted.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Trainings Conducted ({data.trainingsConducted.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Organizer</th>
                    <th className="px-4 py-2 text-left">Resource Persons</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trainingsConducted.map((training, index) => (
                    <tr key={training._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{training.organizer}</td>
                      <td className="px-4 py-2">{training.resourcePersons}</td>
                      <td className="px-4 py-2">{new Date(training.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Internships Table */}
        {data.internships && data.internships.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Internships ({data.internships.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Applicant Name</th>
                    <th className="px-4 py-2 text-left">Center Name</th>
                    <th className="px-4 py-2 text-left">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {data.internships.map((internship, index) => (
                    <tr key={internship._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{internship.applicantName}</td>
                      <td className="px-4 py-2">{internship.centerName}</td>
                      <td className="px-4 py-2">{internship.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Talks/Trainings Table */}
        {data.talkTrainings && data.talkTrainings.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Talks/Trainings Attended ({data.talkTrainings.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Resource Person</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.talkTrainings.map((talk, index) => (
                    <tr key={talk._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{talk.title}</td>
                      <td className="px-4 py-2">{talk.resourcePerson}</td>
                      <td className="px-4 py-2">{new Date(talk.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Competitions Table */}
        {data.competitions && data.competitions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Competitions ({data.competitions.length})</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Organizer</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.competitions.map((competition, index) => (
                    <tr key={competition._id} className="border-t">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{competition.title}</td>
                      <td className="px-4 py-2">{competition.organizer}</td>
                      <td className="px-4 py-2">{new Date(competition.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
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
          <button
            onClick={generateDetailedReport}
            disabled={loading || !selectedAccount}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Generating...' : 'Generate Detailed Report'}
          </button>
        </div>
      </div>

      {reportData && formatReportData(reportData, sortedActivities)}

      {detailedReportData && formatDetailedReportData(detailedReportData)}
    </div>
  );
};

export default AccountReportsPage;
