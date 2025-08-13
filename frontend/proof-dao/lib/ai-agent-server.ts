import { Agent } from "alith"

// Types for ProofDAO entities
interface Task {
  id: string
  title: string
  description: string
  requirements: string
  reward: string
  skillTags: string[]
  maxSubmissions: number
  deadline: number
}

interface Submission {
  id: string
  taskId: string
  contributor: string
  workURI: string
  proofData: string
  submittedAt: number
  status: number // 0: Pending, 1: Approved, 2: Rejected
}

interface TaskValidationResult {
  score: number // 0-100
  shouldApprove: boolean
  confidence: number // 0-1
  feedback: string
  flaggedIssues: string[]
  suggestedActions: string[]
}

interface QualityMetrics {
  completeness: number
  accuracy: number
  presentation: number
  innovation: number
  overallQuality: number
}

export class AIAgentServer {
  private taskReviewAgent: Agent
  private qualityAssessmentAgent: Agent
  private fraudDetectionAgent: Agent
  private feedbackGeneratorAgent: Agent

  constructor(groqApiKey: string) {
    // Task Review Agent - Primary submission validator
    this.taskReviewAgent = new Agent({
      model: "llama3-70b-8192",
      apiKey: groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      preamble: `You are an expert task reviewer for a decentralized autonomous organization (DAO). 
      Your role is to objectively evaluate submitted work against task requirements. You must:
      
      1. Carefully analyze task requirements and submitted work
      2. Check for completeness and accuracy
      3. Identify any red flags or quality issues
      4. Provide constructive feedback
      5. Rate submissions on a 0-100 scale
      6. Be fair but maintain high standards
      
      CRITICAL: Always respond ONLY with valid JSON. No explanations, no additional text, just the JSON object.`,
    })

    // Quality Assessment Agent - Detailed quality metrics
    this.qualityAssessmentAgent = new Agent({
      model: "llama3-70b-8192",
      apiKey: groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      preamble: `You are a quality assessment specialist for blockchain development tasks.
      You evaluate submissions across multiple dimensions:
      
      - Code quality and best practices
      - Documentation completeness
      - Test coverage and functionality
      - Innovation and creativity
      - Professional presentation
      
      Provide detailed scoring (0-100) for each dimension and overall assessment.
      Focus on technical excellence and practical utility.
      
      CRITICAL: Always respond ONLY with valid JSON. No explanations, no additional text, just the JSON object.`,
    })

    // Fraud Detection Agent - Identifies suspicious submissions
    this.fraudDetectionAgent = new Agent({
      model: "llama3-70b-8192",
      apiKey: groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      preamble: `You are a fraud detection specialist for DAO task submissions.
      Your role is to identify potentially fraudulent or low-effort submissions:
      
      - Detect plagiarized or copied content
      - Identify AI-generated submissions without disclosure
      - Flag incomplete or minimal effort work
      - Spot submissions that don't match requirements
      - Identify potential gaming of the system
      
      Be thorough but fair. Provide evidence-based assessments with confidence scores.
      
      CRITICAL: Always respond ONLY with valid JSON. No explanations, no additional text, just the JSON object.`,
    })

    // Feedback Generator Agent - Creates constructive feedback
    this.feedbackGeneratorAgent = new Agent({
      model: "llama3-70b-8192",
      apiKey: groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
      preamble: `You are a constructive feedback specialist for DAO contributors.
      Generate helpful, encouraging, and specific feedback that:
      
      - Highlights what was done well
      - Identifies specific areas for improvement
      - Provides actionable suggestions
      - Maintains a supportive tone
      - Encourages continued participation
      
      Your feedback should help contributors grow while maintaining quality standards.
      
      CRITICAL: Always respond ONLY with valid JSON. No explanations, no additional text, just the JSON object.`,
    })
  }

  /**
   * Utility function to safely parse JSON from AI responses
   */
  private safeJsonParse(response: string, fallbackData: any = {}): any {
    try {
      // Remove any potential markdown code blocks
      let cleanResponse = response.trim()

      // Remove markdown code block markers if present
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "")
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.replace(/^```\s*/, "").replace(/\s*```$/, "")
      }

      // Find JSON object boundaries
      const jsonStart = cleanResponse.indexOf("{")
      const jsonEnd = cleanResponse.lastIndexOf("}") + 1

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonStr = cleanResponse.substring(jsonStart, jsonEnd)
        return JSON.parse(jsonStr)
      }

      // If no JSON found, try parsing the whole response
      return JSON.parse(cleanResponse)
    } catch (error) {
      console.warn(`⚠️ JSON parsing failed, using fallback data:`, error)
      console.warn(`Raw response:`, response)
      return fallbackData
    }
  }

  /**
   * Main validation function that orchestrates all AI agents
   */
  async validateSubmission(task: Task, submission: Submission): Promise<TaskValidationResult> {
    try {
      console.log(`🤖 Starting AI validation for submission ${submission.id}`)

      // Run all agents in parallel for efficiency
      const [primaryReview, qualityMetrics, fraudCheck, feedback] = await Promise.all([
        this.performPrimaryReview(task, submission),
        this.assessQuality(task, submission),
        this.checkForFraud(task, submission),
        this.generateFeedback(task, submission),
      ])

      // Combine all results into final validation
      const result = this.combineResults(primaryReview, qualityMetrics, fraudCheck, feedback)

      console.log(`✅ AI validation completed with score: ${result.score}/100`)
      return result
    } catch (error) {
      console.error("❌ AI validation failed:", error)
      throw new Error(`AI validation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Primary review agent evaluation
   */
  private async performPrimaryReview(task: Task, submission: Submission) {
    const prompt = `
    TASK DETAILS:
    Title: ${task.title}
    Description: ${task.description}
    Requirements: ${task.requirements}
    Skills: ${task.skillTags.join(", ")}
    Reward: ${task.reward} METIS
    
    SUBMISSION DETAILS:
    Work URL: ${submission.workURI}
    Proof/Description: ${submission.proofData}
    Submitted: ${new Date(submission.submittedAt * 1000).toISOString()}
    
    Please evaluate this submission and respond with ONLY valid JSON (no markdown, no explanations):
    {
      "score": <number 0-100>,
      "meetsRequirements": <boolean>,
      "completeness": <number 0-100>,
      "quality": <number 0-100>,
      "keyIssues": ["issue1", "issue2"],
      "strengths": ["strength1", "strength2"],
      "recommendation": "APPROVE|REJECT|NEEDS_REVISION"
    }
    `

    const response = await this.taskReviewAgent.prompt(prompt)
    return this.safeJsonParse(response, {
      score: 50,
      meetsRequirements: false,
      completeness: 50,
      quality: 50,
      keyIssues: ["Failed to parse AI response"],
      strengths: [],
      recommendation: "NEEDS_REVISION",
    })
  }

  /**
   * Quality assessment with detailed metrics
   */
  private async assessQuality(task: Task, submission: Submission): Promise<QualityMetrics> {
    const prompt = `
    Assess the quality of this blockchain/Web3 submission:
    
    TASK: ${task.title}
    REQUIREMENTS: ${task.requirements}
    SUBMISSION URL: ${submission.workURI}
    DESCRIPTION: ${submission.proofData}
    
    Rate each dimension (0-100) and respond with ONLY valid JSON (no markdown, no explanations):
    {
      "completeness": <number>,
      "accuracy": <number>,
      "presentation": <number>,
      "innovation": <number>,
      "overallQuality": <number>,
      "technicalDepth": <number>,
      "documentation": <number>,
      "bestPractices": <number>
    }
    `

    const response = await this.qualityAssessmentAgent.prompt(prompt)
    return this.safeJsonParse(response, {
      completeness: 50,
      accuracy: 50,
      presentation: 50,
      innovation: 50,
      overallQuality: 50,
      technicalDepth: 50,
      documentation: 50,
      bestPractices: 50,
    })
  }

  /**
   * Fraud detection and suspicious activity flagging
   */
  private async checkForFraud(task: Task, submission: Submission) {
    const prompt = `
    Analyze this submission for potential fraud or gaming:
    
    TASK REQUIREMENTS: ${task.requirements}
    SUBMISSION URL: ${submission.workURI}
    PROOF DATA: ${submission.proofData}
    CONTRIBUTOR: ${submission.contributor}
    
    Look for:
    - Minimal effort or incomplete work
    - Potential plagiarism indicators  
    - AI-generated content without disclosure
    - Work that doesn't match requirements
    - Suspicious timing or patterns
    
    Respond with ONLY valid JSON (no markdown, no explanations):
    {
      "riskScore": <number 0-100>,
      "suspiciousFlags": ["flag1", "flag2"],
      "confidence": <number 0-1>,
      "requiresHumanReview": <boolean>,
      "evidencePoints": ["evidence1", "evidence2"]
    }
    `

    const response = await this.fraudDetectionAgent.prompt(prompt)
    return this.safeJsonParse(response, {
      riskScore: 30,
      suspiciousFlags: ["Unable to analyze - parsing error"],
      confidence: 0.3,
      requiresHumanReview: true,
      evidencePoints: ["Failed to parse AI response"],
    })
  }

  /**
   * Generate constructive feedback
   */
  private async generateFeedback(task: Task, submission: Submission) {
    const prompt = `
    Generate constructive feedback for this DAO submission:
    
    TASK: ${task.title}
    REQUIREMENTS: ${task.requirements}
    SUBMISSION: ${submission.proofData}
    
    Provide encouraging but honest feedback. Respond with ONLY valid JSON (no markdown, no explanations):
    {
      "positiveFeedback": "What was done well...",
      "improvementAreas": ["area1", "area2"],
      "specificSuggestions": ["suggestion1", "suggestion2"],
      "encouragement": "Encouraging message...",
      "nextSteps": "Recommended next steps..."
    }
    `

    const response = await this.feedbackGeneratorAgent.prompt(prompt)
    return this.safeJsonParse(response, {
      positiveFeedback: "Thank you for your submission.",
      improvementAreas: ["Unable to provide specific feedback due to parsing error"],
      specificSuggestions: ["Please try resubmitting or contact support"],
      encouragement: "We appreciate your participation in the DAO.",
      nextSteps: "Review requirements and consider resubmission.",
    })
  }

  /**
   * Combine all agent results into final validation
   */
  private combineResults(
    primaryReview: any,
    qualityMetrics: QualityMetrics,
    fraudCheck: any,
    feedback: any,
  ): TaskValidationResult {
    // Calculate weighted final score
    const finalScore = Math.round(
      primaryReview.score * 0.4 + qualityMetrics.overallQuality * 0.3 + (100 - fraudCheck.riskScore) * 0.3,
    )

    // Determine approval recommendation
    const shouldApprove = finalScore >= 75 && fraudCheck.riskScore < 30 && primaryReview.meetsRequirements

    // Calculate confidence based on consistency
    const scoreVariation = Math.abs(primaryReview.score - qualityMetrics.overallQuality)
    const confidence = Math.max(0.5, 1 - scoreVariation / 100)

    // Compile flagged issues
    const flaggedIssues = [...(primaryReview.keyIssues || []), ...(fraudCheck.suspiciousFlags || [])]

    // Generate suggested actions
    const suggestedActions = []
    if (finalScore < 60) suggestedActions.push("REJECT_SUBMISSION")
    if (finalScore >= 60 && finalScore < 75) suggestedActions.push("REQUEST_REVISION")
    if (finalScore >= 75) suggestedActions.push("APPROVE_SUBMISSION")
    if (fraudCheck.requiresHumanReview) suggestedActions.push("FLAG_FOR_HUMAN_REVIEW")
    if (qualityMetrics.innovation > 90) suggestedActions.push("HIGHLIGHT_EXCEPTIONAL_WORK")

    return {
      score: finalScore,
      shouldApprove,
      confidence,
      feedback:
        feedback.positiveFeedback + "\n\nAreas for improvement: " + (feedback.improvementAreas || []).join(", "),
      flaggedIssues,
      suggestedActions,
    }
  }

  /**
   * Batch process multiple submissions efficiently
   */
  async validateBatch(submissions: Array<{ task: Task; submission: Submission }>): Promise<TaskValidationResult[]> {
    console.log(`🚀 Processing batch of ${submissions.length} submissions`)

    // Process in parallel with concurrency limit
    const batchSize = 5 // Adjust based on API limits
    const results: TaskValidationResult[] = []

    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(({ task, submission }) => this.validateSubmission(task, submission)),
      )
      results.push(...batchResults)

      // Small delay to respect rate limits
      if (i + batchSize < submissions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  /**
   * Get AI-powered suggestions for task creators
   */
  async suggestTaskImprovements(task: Task): Promise<string[]> {
    const prompt = `
    Analyze this DAO task and suggest improvements:
    
    TASK: ${task.title}
    DESCRIPTION: ${task.description}
    REQUIREMENTS: ${task.requirements}
    REWARD: ${task.reward} METIS
    SKILLS: ${task.skillTags.join(", ")}
    
    Provide suggestions to make this task clearer, more attractive, and easier to evaluate.
    Respond with ONLY a JSON array of suggestions (no markdown, no explanations):
    ["suggestion1", "suggestion2", "suggestion3"]
    `

    const response = await this.taskReviewAgent.prompt(prompt)
    return this.safeJsonParse(response, ["Unable to generate suggestions due to parsing error"])
  }
}

// Server-side validation service
export class TaskValidationService {
  private aiAgent: AIAgentServer

  constructor(apiKey: string) {
    this.aiAgent = new AIAgentServer(apiKey)
  }

  /**
   * Validate a submission and return results compatible with your UI
   */
  async validateSubmission(
    task: Task,
    submission: Submission,
  ): Promise<{
    aiScore: number
    aiRecommendation: "APPROVE" | "REJECT" | "REVIEW"
    aiFeedback: string
    aiFlags: string[]
    confidence: number
  }> {
    const result = await this.aiAgent.validateSubmission(task, submission)

    let recommendation: "APPROVE" | "REJECT" | "REVIEW" = "REVIEW"
    if (result.shouldApprove && result.confidence > 0.8) {
      recommendation = "APPROVE"
    } else if (result.score < 40 || result.flaggedIssues.length > 2) {
      recommendation = "REJECT"
    }

    return {
      aiScore: result.score,
      aiRecommendation: recommendation,
      aiFeedback: result.feedback,
      aiFlags: result.flaggedIssues,
      confidence: result.confidence,
    }
  }

  /**
   * Process all pending submissions for a DAO
   */
  async processPendingSubmissions(daoId: string, submissions: Submission[], tasks: Task[]) {
    const submissionTaskPairs = submissions
      .filter((sub) => sub.status === 0) // Only pending submissions
      .map((submission) => ({
        task: tasks.find((t) => t.id === submission.taskId)!,
        submission,
      }))
      .filter((pair) => pair.task) // Only valid task-submission pairs

    const results = await this.aiAgent.validateBatch(submissionTaskPairs)

    // Log results for DAO administrators
    console.log(`📊 AI Validation Results for DAO ${daoId}:`)
    results.forEach((result, index) => {
      const { submission } = submissionTaskPairs[index]
      console.log(
        `Submission ${submission.id}: ${result.score}/100 - ${result.shouldApprove ? "✅ APPROVE" : "❌ REVIEW"}`,
      )
    })

    return results
  }

  /**
   * Get task improvement suggestions
   */
  async getTaskSuggestions(task: Task): Promise<string[]> {
    return await this.aiAgent.suggestTaskImprovements(task)
  }
}
