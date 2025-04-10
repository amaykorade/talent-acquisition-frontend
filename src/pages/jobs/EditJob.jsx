import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Loader2, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    role: '',
    requirements: '',
    description: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();
      setFormData(data);
    } catch (err) {
      setError('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateDescription = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const prompt = `Create a detailed job description for the following position:
        Title: ${formData.title}
        Role: ${formData.role}
        Requirements: ${formData.requirements}
        
        Please include:
        - Detailed responsibilities
        - Required qualifications
        - Preferred skills
        - Benefits and perks
        - Company culture fit`;

      const response = await fetch('YOUR_GEMINI_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        description: data.description
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
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lastEdited: new Date(),
          editCount: (formData.editCount || 0) + 1
        }),
      });

      if (response.ok) {
        navigate('/dashboard/jobs');
      }
    } catch (err) {
      setError('Failed to update job post. Please try again.');
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Edit Job Post</h1>
          </div>
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Jobs
          </button>
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
                  'Regenerate with AI'
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
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditJob;