const GEMINI_API_KEY = 'AIzaSyD2RL-yzyL7ayG_jcgZlJsxhOPT-WAmt-w';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const geminiService = {
  async generateJobDescription(jobInfo) {
    try {
      const prompt = `Create a detailed job description for the following position:
Title: ${jobInfo.title}
Role: ${jobInfo.role}
Requirements: ${jobInfo.requirements}

Please include:
- Detailed responsibilities
- Required qualifications
- Preferred skills
- Benefits and perks
- Company culture fit`;

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('Invalid response structure from Gemini API');
      }

      return generatedText;
    } catch (error) {
      console.error('Error generating description:', error);
      throw error;
    }
  },

  async generateAssignment(candidateSkills, jobTitle, jobRequirements = '') {
    try {
      let prompt;

      if (Array.isArray(candidateSkills) && candidateSkills.length > 0) {
        // Generate assignment based on candidate skills
        const skillsString = candidateSkills
          .map(skill => `${skill.name} (Level ${skill.rating}/5)`)
          .join(', ');

        prompt = `Create a technical assignment for a ${jobTitle} position.
The candidate has the following skills and proficiency levels:
${skillsString}

Generate a JSON response with the following structure:
{
  "title": "Assignment title",
  "description": "Detailed assignment description",
  "requirements": ["List of specific requirements"],
  "evaluation_criteria": ["List of evaluation points"],
  "estimated_time": "Estimated completion time",
  "difficulty_level": "Based on candidate's skill levels"
}

Ensure the assignment:
1. Matches the candidate's skill levels
2. Tests practical implementation
3. Is challenging but achievable
4. Can be completed in 2-4 hours
5. Focuses on their strongest skills (rated 4-5)
6. Includes simpler tasks for skills rated 1-3`;
      } else {
        // Generate assignment based on job requirements
        prompt = `Create a technical assignment for a ${jobTitle} position based on these requirements:
${jobRequirements}

Generate a JSON response with the following structure:
{
  "title": "Assignment title",
  "description": "Detailed assignment description",
  "requirements": ["List of specific requirements"],
  "evaluation_criteria": ["List of evaluation points"],
  "estimated_time": "Estimated completion time",
  "difficulty_level": "Moderate"
}

Ensure the assignment:
1. Tests the key requirements of the position
2. Focuses on practical implementation
3. Is challenging but achievable
4. Can be completed in 2-4 hours
5. Covers core skills needed for the role
6. Allows candidates to demonstrate their expertise`;
      }

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('Empty response from Gemini API');
      }

      try {
        // Clean the response text to ensure it's valid JSON
        const cleanedText = generatedText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const parsedAssignment = JSON.parse(cleanedText);
        
        // Validate the parsed response has all required fields
        const requiredFields = ['title', 'description', 'requirements', 'evaluation_criteria', 'estimated_time', 'difficulty_level'];
        const missingFields = requiredFields.filter(field => !parsedAssignment[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        return parsedAssignment;
      } catch (error) {
        console.error('Error parsing generated assignment:', error);
        throw new Error('Failed to parse generated assignment');
      }
    } catch (error) {
      console.error('Error generating assignment:', error);
      throw new Error('Failed to generate assignment. Please try again or use custom assignment.');
    }
  }
};