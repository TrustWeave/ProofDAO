import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap,
  TrendingUp,
  Shield,
  Eye,
  MessageSquare,
  Activity,
  Bot,
  Sparkles
} from 'lucide-react';

interface AIValidationResult {
  aiScore: number;
  aiRecommendation: 'APPROVE' | 'REJECT' | 'REVIEW';
  aiFeedback: string;
  aiFlags: string[];
  confidence: number;
  processingTime?: number;
}

interface SubmissionWithAI {
  id: string;
  taskId: string;
  contributor: string;
  workURI: string;
  proofData: string;
  submittedAt: number;
  status: number;
  aiValidation?: AIValidationResult;
  isProcessing?: boolean;
}

interface AIValidationDashboardProps {
  submissions: SubmissionWithAI[];
  onValidateSubmission: (submissionId: string) => Promise<void>;
  onBatchValidate: (submissionIds: string[]) => Promise<void>;
  onApproveWithAI: (submissionId: string) => Promise<void>;
  onRejectWithAI: (submissionId: string) => Promise<void>;
}

export default function AIValidationDashboard({ 
  submissions, 
  onValidateSubmission, 
  onBatchValidate,
  onApproveWithAI,
  onRejectWithAI
}: AIValidationDashboardProps) {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'AI_PROCESSED' | 'HIGH_CONFIDENCE'>('ALL');

  // Filter submissions based on current filter
  const filteredSubmissions = submissions.filter(submission => {
    switch (filter) {
      case 'PENDING':
        return submission.status === 0 && !submission.aiValidation;
      case 'AI_PROCESSED':
        return submission.aiValidation !== undefined;
      case 'HIGH_CONFIDENCE':
        return submission.aiValidation && submission.aiValidation.confidence > 0.8;
      default:
        return true;
    }
  });

  // Calculate AI validation statistics
  const aiStats = {
    totalProcessed: submissions.filter(s => s.aiValidation).length,
    highConfidence: submissions.filter(s => s.aiValidation && s.aiValidation.confidence > 0.8).length,
    avgScore: submissions
      .filter(s => s.aiValidation)
      .reduce((acc, s) => acc + (s.aiValidation?.aiScore || 0), 0) / 
      Math.max(1, submissions.filter(s => s.aiValidation).length),
    autoApproved: submissions.filter(s => s.aiValidation?.aiRecommendation === 'APPROVE').length,
    flaggedForReview: submissions.filter(s => s.aiValidation && s.aiValidation.aiFlags.length > 0).length
  };

  const handleBatchValidation = async () => {
    if (selectedSubmissions.size === 0) return;
    
    setIsProcessingBatch(true);
    try {
      await onBatchValidate(Array.from(selectedSubmissions));
      setSelectedSubmissions(new Set());
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelection = new Set(selectedSubmissions);
    if (newSelection.has(submissionId)) {
      newSelection.delete(submissionId);
    } else {
      newSelection.add(submissionId);
    }
    setSelectedSubmissions(newSelection);
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'APPROVE':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'REJECT':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Eye className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* AI Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">AI Processed</p>
                <p className="text-2xl font-bold text-white">{aiStats.totalProcessed}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">High Confidence</p>
                <p className="text-2xl font-bold text-white">{aiStats.highConfidence}</p>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg AI Score</p>
                <p className="text-2xl font-bold text-white">{Math.round(aiStats.avgScore)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Flagged</p>
                <p className="text-2xl font-bold text-white">{aiStats.flaggedForReview}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <span>AI Validation Control Center</span>
            </div>
            <div className="flex items-center space-x-2">
              {/* Filter Controls */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-slate-700 border-slate-600 text-white text-sm rounded px-3 py-1"
              >
                <option value="ALL">All Submissions</option>
                <option value="PENDING">Pending AI Review</option>
                <option value="AI_PROCESSED">AI Processed</option>
                <option value="HIGH_CONFIDENCE">High Confidence</option>
              </select>

              {/* Batch Actions */}
              <Button
                onClick={handleBatchValidation}
                disabled={selectedSubmissions.size === 0 || isProcessingBatch}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessingBatch ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Batch Validate ({selectedSubmissions.size})
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Submissions List with AI Integration */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Submissions Found</h3>
              <p className="text-slate-400">
                {filter === 'PENDING' && "All submissions have been processed by AI"}
                {filter === 'AI_PROCESSED' && "No submissions have been processed yet"}
                {filter === 'HIGH_CONFIDENCE' && "No high-confidence AI results yet"}
                {filter === 'ALL' && "No submissions to display"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.has(submission.id)}
                    onChange={() => toggleSubmissionSelection(submission.id)}
                    className="mt-2 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    {/* Submission Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white">
                          Submission {submission.id.substring(0, 8)}
                        </h3>
                        <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">
                          {submission.contributor.substring(0, 6)}...{submission.contributor.substring(submission.contributor.length - 4)}
                        </Badge>
                        <span className="text-slate-400 text-sm">
                          {formatDate(submission.submittedAt)}
                        </span>
                      </div>

                      {/* Processing Status */}
                      {submission.isProcessing && (
                        <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700">
                          <Activity className="w-3 h-3 mr-1 animate-spin" />
                          Processing...
                        </Badge>
                      )}
                    </div>

                    {/* AI Validation Results */}
                    {submission.aiValidation ? (
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        {/* AI Score and Recommendation */}
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium flex items-center">
                              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                              AI Analysis
                            </h4>
                            <div className="flex items-center space-x-2">
                              {getRecommendationIcon(submission.aiValidation.aiRecommendation)}
                              <span className="text-white font-medium">
                                {submission.aiValidation.aiRecommendation}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Quality Score</span>
                                <span className="text-white font-medium">
                                  {submission.aiValidation.aiScore}/100
                                </span>
                              </div>
                              <Progress 
                                value={submission.aiValidation.aiScore} 
                                className="h-2"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">AI Confidence</span>
                                <span className={`font-medium ${getConfidenceColor(submission.aiValidation.confidence)}`}>
                                  {Math.round(submission.aiValidation.confidence * 100)}%
                                </span>
                              </div>
                              <Progress 
                                value={submission.aiValidation.confidence * 100} 
                                className="h-2"
                              />
                            </div>

                            {submission.aiValidation.processingTime && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Processing Time</span>
                                <span className="text-slate-300">
                                  {submission.aiValidation.processingTime}ms
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AI Feedback and Flags */}
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <h4 className="text-white font-medium flex items-center mb-3">
                            <MessageSquare className="w-4 h-4 mr-2 text-green-400" />
                            AI Feedback
                          </h4>

                          <div className="space-y-3">
                            <div>
                              <p className="text-slate-300 text-sm">
                                {submission.aiValidation.aiFeedback}
                              </p>
                            </div>

                            {submission.aiValidation.aiFlags.length > 0 && (
                              <div>
                                <h5 className="text-orange-400 text-sm font-medium mb-2 flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Flagged Issues
                                </h5>
                                <div className="space-y-1">
                                  {submission.aiValidation.aiFlags.map((flag, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="border-orange-600 text-orange-400 text-xs mr-2 mb-1"
                                    >
                                      {flag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-center py-4">
                          <Brain className="w-8 h-8 text-slate-400 mr-3" />
                          <div className="text-center">
                            <p className="text-slate-400">AI validation pending</p>
                            <p className="text-slate-500 text-sm">Click validate to process with AI</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submission Details */}
                    <div className="bg-slate-700/20 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-2">Submission Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 text-sm">Work URL:</span>
                          <a
                            href={submission.workURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-xs"
                          >
                            {submission.workURI}
                          </a>
                        </div>
                        {submission.proofData && (
                          <div>
                            <span className="text-slate-400 text-sm">Description:</span>
                            <p className="text-slate-300 text-sm mt-1">{submission.proofData}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {!submission.aiValidation ? (
                          <Button
                            onClick={() => onValidateSubmission(submission.id)}
                            disabled={submission.isProcessing}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {submission.isProcessing ? (
                              <>
                                <Activity className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Brain className="w-4 h-4 mr-2" />
                                AI Validate
                              </>
                            )}
                          </Button>
                        ) : (
                          <>
                            {submission.aiValidation.aiRecommendation === 'APPROVE' && (
                              <Button
                                onClick={() => onApproveWithAI(submission.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                AI Approve
                              </Button>
                            )}
                            
                            {submission.aiValidation.aiRecommendation === 'REJECT' && (
                              <Button
                                onClick={() => onRejectWithAI(submission.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-900/20"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                AI Reject
                              </Button>
                            )}

                            <Button
                              onClick={() => onValidateSubmission(submission.id)}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              Re-validate
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Confidence Indicator */}
                      {submission.aiValidation && (
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 text-sm">Confidence:</span>
                          <div className="flex items-center">
                            {submission.aiValidation.confidence >= 0.8 && (
                              <Shield className="w-4 h-4 text-green-400 mr-1" />
                            )}
                            {submission.aiValidation.confidence >= 0.6 && submission.aiValidation.confidence < 0.8 && (
                              <AlertTriangle className="w-4 h-4 text-yellow-400 mr-1" />
                            )}
                            {submission.aiValidation.confidence < 0.6 && (
                              <XCircle className="w-4 h-4 text-red-400 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${getConfidenceColor(submission.aiValidation.confidence)}`}>
                              {Math.round(submission.aiValidation.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AI Performance Analytics */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
            AI Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Accuracy Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">High Confidence Rate</span>
                  <span className="text-green-400">
                    {aiStats.totalProcessed > 0 ? Math.round((aiStats.highConfidence / aiStats.totalProcessed) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Auto-Approval Rate</span>
                  <span className="text-blue-400">
                    {aiStats.totalProcessed > 0 ? Math.round((aiStats.autoApproved / aiStats.totalProcessed) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Flag Rate</span>
                  <span className="text-orange-400">
                    {aiStats.totalProcessed > 0 ? Math.round((aiStats.flaggedForReview / aiStats.totalProcessed) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Quality Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Excellent (80-100)</span>
                  <span className="text-green-400">
                    {submissions.filter(s => s.aiValidation && s.aiValidation.aiScore >= 80).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Good (60-79)</span>
                  <span className="text-yellow-400">
                    {submissions.filter(s => s.aiValidation && s.aiValidation.aiScore >= 60 && s.aiValidation.aiScore < 80).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Poor (0-59)</span>
                  <span className="text-red-400">
                    {submissions.filter(s => s.aiValidation && s.aiValidation.aiScore < 60).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Efficiency Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Processed</span>
                  <span className="text-white">{aiStats.totalProcessed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg Processing Time</span>
                  <span className="text-slate-300">
                    {submissions.filter(s => s.aiValidation?.processingTime).length > 0
                      ? Math.round(
                          submissions
                            .filter(s => s.aiValidation?.processingTime)
                            .reduce((acc, s) => acc + (s.aiValidation?.processingTime || 0), 0) /
                          submissions.filter(s => s.aiValidation?.processingTime).length
                        )
                      : 0}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Time Saved</span>
                  <span className="text-green-400">
                    ~{Math.round(aiStats.totalProcessed * 15)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">AI Validation Agents Active</span>
              <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">
                Powered by Groq + Alith
              </Badge>
            </div>
            <div className="text-slate-400 text-sm">
              Ready to process submissions • Response time: ~2-3s
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}