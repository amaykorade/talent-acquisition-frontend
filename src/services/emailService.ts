import { db } from '../config/firebase';

const GEMINI_API_KEY = 'AIzaSyD2RL-yzyL7ayG_jcgZlJsxhOPT-WAmt-w';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface EmailResponse {
  message: string;
}

interface EmailContent {
  subject: string;
  text: string;
}

export const emailService = {
  async generateEmailContent(stage: 'shortlisted' | 'interview' | 'offered', jobTitle: string): Promise<EmailContent> {
    try {
      const prompt = `
Generate a professional and encouraging email subject and message for a candidate who has been ${stage} for the position of ${jobTitle}.
Respond ONLY in raw JSON format like:
{"subject": "...", "text": "..."}
- For shortlisted candidates, mention they'll receive a technical assignment.
- For interview candidates, mention interview details will follow shortly.
- For offered candidates, express excitement about potential joining.
`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Gemini API');
      }

      const data = await response.json();
      
      // Extract text from response, handling potential undefined values
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }

      try {
        // Try to parse the response as JSON
        const parsed = JSON.parse(text.trim());
        
        // Validate the parsed response has required fields
        if (!parsed.subject || !parsed.text) {
          throw new Error('Missing required fields in response');
        }
        
        return {
          subject: parsed.subject,
          text: parsed.text
        };
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        throw new Error('Invalid JSON format in response');
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      
      // Fallback content for each stage
      const fallback: Record<string, EmailContent> = {
        shortlisted: {
          subject: `You've been shortlisted for ${jobTitle}!`,
          text: `Congratulations! We're pleased to inform you that you've been shortlisted for the ${jobTitle} position. We'll be sending you a technical assignment shortly.`
        },
        interview: {
          subject: `Interview Invitation - ${jobTitle}`,
          text: `Great news! You've been selected for an interview for the ${jobTitle} position. We'll be in touch shortly with the interview details.`
        },
        offered: {
          subject: `Job Offer - ${jobTitle}`,
          text: `Congratulations! We're excited to offer you the ${jobTitle} position. We believe you'll be a great addition to our team.`
        }
      };

      return fallback[stage];
    }
  },

  async sendStatusEmail(email: string, stage: 'shortlisted' | 'interview' | 'offered', jobTitle: string, assignment?: string): Promise<EmailResponse> {
    try {
      const content = await this.generateEmailContent(stage, jobTitle);
      
      // Add assignment details if provided
      const fullText = assignment 
        ? `${content.text}\n\nTechnical Assignment:\n${assignment}\n\nPlease complete this assignment and submit it through the portal.`
        : content.text;

      const response = await fetch('https://talent-acquisition-backend-piq2.onrender.com/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: content.subject,
          text: fullText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending status email:', error);
      throw error;
    }
  },

  async sendAssignmentEmail(email: string, jobTitle: string, assignment: string, dueDate: string): Promise<EmailResponse> {
    try {
      const response = await fetch('https://talent-acquisition-backend-piq2.onrender.com/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          subject: `Technical Assignment for ${jobTitle} Position`,
          text: `Dear Candidate,\n\nAs part of our selection process for the ${jobTitle} position, please complete the following technical assignment:\n\n${assignment}\n\nDue Date: ${dueDate}\n\nPlease submit your completed assignment through the portal.\n\nBest regards,\nHR Team`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send assignment email');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending assignment email:', error);
      throw error;
    }
  }
};