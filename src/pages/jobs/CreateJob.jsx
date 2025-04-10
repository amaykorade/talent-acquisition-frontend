import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2 } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { geminiService } from '../../services/geminiService';

function CreateJob() {
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    requirements: '',
    description: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.role || !formData.requirements) {
      setError('Please fill in title, role, and requirements first');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const description = await geminiService.generateJobDescription(formData);
      setFormData(prev => ({
        ...prev,
        description
      }));
    } catch (err) {
      setError('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await jobService.createJob(formData);
      navigate('/dashboard/jobs');
    } catch (err) {
      setError('Failed to create job post. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Create New Job Post</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate with AI'
                )}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/jobs')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJob;