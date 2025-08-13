import { type NextRequest, NextResponse } from "next/server"
import { TaskValidationService } from "@/lib/ai-agent-server"

export async function POST(request: NextRequest) {
  try {
    const { task, submission } = await request.json()

    if (!task || !submission) {
      return NextResponse.json({ error: "Task and submission are required" }, { status: 400 })
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
    const result = await validationService.validateSubmission(task, submission)
    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTime,
        validatedAt: Date.now(),
      },
    })
  } catch (error) {
    console.error("AI validation error:", error)

    if (error instanceof Error && error.message.includes("NEXT_PUBLIC_GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Please set NEXT_PUBLIC_GROQ_API_KEY environment variable." },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: "AI validation failed. Please try again." }, { status: 500 })
  }
}
