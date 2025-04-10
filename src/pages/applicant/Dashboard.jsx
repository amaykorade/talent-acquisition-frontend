import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  UserCircle,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import MyApplications from './MyApplications';
import Profile from './Profile';
import JobSearch from './JobSearch';

function DashboardHome() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    interviews: 0,
    offered: 0
  });
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('candidateId', '==', user?.uid)
      );
      const snapshot = await getDocs(applicationsQuery);
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats
      const stats = applications.reduce((acc, app) => {
        acc.totalApplications++;
        switch (app.status) {
          case 'pending':
            acc.pending++;
            break;
          case 'shortlisted':
            acc.shortlisted++;
            break;
          case 'rejected':
            acc.rejected++;
            break;
          case 'interview':
            acc.interviews++;
            break;
          case 'offered':
            acc.offered++;
            break;
        }
        return acc;
      }, {
        totalApplications: 0,
        pending: 0,
        shortlisted: 0,
        rejected: 0,
        interviews: 0,
        offered: 0
      });

      setStats(stats);

      // Get upcoming interviews
      const interviews = applications
        .filter(app => app.status === 'interview' && app.interviewDate)
        .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
        .slice(0, 3);

      setUpcomingInterviews(interviews);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage based on application stages
  const calculateProgress = () => {
    if (stats.totalApplications === 0) return 0;

    // Define weights for each stage
    const weights = {
      pending: 0.25,    // 25% progress for applying
      shortlisted: 0.5, // 50% progress for being shortlisted
      interview: 0.75,  // 75% progress for reaching interview stage
      offered: 1        // 100% progress for receiving an offer
    };

    // Calculate weighted progress
    let totalProgress = 0;

    // Add progress for each stage
    totalProgress += stats.pending * weights.pending;
    totalProgress += stats.shortlisted * weights.shortlisted;
    totalProgress += stats.interviews * weights.interview;
    totalProgress += stats.offered * weights.offered;

    // Get the highest progress among all applications
    const maxProgress = Math.max(
      stats.pending > 0 ? weights.pending : 0,
      stats.shortlisted > 0 ? weights.shortlisted : 0,
      stats.interviews > 0 ? weights.interview : 0,
      stats.offered > 0 ? weights.offered : 0
    );

    // Return the highest progress achieved as a percentage
    return Math.round(maxProgress * 100);
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Shortlisted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Interviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.interviews}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Application Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Progress</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-600">
              {calculateProgress()}% Progress
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Applied</span>
            <span>Shortlisted</span>
            <span>Interview</span>
            <span>Offer</span>
          </div>
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h2>
          <div className="space-y-4">
            {upcomingInterviews.map(interview => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{interview.jobTitle}</h3>
                  <p className="text-sm text-gray-500">{interview.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(interview.interviewDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(interview.interviewDate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicantDashboard() {
  const { signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <LayoutDashboard className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">My Career Portal</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/applicant"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/applicant/jobs"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Find Jobs
                </Link>
                <Link
                  to="/applicant/applications"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Applications
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                to="/applicant/profile"
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
              >
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={signOut}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="jobs" element={<JobSearch />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}