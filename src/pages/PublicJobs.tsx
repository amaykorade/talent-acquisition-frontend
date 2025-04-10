import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Users, Calendar, MapPin, Briefcase, XCircle, CheckCircle, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { jobService } from '../services/jobService';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Job {
  id: string;
  title: string;
  role: string;
  description: string;
  requirements: string;
  location?: string;
  createdAt: string;
  views: number;
  status: string;
  applicants: number;
}

interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}

interface Skill {
  name: string;
  rating: number;
}

interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  resume: string;
  coverLetter: string;
  skills: Skill[];
}

function PublicJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null);
  const [applicationData, setApplicationData] = useState<ApplicationForm>({
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
      const jobsData = await jobService.getJobs();
      const activeJobs = jobsData.filter(job => job.status === 'active');
      setJobs(activeJobs);
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'applicantProfiles', userId));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        
        setApplicationData({
          name: profileData.fullName || user?.displayName || '',
          email: user?.email || '',
          phone: profileData.phone || '',
          education: profileData.education || '',
          experience: profileData.experience || '',
          resume: profileData.resumeUrl || '',
          coverLetter: '',
          skills: profileData.skills?.map((skill: any) => ({
            name: skill.name,
            rating: parseInt(skill.rating)
          })) || []
        });
      } else {
        setApplicationData(prev => ({
          ...prev,
          name: user?.displayName || '',
          email: user?.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAlertMessage({
        type: 'error',
        text: 'Failed to load profile data. Please fill in the form manually.'
      });
    }
  };

  const handleApply = async (job: Job) => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${job.id}` } });
      return;
    }

    try {
      const hasApplied = await jobService.checkExistingApplication(job.id, user.uid);
      if (hasApplied) {
        setAlertMessage({
          type: 'error',
          text: 'You have already applied for this position'
        });
        return;
      }

      setSelectedJob(job);
      setApplying(true);
      await fetchUserProfile(user.uid);
    } catch (error) {
      console.error('Error checking application:', error);
      setAlertMessage({
        type: 'error',
        text: 'Error checking application status. Please try again.'
      });
    }
  };

  const addSkill = () => {
    setApplicationData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', rating: 3 }]
    }));
  };

  const removeSkill = (index: number) => {
    setApplicationData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index: number, field: 'name' | 'rating', value: string | number) => {
    setApplicationData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const submitApplication = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to submit application'
      });
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Positions</h1>
          <p className="text-lg text-gray-600">Find your next opportunity and join our team</p>
        </div>

        {alertMessage && (
          <div className={`mb-6 p-4 rounded-md ${
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>{job.role}</span>
                  </div>
                  {job.location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      <span>{job.views}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{job.applicants} applied</span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm mb-6">
                  <h3 className="text-gray-900 font-medium mb-2">Requirements:</h3>
                  <p className="text-gray-600">{job.requirements}</p>
                </div>

                <button
                  onClick={() => handleApply(job)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
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
    </div>
  );
}

export default PublicJobs;