import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserCog,
  Briefcase,
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  GraduationCap,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { jobService } from '../../services/jobService';
import { emailService } from '../../services/emailService';
import { geminiService } from '../../services/geminiService';

const stages = [
  { id: 'applied', label: 'Applied', icon: Users, color: 'blue' },
  { id: 'shortlisted', label: 'Shortlisted', icon: UserCheck, color: 'green' },
  { id: 'interview', label: 'Interview', icon: UserCog, color: 'purple' },
  { id: 'offered', label: 'Offered', icon: Briefcase, color: 'orange' }
];

function CandidateCard({ candidate, job, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [assignment, setAssignment] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCustomAssignment, setUseCustomAssignment] = useState(true);

  const generateAssignment = async () => {
    try {
      setIsGenerating(true);
      setMessage(null);

      const generatedAssignment = await geminiService.generateAssignment(
        candidate.skills,
        job.title,
        job.requirements
      );

      const formattedAssignment = `
${generatedAssignment.title}

${generatedAssignment.description}

Requirements:
${generatedAssignment.requirements.map(req => `- ${req}`).join('\n')}

Evaluation Criteria:
${generatedAssignment.evaluation_criteria.map(criteria => `- ${criteria}`).join('\n')}

Estimated Time: ${generatedAssignment.estimated_time}
Difficulty Level: ${generatedAssignment.difficulty_level}

Please submit your solution through the candidate portal.
`;

      setAssignment(formattedAssignment);
      setUseCustomAssignment(false);
    } catch (err) {
      console.error('Error generating assignment:', err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to generate assignment. Please try again or use custom assignment.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      setSending(true);
      
      if (newStatus === 'shortlisted') {
        if (!assignment.trim()) {
          throw new Error('Please provide assignment details before shortlisting');
        }
      }

      const result = await onStatusChange(candidateId, newStatus, assignment);
      
      setMessage({
        type: 'success',
        text: result.message
      });

      setAssignment('');
      
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 border-l-4 ${
      candidate.status === 'shortlisted' ? 'border-green-500' :
      candidate.status === 'interview' ? 'border-purple-500' :
      candidate.status === 'offered' ? 'border-orange-500' :
      'border-blue-500'
    }`}>
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
            <span className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {candidate.email}
            </span>
            <span className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {candidate.phone}
            </span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Applied {format(new Date(candidate.appliedAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </h4>
            <p className="mt-1 text-sm text-gray-600">{candidate.education}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Experience
            </h4>
            <p className="mt-1 text-sm text-gray-600">{candidate.experience}</p>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Skills & Proficiency</h4>
              <div className="grid grid-cols-2 gap-2">
                {candidate.skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{skill.name}:</span>
                    <span className="text-yellow-500">
                      {'★'.repeat(skill.rating)}{'☆'.repeat(5 - skill.rating)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Cover Letter
            </h4>
            <p className="mt-1 text-sm text-gray-600">{candidate.coverLetter}</p>
          </div>

          {candidate.status === 'pending' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Technical Assignment
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setUseCustomAssignment(true)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        useCustomAssignment
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Custom
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomAssignment(false);
                        generateAssignment();
                      }}
                      disabled={isGenerating}
                      className={`px-3 py-1 text-sm rounded-md ${
                        !useCustomAssignment
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {isGenerating ? 'Generating...' : 'AI Generated'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={assignment}
                  onChange={(e) => setAssignment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder={useCustomAssignment ? "Enter custom assignment..." : "Click 'AI Generated' to create an assignment based on candidate's skills..."}
                  readOnly={isGenerating}
                />
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2">
                <button
                  onClick={() => handleStatusChange(candidate.id, 'rejected')}
                  disabled={sending}
                  className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleStatusChange(candidate.id, 'shortlisted')}
                  disabled={sending || isGenerating}
                  className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {sending ? 'Processing...' : 'Shortlist'}
                </button>
              </div>
            </div>
          )}

          {candidate.status === 'shortlisted' && (
            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => handleStatusChange(candidate.id, 'interview')}
                disabled={sending}
                className="px-3 py-1 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Move to Interview
              </button>
            </div>
          )}

          {candidate.status === 'interview' && (
            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => handleStatusChange(candidate.id, 'offered')}
                disabled={sending}
                className="px-3 py-1 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                Make Offer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobView() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStage, setActiveStage] = useState('applied');
  const [expandedSections, setExpandedSections] = useState({
    applied: true,
    shortlisted: true,
    interview: true,
    offered: true
  });

  useEffect(() => {
    fetchJobAndCandidates();
  }, [id]);

  const fetchJobAndCandidates = async () => {
    try {
      const jobData = await jobService.getJob(id);
      setJob(jobData);

      const applicationsData = await jobService.getApplicationsForJob(id);
      setCandidates(applicationsData);
    } catch (err) {
      setError('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus, assignment = '') => {
    try {
      const application = candidates.find(c => c.id === applicationId);
      if (!application) throw new Error('Application not found');

      const emailResult = await emailService.sendStatusEmail(
        application.email,
        newStatus,
        job.title,
        newStatus === 'shortlisted' ? assignment : undefined
      );

      await jobService.updateApplicationStatus(applicationId, newStatus);

      const applicationsData = await jobService.getApplicationsForJob(id);
      setCandidates(applicationsData);

      return emailResult;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const toggleSection = (stageId) => {
    setExpandedSections(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          Job not found
        </div>
      </div>
    );
  }

  const candidatesByStage = {
    applied: candidates.filter(c => c.status === 'pending'),
    shortlisted: candidates.filter(c => c.status === 'shortlisted'),
    interview: candidates.filter(c => c.status === 'interview'),
    offered: candidates.filter(c => c.status === 'offered')
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          to="/dashboard/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Jobs
        </Link>

        <div className="mt-4 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="mt-2 space-y-2">
                <p className="text-gray-600">{job.role}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {job.location && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Posted {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {job.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-green-600">
                  {candidatesByStage.shortlisted.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 bg-white rounded-lg shadow-sm p-1 mt-6">
          {stages.map(stage => {
            const count = candidatesByStage[stage.id].length;
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeStage === stage.id
                    ? `bg-${stage.color}-100 text-${stage.color}-700`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {stage.label}
                <span className={`ml-2 ${
                  activeStage === stage.id
                    ? `bg-${stage.color}-200 text-${stage.color}-800`
                    : 'bg-gray-100 text-gray-600'
                } px-2 py-0.5 rounded-full text-xs`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {stages.map(stage => (
        <div
          key={stage.id}
          className={activeStage === stage.id ? 'block' : 'hidden'}
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <stage.icon className={`h-5 w-5 text-${stage.color}-500 mr-2`} />
                <h2 className="text-lg font-semibold text-gray-900">
                  {stage.label}
                  <span className="ml-2 text-sm text-gray-500">
                    ({candidatesByStage[stage.id].length})
                  </span>
                </h2>
              </div>
              <button
                onClick={() => toggleSection(stage.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedSections[stage.id] ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>

            {expandedSections[stage.id] && (
              <div className="space-y-4">
                {candidatesByStage[stage.id].map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    job={job}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {candidatesByStage[stage.id].length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No candidates in this stage
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}