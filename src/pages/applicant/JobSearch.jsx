import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  ChevronDown,
  ChevronUp,
  Filter,
  XCircle,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { jobService } from '../../services/jobService';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    experience: ''
  });
  const [expandedJob, setExpandedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const { user } = useAuthStore();
  const [alertMessage, setAlertMessage] = useState(null);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    education: '',
    experience: '',
    resume: '',
    coverLetter: '',
    skills: []
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(jobsQuery);
      const jobsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    if (!user) {
      setAlertMessage({
        type: 'error',
        text: 'Please sign in to apply for jobs'
      });
      return;
    }
    setSelectedJob(job);
    setApplying(true);
    setApplicationData({
      ...applicationData,
      name: user.displayName || '',
      email: user.email || ''
    });
  };

  const addSkill = () => {
    setApplicationData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', rating: 3 }]
    }));
  };

  const removeSkill = (index) => {
    setApplicationData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index, field, value) => {
    setApplicationData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJob || !user) return;

    if (applicationData.skills.length === 0) {
      setAlertMessage({
        type: 'error',
        text: 'Please add at least one skill'
      });
      return;
    }

    try {
      const result = await jobService.applyToJob(selectedJob.id, applicationData);
      setApplying(false);
      setSelectedJob(null);
      setApplicationData({
        name: '',
        email: '',
        phone: '',
        education: '',
        experience: '',
        resume: '',
        coverLetter: '',
        skills: []
      });
      setAlertMessage({
        type: 'success',
        text: result.message
      });

      setJobs(jobs.map(job => 
        job.id === selectedJob.id 
          ? { ...job, applicants: job.applicants + 1 }
          : job
      ));

      setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to submit application'
      });
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !filters.location || job.location === filters.location;
    const matchesType = !filters.type || job.type === filters.type;
    const matchesExperience = !filters.experience || job.experience === filters.experience;

    return matchesSearch && matchesLocation && matchesType && matchesExperience;
  });

  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  const types = [...new Set(jobs.map(job => job.type).filter(Boolean))];
  const experiences = [...new Set(jobs.map(job => job.experience).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alertMessage && (
        <div className={`p-4 rounded-md ${
          alertMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {alertMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            {alertMessage.text}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jobs by title or keywords"
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.experience}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Experience Levels</option>
              {experiences.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {job.company}
                    </div>
                    {job.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {job.applicants} applicants
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expandedJob === job.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              {expandedJob === job.id && (
                <div className="mt-6 border-t pt-6">
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-medium text-gray-900">Job Description</h3>
                    <p className="mt-2 text-gray-600">{job.description}</p>

                    <h3 className="text-lg font-medium text-gray-900 mt-6">Requirements</h3>
                    <p className="mt-2 text-gray-600">{job.requirements}</p>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => handleApply(job)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters to find more opportunities.
            </p>
          </div>
        )}
      </div>

      {/* Application Modal */}
      {applying && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Apply for {selectedJob.title}
                </h2>
                <button
                  onClick={() => {
                    setApplying(false);
                    setSelectedJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitApplication} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={applicationData.name}
                    onChange={(e) => setApplicationData({ ...applicationData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <textarea
                    value={applicationData.education}
                    onChange={(e) => setApplicationData({ ...applicationData, education: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="List your educational qualifications"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData({ ...applicationData, experience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Describe your relevant work experience"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Skills & Proficiency
                    </label>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Skill
                    </button>
                  </div>
                  <div className="space-y-3">
                    {applicationData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => updateSkill(index, 'name', e.target.value)}
                          placeholder="Skill name (e.g., JavaScript, React)"
                          className="flex-1 px-3 py-2 border rounded-md"
                          required
                        />
                        <select
                          value={skill.rating}
                          onChange={(e) => updateSkill(index, 'rating', parseInt(e.target.value))}
                          className="w-24 px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="1">⭐ 1/5</option>
                          <option value="2">⭐⭐ 2/5</option>
                          <option value="3">⭐⭐⭐ 3/5</option>
                          <option value="4">⭐⭐⭐⭐ 4/5</option>
                          <option value="5">⭐⭐⭐⭐⭐ 5/5</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {applicationData.skills.length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        Add your technical skills and rate your proficiency in each
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume Link
                  </label>
                  <input
                    type="url"
                    value={applicationData.resume}
                    onChange={(e) => setApplicationData({ ...applicationData, resume: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter
                  </label>
                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={5}
                    placeholder="Why are you interested in this position?"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setApplying(false);
                      setSelectedJob(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Submit Application
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