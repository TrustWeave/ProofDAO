import { type NextRequest, NextResponse } from "next/server"
import { TaskValidationService } from "@/lib/ai-agent-server"

export async function POST(request: NextRequest) {
  try {
    const { daoId, submissions, tasks } = await request.json()

    if (!daoId || !submissions || !tasks) {
      return NextResponse.json({ error: "DAO ID, submissions, and tasks are required" }, { status: 400 })
    }

    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured. Please set NEXT_PUBLIC_GROQ_API_KEY environment variable." },
        { status: 503 },
      )
    }

    const validationService = new TaskValidationService(apiKey)
    const startTime = Date.now()

    // Process submissions individually and return results
    const results = []
    for (const submission of submissions) {
      const task = tasks.find((t: any) => t.id === submission.taskId)
      if (task) {
        try {
          const result = await validationService.validateSubmission(task, submission)
          results.push({
            submissionId: submission.id,
            ...result,
            processingTime: Date.now() - startTime,
            validatedAt: Date.now(),
          })
        } catch (error) {
          console.error(`Failed to validate submission ${submission.id}:`, error)
          results.push({
            submissionId: submission.id,
            aiScore: 0,
            aiRecommendation: "REVIEW" as const,
            aiFeedback: "AI validation failed. Manual review required.",
            aiFlags: ["AI_PROCESSING_ERROR"],
            confidence: 0,
            processingTime: Date.now() - startTime,
            validatedAt: Date.now(),
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error("Batch validation error:", error)

    if (error instanceof Error && error.message.includes("NEXT_PUBLIC_GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Please set NEXT_PUBLIC_GROQ_API_KEY environment variable." },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: "Batch validation failed. Please try again." }, { status: 500 })
  }
}
