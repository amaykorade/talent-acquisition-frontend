import { db, auth } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  increment, 
  runTransaction, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { emailService } from './emailService';

const JOBS_COLLECTION = 'jobs';
const APPLICATIONS_COLLECTION = 'applications';

export const jobService = {
  async createJob(jobData) {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      const docRef = await addDoc(jobsRef, {
        ...jobData,
        createdAt: serverTimestamp(),
        views: 0,
        applicants: 0,
        shortlisted: 0,
        editCount: 0,
        editHistory: [],
        status: 'active',
        createdBy: auth.currentUser?.uid,
        creatorEmail: auth.currentUser?.email
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  async getJobs() {
    try {
      const jobsRef = collection(db, JOBS_COLLECTION);
      let q;
      
      // For HR users, show all their jobs regardless of status
      if (auth.currentUser?.email?.includes('hr@')) {
        q = query(
          jobsRef,
          where('creatorEmail', '==', auth.currentUser.email)
        );
      } else {
        // For regular users, only show active jobs
        q = query(
          jobsRef,
          where('status', '==', 'active')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  async getJob(id) {
    try {
      const docRef = doc(db, JOBS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      }
      throw new Error('Job not found');
    } catch (error) {
      console.error('Error fetching job:', error);
      throw error;
    }
  },

  async updateJob(id, jobData) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, id);
      const currentJob = await getDoc(jobRef);
      
      if (!currentJob.exists()) {
        throw new Error('Job not found');
      }

      const currentData = currentJob.data();
      const editHistory = currentData.editHistory || [];

      await updateDoc(jobRef, {
        ...jobData,
        updatedAt: serverTimestamp(),
        editCount: increment(1),
        editHistory: [
          ...editHistory,
          {
            timestamp: new Date().toISOString(),
            editor: auth.currentUser?.email,
            changes: Object.keys(jobData).join(', ')
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  async deleteJob(id) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, id);
      const applicationsQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', '==', id)
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      await runTransaction(db, async (transaction) => {
        // Delete all applications first
        applicationsSnapshot.docs.forEach(doc => {
          transaction.delete(doc.ref);
        });
        // Then delete the job
        transaction.delete(jobRef);
      });

      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  async updateJobStatus(id, status) {
    try {
      const jobRef = doc(db, JOBS_COLLECTION, id);
      await updateDoc(jobRef, {
        status,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  },

  async getApplicationsForJob(jobId) {
    try {
      const applicationsQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', '==', jobId)
      );
      const snapshot = await getDocs(applicationsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appliedAt: data.appliedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  async checkExistingApplication(jobId, userId) {
    try {
      const applicationsQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', '==', jobId),
        where('candidateId', '==', userId)
      );
      const snapshot = await getDocs(applicationsQuery);
      return snapshot.size > 0;
    } catch (error) {
      console.error('Error checking existing application:', error);
      throw error;
    }
  },

  async applyToJob(jobId, applicationData) {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to apply');
      }

      const hasApplied = await this.checkExistingApplication(jobId, auth.currentUser.uid);
      if (hasApplied) {
        throw new Error('You have already applied for this position');
      }

      const jobRef = doc(db, JOBS_COLLECTION, jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        throw new Error('Job not found');
      }

      if (jobSnap.data().status !== 'active') {
        throw new Error('This job is no longer accepting applications');
      }

      const applicationRef = collection(db, APPLICATIONS_COLLECTION);
      await runTransaction(db, async (transaction) => {
        // Create application
        await addDoc(applicationRef, {
          jobId,
          candidateId: auth.currentUser.uid,
          name: applicationData.name,
          email: applicationData.email,
          phone: applicationData.phone,
          education: applicationData.education,
          experience: applicationData.experience,
          resume: applicationData.resume,
          coverLetter: applicationData.coverLetter,
          skills: applicationData.skills,
          status: 'pending',
          appliedAt: serverTimestamp()
        });

        // Update job applicants count
        transaction.update(jobRef, {
          applicants: increment(1)
        });
      });

      return { success: true, message: 'Application submitted successfully!' };
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  },

  async updateApplicationStatus(applicationId, status) {
    try {
      const applicationRef = doc(db, APPLICATIONS_COLLECTION, applicationId);
      await updateDoc(applicationRef, {
        status,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }
};