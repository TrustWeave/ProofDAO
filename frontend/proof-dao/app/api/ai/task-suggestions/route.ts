import { type NextRequest, NextResponse } from "next/server"
import { TaskValidationService } from "@/lib/ai-agent-server"

export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json()

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 })
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
    const suggestions = await validationService.getTaskSuggestions(task)

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error("Task suggestions error:", error)

    return NextResponse.json({ error: "Failed to generate task suggestions. Please try again." }, { status: 500 })
  }
}
