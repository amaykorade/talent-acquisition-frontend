import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

export default function JobCandidates() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId]);

  const fetchJobAndCandidates = async () => {
    try {
      // Fetch job details
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (!jobDoc.exists()) {
        setError('Job not found');
        return;
      }
      setJob({ id: jobDoc.id, ...jobDoc.data() });

      // Fetch applications for this job
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationsData = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCandidates(applicationsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch job and candidates data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'shortlisted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'interview':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Link
          to="/dashboard/jobs"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{job?.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Total Applications: {candidates.length}
        </p>
      </div>

      <div className="space-y-4">
        {candidates.map(candidate => (
          <div key={candidate.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{candidate.name}</h2>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2" />
                        {candidate.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Applied on {candidate.appliedAt ? format(new Date(candidate.appliedAt.seconds ? candidate.appliedAt.seconds * 1000 : candidate.appliedAt), 'MMM dd, yyyy') : 'Date not available'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                  <button
                    onClick={() => setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedCandidate === candidate.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedCandidate === candidate.id && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Education</h3>
                    <p className="mt-1 text-sm text-gray-600">{candidate.education}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Experience</h3>
                    <p className="mt-1 text-sm text-gray-600">{candidate.experience}</p>
                  </div>

                  {candidate.skills && candidate.skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Skills</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill.name} - {skill.rating}/5
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.coverLetter && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Cover Letter</h3>
                      <p className="mt-1 text-sm text-gray-600">{candidate.coverLetter}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    {candidate.resume && (
                      <a
                        href={candidate.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              This job posting hasn't received any applications yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 