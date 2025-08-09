import { NextRequest, NextResponse } from 'next/server'
import { TaskValidationService } from '@/ai-agent'

export async function POST(request: NextRequest) {
  try {
    const { task } = await request.json()

    if (!task) {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      )
    }

    const validationService = new TaskValidationService()
    // Note: This would need to be implemented in the TaskValidationService
    // For now, we'll return mock suggestions
    const suggestions = [
      "Consider adding more specific deliverables to reduce ambiguity",
      "Include estimated time requirements for better contributor matching",
      "Add skill level requirements to attract qualified contributors",
      "Specify evaluation criteria more clearly"
    ]

    return NextResponse.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Task suggestions error:', error)
    
    return NextResponse.json(
      { error: 'Failed to generate task suggestions. Please try again.' },
      { status: 500 }
    )
  }
}
