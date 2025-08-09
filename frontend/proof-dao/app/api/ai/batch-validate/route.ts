import { NextRequest, NextResponse } from 'next/server'
import { TaskValidationService } from '@/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const { daoId, submissions, tasks } = await request.json()

    if (!daoId || !submissions || !tasks) {
      return NextResponse.json(
        { error: 'DAO ID, submissions, and tasks are required' },
        { status: 400 }
      )
    }

    const validationService = new TaskValidationService()
    const results = await validationService.processPendingSubmissions(daoId, submissions, tasks)

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Batch validation error:', error)
    
    if (error instanceof Error && error.message.includes('NEXT_PUBLIC_GROQ_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set NEXT_PUBLIC_GROQ_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Batch validation failed. Please try again.' },
      { status: 500 }
    )
  }
}
