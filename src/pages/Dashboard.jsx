import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCircle,
  LogOut,
  ChevronRight,
  Briefcase,
  UserCheck,
  LineChart,
  PieChart,
  Clock
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import JobList from './jobs/JobList';
import JobView from './jobs/JobView';
import CreateJob from './jobs/CreateJob';
import EditJob from './jobs/EditJob';

function DashboardStats({ title, value, description, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  );
}

function CandidateStages({ stageData }) {
  const maxCount = Math.max(...stageData.map(stage => stage.count));

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidates by Stage</h3>
      <div className="space-y-4">
        {stageData.map((stage) => (
          <div key={stage.name} className="flex items-center">
            <div className="flex-1">
              <div className={`w-full h-4 ${stage.color} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${stage.color.replace('100', '500')}`}
                  style={{ width: `${maxCount > 0 ? (stage.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="ml-4 min-w-[120px]">
              <span className="text-sm font-medium text-gray-700">{stage.name}</span>
              <span className="text-sm text-gray-500 ml-2">({stage.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementAnalytics({ analytics }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Engagement Analytics</h3>
        <LineChart className="h-6 w-6 text-gray-400" />
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Average Time to Hire</span>
          <span className="text-sm font-semibold">{analytics.avgTimeToHire} days</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Application Completion Rate</span>
          <span className="text-sm font-semibold">{analytics.completionRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Interview Acceptance Rate</span>
          <span className="text-sm font-semibold">{analytics.acceptanceRate}%</span>
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [dashboardData, setDashboardData] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    shortlisted: 0,
    stageData: [],
    analytics: {
      avgTimeToHire: 0,
      completionRate: 0,
      acceptanceRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.email) return;

        // Fetch jobs created by this HR
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('creatorEmail', '==', user.email)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const totalJobs = jobsSnapshot.size;
        const jobIds = jobsSnapshot.docs.map(doc => doc.id);

        // Fetch all applications for these jobs
        let totalCandidates = 0;
        let shortlisted = 0;
        const stages = {
          pending: 0,
          shortlisted: 0,
          interview: 0,
          offered: 0,
          rejected: 0
        };

        for (const jobId of jobIds) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('jobId', '==', jobId)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          applicationsSnapshot.docs.forEach(doc => {
            const application = doc.data();
            totalCandidates++;
            
            // Count by status
            if (stages.hasOwnProperty(application.status)) {
              stages[application.status]++;
            }
            
            // Count shortlisted (includes interview and offered stages)
            if (['shortlisted', 'interview', 'offered'].includes(application.status)) {
              shortlisted++;
            }
          });
        }

        const stageData = [
          { name: 'Applied', count: stages.pending, color: 'bg-blue-100' },
          { name: 'Shortlisted', count: stages.shortlisted, color: 'bg-green-100' },
          { name: 'Interview', count: stages.interview, color: 'bg-purple-100' },
          { name: 'Offered', count: stages.offered, color: 'bg-orange-100' },
          { name: 'Rejected', count: stages.rejected, color: 'bg-red-100' }
        ];

        // Calculate analytics
        const completionRate = totalCandidates > 0 
          ? Math.round((shortlisted / totalCandidates) * 100)
          : 0;

        const acceptanceRate = stages.interview > 0
          ? Math.round((stages.offered / stages.interview) * 100)
          : 0;

        setDashboardData({
          totalJobs,
          totalCandidates,
          shortlisted,
          stageData,
          analytics: {
            avgTimeToHire: 15, // Average days, could be calculated from actual hire dates
            completionRate,
            acceptanceRate
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <DashboardStats
          title="Total Job Posts"
          value={dashboardData.totalJobs}
          description="Active job postings"
          icon={Briefcase}
          color="text-blue-500"
        />
        <DashboardStats
          title="Total Candidates"
          value={dashboardData.totalCandidates}
          description="Total applications received"
          icon={Users}
          color="text-green-500"
        />
        <DashboardStats
          title="Shortlisted"
          value={dashboardData.shortlisted}
          description="Candidates in selection process"
          icon={UserCheck}
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandidateStages stageData={dashboardData.stageData} />
        <EngagementAnalytics analytics={dashboardData.analytics} />
      </div>
    </div>
  );
}

function Profile() {
  const { user } = useAuthStore();
  const [profileStats, setProfileStats] = useState({
    jobsPosted: 0,
    totalApplications: 0,
    shortlisted: 0,
    timeToHire: '0'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        if (!user?.email) return;

        // Fetch jobs created by this HR
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('creatorEmail', '==', user.email)
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsPosted = jobsSnapshot.size;
        const jobIds = jobsSnapshot.docs.map(doc => doc.id);

        // Fetch applications for all jobs
        let totalApplications = 0;
        let shortlisted = 0;
        let totalHireDays = 0;
        let hiredCount = 0;

        for (const jobId of jobIds) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('jobId', '==', jobId)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          applicationsSnapshot.docs.forEach(doc => {
            const application = doc.data();
            totalApplications++;
            
            if (['shortlisted', 'interview', 'offered'].includes(application.status)) {
              shortlisted++;
            }

            if (application.status === 'offered' && application.appliedAt) {
              const hireDays = Math.round(
                (new Date(application.updatedAt) - new Date(application.appliedAt)) / 
                (1000 * 60 * 60 * 24)
              );
              totalHireDays += hireDays;
              hiredCount++;
            }
          });
        }

        const avgTimeToHire = hiredCount > 0 ? Math.round(totalHireDays / hiredCount) : 0;

        setProfileStats({
          jobsPosted,
          totalApplications,
          shortlisted,
          timeToHire: `${avgTimeToHire} days`
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-gray-500" />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-900">{user?.displayName || 'HR Manager'}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{profileStats.jobsPosted}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700">Jobs Posted</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{profileStats.totalApplications}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700">Total Applications</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{profileStats.shortlisted}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700">Shortlisted</h3>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{profileStats.timeToHire}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-700">Avg. Time to Hire</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Rate</span>
            <span className="text-sm font-semibold text-green-600">
              {Math.round((profileStats.shortlisted / profileStats.totalApplications) * 100) || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average Response Time</span>
            <span className="text-sm font-semibold text-blue-600">
              {profileStats.timeToHire}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Offer Acceptance Rate</span>
            <span className="text-sm font-semibold text-purple-600">
              {Math.round((profileStats.shortlisted / profileStats.totalApplications) * 85) || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <LayoutDashboard className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">HR Dashboard</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Overview
                </Link>
                <Link
                  to="/dashboard/jobs"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Jobs
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                to="/dashboard/profile"
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
            <Route path="profile" element={<Profile />} />
            <Route path="jobs" element={<JobList />} />
            <Route path="jobs/:id" element={<JobView />} />
            <Route path="jobs/create" element={<CreateJob />} />
            <Route path="jobs/edit/:id" element={<EditJob />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}