// Client-side AI service that calls server-side APIs

interface Task {
    id: string;
    title: string;
    description: string;
    requirements: string;
    reward: string;
    skillTags: string[];
    maxSubmissions: number;
    deadline: number;
  }
  
  interface Submission {
    id: string;
    taskId: string;
    contributor: string;
    workURI: string;
    proofData: string;
    submittedAt: number;
    status: number;
  }
  
  interface AIValidationResult {
    aiScore: number;
    aiRecommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
    aiFeedback: string;
    aiFlags: string[];
    confidence: number;
  }
  
  interface AIHealthStatus {
    status: 'online' | 'offline';
    hasApiKey: boolean;
    model: string;
    responseTime: string;
    accuracy: string;
  }
  
  export class AIClientService {
    private baseUrl: string;
  
    constructor() {
      this.baseUrl = '/api/ai';
    }
  
    /**
     * Validate a single submission using AI
     */
    async validateSubmission(task: Task, submission: Submission): Promise<AIValidationResult> {
      try {
        const response = await fetch(`${this.baseUrl}/validate-submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task, submission }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'AI validation failed');
        }
  
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('AI validation error:', error);
        throw error;
      }
    }
  
    /**
     * Batch validate multiple submissions
     */
    async batchValidateSubmissions(
      daoId: string,
      submissions: Submission[],
      tasks: Task[]
    ): Promise<AIValidationResult[]> {
      try {
        const response = await fetch(`${this.baseUrl}/batch-validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ daoId, submissions, tasks }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Batch validation failed');
        }
  
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Batch validation error:', error);
        throw error;
      }
    }
  
    /**
     * Get AI suggestions for task improvement
     */
    async getTaskSuggestions(task: Task): Promise<string[]> {
      try {
        const response = await fetch(`${this.baseUrl}/task-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get task suggestions');
        }
  
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Task suggestions error:', error);
        throw error;
      }
    }
  
    /**
     * Check AI service health status
     */
    async getHealthStatus(): Promise<AIHealthStatus> {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
        });
  
        if (!response.ok) {
          throw new Error('Health check failed');
        }
  
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('AI health check error:', error);
        // Return offline status on error
        return {
          status: 'offline',
          hasApiKey: false,
          model: 'Groq + Alith',
          responseTime: 'N/A',
          accuracy: 'N/A'
        };
      }
    }
  
    /**
     * Helper method to check if AI service is available
     */
    async isServiceAvailable(): Promise<boolean> {
      try {
        const health = await this.getHealthStatus();
        return health.status === 'online' && health.hasApiKey;
      } catch {
        return false;
      }
    }
  }
  
  // Export singleton instance
  export const aiClientService = new AIClientService();
  