import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import {
  UserCircle,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Save,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';

export default function Profile() {
  const { user } = useAuthStore();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const profileDoc = await getDoc(doc(db, 'applicantProfiles', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        Object.entries(data).forEach(([key, value]) => {
          setValue(key, value);
        });
        if (data.resumeUrl) {
          setResumeUrl(data.resumeUrl);
          setResumeName(data.resumeName || 'Resume');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const parseResumeData = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);

    try {
      setParsingResume(true);
      const response = await fetch('https://talent-acquisition-backend-piq2.onrender.com/parse-resume', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const result = await response.json();
      
      if (result.data) {
        // Update basic information
        setValue('fullName', result.data['Full Name'] || '');
        setValue('summary', result.data['Summary'] || '');

        // Format work experience
        if (result.data['Work Experience'] && result.data['Work Experience'].length > 0) {
          const experienceText = result.data['Work Experience']
            .map(exp => 
              `${exp['Position']} at ${exp['Company Name']}\n` +
              `${exp['Duration']}\n\n` +
              `Key Achievements:\n${exp['Key Points'].map(point => `• ${point}`).join('\n')}`
            )
            .join('\n\n');
          setValue('experience', experienceText);
        }

        // Format skills
        if (result.data['Skills']) {
          const skillsText = Object.entries(result.data['Skills'])
            .map(([category, skills]) => 
              `${category}:\n${Array.isArray(skills) ? skills.map(skill => `• ${skill}`).join('\n') : skills}`
            )
            .join('\n\n');
          setValue('skills', skillsText);
        }

        // Set social links if available
        setValue('linkedin', result.data['LinkedIn URL'] || '');
        setValue('github', result.data['GitHub URL'] || '');
        setValue('portfolio', result.data['Portfolio URL'] || '');

        setSuccessMessage('Resume parsed successfully! Please review and edit the information if needed.');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      setErrorMessage('Failed to parse resume. Please fill in the information manually.');
    } finally {
      setParsingResume(false);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Only allow DOCX files for parsing
    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setErrorMessage('Please upload a DOCX file for automatic profile filling');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size should not exceed 5MB');
      return;
    }

    setUploadingResume(true);
    setErrorMessage('');

    try {
      // Parse resume first
      await parseResumeData(file);

      // Upload to Firebase Storage after successful parsing
      if (resumeUrl) {
        const oldResumeRef = ref(storage, `resumes/${user.uid}/${resumeName}`);
        try {
          await deleteObject(oldResumeRef);
        } catch (error) {
          console.error('Error deleting old resume:', error);
        }
      }

      const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setResumeUrl(downloadUrl);
      setResumeName(file.name);
      setValue('resumeUrl', downloadUrl);
      setValue('resumeName', file.name);
    } catch (error) {
      console.error('Error handling resume:', error);
      setErrorMessage('Failed to process resume. Please try again.');
    } finally {
      setUploadingResume(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'applicantProfiles', user.uid), {
        ...data,
        resumeUrl,
        resumeName,
        updatedAt: new Date().toISOString()
      });
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
    } finally {
      setSaving(false);
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
              <UserCircle className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.displayName || 'Your Profile'}</h1>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Resume Upload Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>
            
            <div className="space-y-4">
              {resumeUrl ? (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{resumeName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No resume uploaded yet</p>
              )}

              <div>
                <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {uploadingResume ? 'Uploading...' : parsingResume ? 'Parsing...' : 'Upload Resume'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".docx"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume || parsingResume}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Upload your resume in DOCX format (Max size: 5MB) for automatic profile filling.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    {...register('fullName', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    {...register('phone', { required: 'Phone number is required' })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Professional Summary
              </label>
              <div className="mt-1">
                <textarea
                  {...register('summary')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Brief overview of your professional background and career goals"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Work Experience
              </label>
              <div className="mt-1">
                <textarea
                  {...register('experience')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="List your relevant work experience"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Education
              </label>
              <div className="mt-1">
                <textarea
                  {...register('education')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="List your educational qualifications"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Skills
              </label>
              <div className="mt-1">
                <textarea
                  {...register('skills')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="List your technical and professional skills"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  LinkedIn Profile
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    {...register('linkedin')}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GitHub Profile
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    {...register('github')}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Portfolio Website
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    {...register('portfolio')}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}