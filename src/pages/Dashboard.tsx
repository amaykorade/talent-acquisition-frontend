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
  Briefcase
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DashboardStats {
  totalJobs: number;
  totalCandidates: number;
  shortlisted: number;
}

function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    totalCandidates: 0,
    shortlisted: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return;

        // Fetch jobs count
        const jobsQuery = query(collection(db, 'jobs'), where('createdBy', '==', user.uid));
        const jobsSnapshot = await getDocs(jobsQuery);
        const totalJobs = jobsSnapshot.size;

        // Fetch all applications for user's jobs
        let totalCandidates = 0;
        let shortlisted = 0;

        for (const jobDoc of jobsSnapshot.docs) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('jobId', '==', jobDoc.id)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          // Count total applications
          totalCandidates += applicationsSnapshot.size;
          
          // Count shortlisted candidates
          shortlisted += applicationsSnapshot.docs.filter(doc => 
            doc.data().status === 'accepted'
          ).length;
        }

        setStats({
          totalJobs,
          totalCandidates,
          shortlisted
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Job Posts</h3>
          <Briefcase className="h-6 w-6 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
        <p className="text-sm text-gray-500 mt-2">Active job postings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Candidates</h3>
          <Users className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.totalCandidates}</p>
        <p className="text-sm text-gray-500 mt-2">Total applications received</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Shortlisted</h3>
          <UserCircle className="h-6 w-6 text-purple-500" />
        </div>
        <p className="text-3xl font-bold text-gray-900">{stats.shortlisted}</p>
        <p className="text-sm text-gray-500 mt-2">Candidates shortlisted</p>
      </div>
    </div>
  );
}

interface ProfileStats {
  jobsPosted: number;
  totalApplications: number;
  shortlisted: number;
}

function Profile() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats>({
    jobsPosted: 0,
    totalApplications: 0,
    shortlisted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        if (!user) return;

        // Fetch jobs
        const jobsQuery = query(collection(db, 'jobs'), where('createdBy', '==', user.uid));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsPosted = jobsSnapshot.size;
        
        let totalApplications = 0;
        let shortlisted = 0;

        // Fetch applications for each job
        for (const jobDoc of jobsSnapshot.docs) {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('jobId', '==', jobDoc.id)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          
          totalApplications += applicationsSnapshot.size;
          shortlisted += applicationsSnapshot.docs.filter(doc => 
            doc.data().status === 'accepted'
          ).length;
        }

        setStats({
          jobsPosted,
          totalApplications,
          shortlisted
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <UserCircle className="w-12 h-12 text-gray-500" />
        </div>
        <div className="ml-4">
          <h2 className="text-2xl font-bold text-gray-900">{user?.email}</h2>
          <p className="text-gray-500">HR Manager</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700">Jobs Posted</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.jobsPosted}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700">Total Applications</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalApplications}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700">Shortlisted</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.shortlisted}</p>
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
            </div>
            <div className="flex items-center">
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
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-700">Overview</span>
          </div>

          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}