import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

export default function MyApplications() {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedApplications, setExpandedApplications] = useState({});

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('candidateId', '==', user?.uid)
      );
      const snapshot = await getDocs(applicationsQuery);
      const applicationsData = await Promise.all(
        snapshot.docs.map(async docSnapshot => {
          const data = docSnapshot.data();
          // Fetch job details using the correct method
          const jobDocRef = doc(db, 'jobs', data.jobId);
          const jobDoc = await getDoc(jobDocRef);
          const jobData = jobDoc.exists() ? jobDoc.data() : null;
          
          return {
            id: docSnapshot.id,
            ...data,
            job: jobData
          };
        })
      );
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (applicationId) => {
    setExpandedApplications(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <div className="text-sm text-gray-500">
          Total Applications: {applications.length}
        </div>
      </div>

      <div className="space-y-4">
        {applications.map(application => (
          <div key={application.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{application.job?.title}</h2>
                  <p className="text-sm text-gray-500">{application.job?.company}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                  <button
                    onClick={() => toggleExpand(application.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedApplications[application.id] ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Applied on {format(new Date(application.appliedAt), 'MMM dd, yyyy')}
              </div>

              {expandedApplications[application.id] && (
                <div className="mt-6 space-y-4 border-t pt-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Application Details</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center mt-1">
                          {getStatusIcon(application.status)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      {application.interviewDate && (
                        <div>
                          <p className="text-sm text-gray-500">Interview Schedule</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {format(new Date(application.interviewDate), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {application.feedback && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700">Feedback</h3>
                      <p className="mt-1 text-sm text-gray-600">{application.feedback}</p>
                    </div>
                  )}

                  {application.assignment && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-700">Technical Assignment</h3>
                      <p className="mt-1 text-sm text-blue-600">{application.assignment.details}</p>
                      <div className="mt-2">
                        <p className="text-sm text-blue-500">
                          Due: {format(new Date(application.assignment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    {application.resume && (
                      <a
                        href={application.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    )}
                    <a
                      href={`/jobs/${application.jobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job Post
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start applying to jobs to track your applications here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}