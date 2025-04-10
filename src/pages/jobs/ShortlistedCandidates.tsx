import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, FileText, Mail, Phone, Calendar } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { emailService } from '../../services/emailService';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  status: string;
  shortlistedAt: string;
  assignment?: {
    sent: boolean;
    dueDate?: string;
    details?: string;
  };
}

export default function ShortlistedCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [sendingAssignment, setSendingAssignment] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    details: '',
    dueDate: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchShortlistedCandidates();
  }, []);

  const fetchShortlistedCandidates = async () => {
    try {
      const shortlisted = await jobService.getShortlistedCandidates();
      setCandidates(shortlisted);
    } catch (err) {
      setError('Failed to fetch shortlisted candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      setSendingAssignment(true);
      await emailService.sendAssignmentEmail(
        selectedCandidate.email,
        selectedCandidate.jobTitle,
        assignmentData.details,
        assignmentData.dueDate
      );

      // Update candidate's assignment status
      await jobService.updateCandidateAssignment(selectedCandidate.id, {
        sent: true,
        dueDate: assignmentData.dueDate,
        details: assignmentData.details
      });

      // Update local state
      setCandidates(candidates.map(c => 
        c.id === selectedCandidate.id 
          ? { 
              ...c, 
              assignment: { 
                sent: true, 
                dueDate: assignmentData.dueDate, 
                details: assignmentData.details 
              } 
            } 
          : c
      ));

      setSelectedCandidate(null);
      setAssignmentData({
        details: '',
        dueDate: format(new Date().setDate(new Date().getDate() + 7), 'yyyy-MM-dd')
      });
    } catch (err) {
      setError('Failed to send assignment');
    } finally {
      setSendingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shortlisted Candidates</h1>
        <p className="text-gray-600 mt-2">
          Total shortlisted: {candidates.length}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shortlisted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.name}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {candidate.email}
                        </span>
                        <span className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {candidate.phone}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{candidate.jobTitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {format(new Date(candidate.shortlistedAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {candidate.assignment?.sent ? (
                      <div className="text-sm">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Sent
                        </span>
                        <div className="text-gray-500 mt-1">
                          Due: {format(new Date(candidate.assignment.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Not Sent
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {!candidate.assignment?.sent && (
                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Assignment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Send Assignment
                </h2>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSendAssignment} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Details
                  </label>
                  <textarea
                    value={assignmentData.details}
                    onChange={(e) => setAssignmentData({ ...assignmentData, details: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter assignment description, requirements, and submission instructions..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assignmentData.dueDate}
                    onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingAssignment}
                    className="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sendingAssignment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Assignment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}