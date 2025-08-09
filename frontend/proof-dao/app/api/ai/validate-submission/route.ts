import { NextRequest, NextResponse } from 'next/server'
import { TaskValidationService } from '@/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const { task, submission } = await request.json()

    if (!task || !submission) {
      return NextResponse.json(
        { error: 'Task and submission are required' },
        { status: 400 }
      )
    }

    const validationService = new TaskValidationService()
    const result = await validationService.validateSubmission(task, submission)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('AI validation error:', error)
    
    if (error instanceof Error && error.message.includes('NEXT_PUBLIC_GROQ_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set NEXT_PUBLIC_GROQ_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'AI validation failed. Please try again.' },
      { status: 500 }
    )
  }
}
