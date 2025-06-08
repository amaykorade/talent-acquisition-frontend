import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Edit2, 
  Eye, 
  Users, 
  Trash2, 
  Plus, 
  Power,
  PowerOff,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { jobService } from '../../services/jobService';
import { useAuthStore } from '../../store/authStore';

function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuthStore();
  const [updatingJobStatus, setUpdatingJobStatus] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsData = await jobService.getJobs();
      setJobs(jobsData);
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job post? This will also delete all associated applications.')) {
      return;
    }

    try {
      setDeletingJob(jobId);
      await jobService.deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError('Failed to delete job post');
    } finally {
      setDeletingJob(null);
    }
  };

  const handleJobStatusToggle = async (jobId, currentStatus) => {
    try {
      setUpdatingJobStatus(jobId);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await jobService.updateJobStatus(jobId, newStatus);
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (err) {
      setError('Failed to update job status');
    } finally {
      setUpdatingJobStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Posts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Total Applications: {jobs.reduce((sum, job) => sum + (job.applicants || 0), 0)} | 
            Shortlisted: {jobs.reduce((sum, job) => sum + (job.shortlisted || 0), 0)}
          </p>
        </div>
        <Link
          to="/dashboard/jobs/create"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Post
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm text-gray-500">{job.role}</p>
                    <p className="text-sm text-gray-500">
                      Applications: {job.applicants || 0} | Shortlisted: {job.shortlisted || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleJobStatusToggle(job.id, job.status)}
                      disabled={updatingJobStatus === job.id}
                      className={`text-gray-600 hover:text-gray-900 ${
                        job.status === 'active' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
                      }`}
                      title={job.status === 'active' ? 'Deactivate Job' : 'Activate Job'}
                    >
                      {updatingJobStatus === job.id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
                      ) : job.status === 'active' ? (
                        <Power className="h-5 w-5" />
                      ) : (
                        <PowerOff className="h-5 w-5" />
                      )}
                    </button>
                    <Link
                      to={`/dashboard/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/dashboard/jobs/${job.id}/candidates`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Candidates"
                    >
                      <Users className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/dashboard/jobs/edit/${job.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingJob === job.id}
                      className="text-red-600 hover:text-red-900"
                    >
                      {deletingJob === job.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                {job.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span className="text-sm">{job.type || 'Full-time'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new job post.
            </p>
            <div className="mt-6">
              <Link
                to="/dashboard/jobs/create"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobList;