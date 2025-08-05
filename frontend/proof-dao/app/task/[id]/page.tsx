"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  ArrowLeft,
  Users,
  Target,
  Coins,
  Calendar,
  Clock,
  CheckCircle,
  ExternalLink,
  Shield,
  Share2,
  AlertCircle,
  FileText,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTRACT_ADDRESS_DAO } from "@/utils/constants"

interface Task {
  id: string
  daoId: string
  title: string
  description: string
  requirements: string
  metadataURI: string
  reward: string
  creator: string
  deadline: number
  createdAt: number
  status: number
  maxSubmissions: number
  currentSubmissions: number
  skillTags: string[]
}

interface Submission {
  id: string
  taskId: string
  contributor: string
  workURI: string
  proofData: string
  submittedAt: number
  status: number
  feedback: string
  qualityScore: number
}

interface DAO {
  id: string
  name: string
  description: string
  creator: string
}

const contractABI = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "tasks",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "requirements", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "reward", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "uint256", name: "maxSubmissions", type: "uint256" },
      { internalType: "uint256", name: "currentSubmissions", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "daos",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "totalTasks", type: "uint256" },
      { internalType: "uint256", name: "totalRewards", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "submissions",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint256", name: "taskId", type: "uint256" },
      { internalType: "address", name: "contributor", type: "address" },
      { internalType: "string", name: "workURI", type: "string" },
      { internalType: "string", name: "proofData", type: "string" },
      { internalType: "uint256", name: "submittedAt", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "string", name: "feedback", type: "string" },
      { internalType: "uint256", name: "qualityScore", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "taskId", type: "uint256" },
      { internalType: "string", name: "workURI", type: "string" },
      { internalType: "string", name: "proofData", type: "string" },
    ],
    name: "submitWork",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "submissionId", type: "uint256" },
      { internalType: "string", name: "feedback", type: "string" },
      { internalType: "uint256", name: "qualityScore", type: "uint256" },
    ],
    name: "approveSubmission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "submissionId", type: "uint256" },
      { internalType: "string", name: "feedback", type: "string" },
    ],
    name: "rejectSubmission",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "submissionId", type: "uint256" }],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "taskId", type: "uint256" }],
    name: "cancelTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "taskId", type: "uint256" }],
    name: "getTaskSubmissions",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "taskId", type: "uint256" }],
    name: "getTaskSkillTags",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
]

export default function TaskDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [dao, setDao] = useState<DAO | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)

  const [showSubmitWork, setShowSubmitWork] = useState(false)
  const [showReviewSubmission, setShowReviewSubmission] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  const [workForm, setWorkForm] = useState({
    workURI: "",
    proofData: "",
  })

  const [reviewForm, setReviewForm] = useState({
    feedback: "",
    qualityScore: 80,
  })

  // Initialize ethers and contract
  useEffect(() => {
    const initializeEthers = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send("eth_requestAccounts", [])
          const contract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, provider)

          setProvider(provider)
          setAccount(accounts[0])
          setContract(contract)
        }
      } catch (error) {
        console.error("Failed to initialize ethers:", error)
      }
    }

    initializeEthers()
  }, [])

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!contract || !taskId) return

      try {
        const taskData = await contract.tasks(BigInt(taskId))

        const [
          id,
          daoId,
          title,
          description,
          requirements,
          metadataURI,
          reward,
          creator,
          deadline,
          createdAt,
          status,
          maxSubmissions,
          currentSubmissions,
        ] = taskData

        // Get skill tags
        let skillTags: string[] = []
        try {
          skillTags = await contract.getTaskSkillTags(BigInt(taskId))
        } catch (error) {
          console.error("Error loading skill tags:", error)
        }

        const taskObj: Task = {
          id: id.toString(),
          daoId: daoId.toString(),
          title,
          description,
          requirements,
          metadataURI,
          reward: reward.toString(),
          creator,
          deadline: Number(deadline),
          createdAt: Number(createdAt),
          status: Number(status),
          maxSubmissions: Number(maxSubmissions),
          currentSubmissions: Number(currentSubmissions),
          skillTags,
        }

        setTask(taskObj)

        // Load DAO data
        const daoData = await contract.daos(BigInt(daoId))
        const [daoIdRes, name, daoDescription, daoCreator] = daoData

        setDao({
          id: daoIdRes.toString(),
          name,
          description: daoDescription,
          creator: daoCreator,
        })
      } catch (error) {
        console.error("Error loading task:", error)
      }
    }

    loadTask()
  }, [contract, taskId])

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!contract || !taskId) return

      try {
        const submissionIds = await contract.getTaskSubmissions(BigInt(taskId))
        const submissionList: Submission[] = []

        for (const submissionId of submissionIds) {
          try {
            const submissionData = await contract.submissions(submissionId)
            const [id, taskId, contributor, workURI, proofData, submittedAt, status, feedback, qualityScore] =
              submissionData

            submissionList.push({
              id: id.toString(),
              taskId: taskId.toString(),
              contributor,
              workURI,
              proofData,
              submittedAt: Number(submittedAt),
              status: Number(status),
              feedback,
              qualityScore: Number(qualityScore),
            })
          } catch (error) {
            console.error(`Error loading submission ${submissionId}:`, error)
          }
        }

        setSubmissions(submissionList)
      } catch (error) {
        console.error("Error loading submissions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (contract && task) {
      loadSubmissions()
    }
  }, [contract, task, taskId])

  const handleSubmitWork = async () => {
    if (!contract || !provider || !task || !workForm.workURI.trim()) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      // @ts-expect-error: submitWork is a custom contract method
      const tx = await contractWithSigner.submitWork(BigInt(task.id), workForm.workURI, workForm.proofData || "")

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowSubmitWork(false)
      setWorkForm({ workURI: "", proofData: "" })

      window.location.reload()
    } catch (error: any) {
      console.error("Error submitting work:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error submitting work. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveSubmission = async () => {
    if (!contract || !provider || !selectedSubmission || !reviewForm.feedback.trim()) {
      alert("Please provide feedback")
      return
    }

    try {
      setIsReviewing(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      // @ts-expect-error: approveSubmission is a custom contract method
      const tx = await contractWithSigner.approveSubmission(
        BigInt(selectedSubmission.id),
        reviewForm.feedback,
        BigInt(reviewForm.qualityScore),
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowReviewSubmission(false)
      setReviewForm({ feedback: "", qualityScore: 80 })
      setSelectedSubmission(null)

      window.location.reload()
    } catch (error: any) {
      console.error("Error approving submission:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error approving submission. Please try again.")
      }
    } finally {
      setIsReviewing(false)
    }
  }

  const handleRejectSubmission = async () => {
    if (!contract || !provider || !selectedSubmission || !reviewForm.feedback.trim()) {
      alert("Please provide feedback")
      return
    }

    try {
      setIsReviewing(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      // @ts-expect-error: rejectSubmission is a custom contract method
      const tx = await contractWithSigner.rejectSubmission(BigInt(selectedSubmission.id), reviewForm.feedback)

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowReviewSubmission(false)
      setReviewForm({ feedback: "", qualityScore: 80 })
      setSelectedSubmission(null)

      window.location.reload()
    } catch (error: any) {
      console.error("Error rejecting submission:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error rejecting submission. Please try again.")
      }
    } finally {
      setIsReviewing(false)
    }
  }

  const handleClaimReward = async (submissionId: string) => {
    if (!contract || !provider) {
      alert("Please connect your wallet")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      // @ts-expect-error: claimReward is a custom contract method
      const tx = await contractWithSigner.claimReward(BigInt(submissionId))

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      alert("Reward claimed successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error claiming reward:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error claiming reward. Please try again.")
      }
    }
  }

  const handleCancelTask = async () => {
    if (!contract || !provider || !task) {
      alert("Please connect your wallet")
      return
    }

    if (!confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)
      // @ts-expect-error: cancelTask is a custom contract method
      const tx = await contractWithSigner.cancelTask(BigInt(task.id))

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      alert("Task cancelled successfully!")
      router.push(`/dao/${task.daoId}`)
    } catch (error: any) {
      console.error("Error cancelling task:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error cancelling task. Please try again.")
      }
    }
  }

  const formatReward = (reward: string) => {
    const value = Number.parseFloat(ethers.formatEther(reward))
    return value.toFixed(4)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getTaskStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-900/50 text-green-400 border-green-700">Open</Badge>
      case 1:
        return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700">In Review</Badge>
      case 2:
        return <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">Completed</Badge>
      case 3:
        return <Badge className="bg-red-900/50 text-red-400 border-red-700">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-900/50 text-gray-400 border-gray-700">Unknown</Badge>
    }
  }

  const getSubmissionStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-yellow-900/50 text-yellow-400 border-yellow-700">Pending</Badge>
      case 1:
        return <Badge className="bg-green-900/50 text-green-400 border-green-700">Approved</Badge>
      case 2:
        return <Badge className="bg-red-900/50 text-red-400 border-red-700">Rejected</Badge>
      default:
        return <Badge className="bg-gray-900/50 text-gray-400 border-gray-700">Unknown</Badge>
    }
  }

  const canSubmitToTask = () => {
    if (!account || !task) return false
    if (task.creator.toLowerCase() === account.toLowerCase()) return false
    if (task.status !== 0) return false
    if (Date.now() > task.deadline * 1000) return false
    if (task.currentSubmissions >= task.maxSubmissions) return false

    const userSubmission = submissions.find((sub) => sub.contributor.toLowerCase() === account.toLowerCase())
    return !userSubmission
  }

  const canReviewSubmission = (submission: Submission) => {
    if (!account || !task || !dao) return false

    return (
      submission.status === 0 && // Pending
      (task.creator.toLowerCase() === account.toLowerCase() || dao.creator.toLowerCase() === account.toLowerCase())
    )
  }

  const canClaimReward = (submission: Submission) => {
    if (!account) return false
    return (
      submission.status === 1 && // Approved
      submission.contributor.toLowerCase() === account.toLowerCase()
    )
  }

  const isTaskCreator = task && account && task.creator.toLowerCase() === account.toLowerCase()
  const isDAOCreator = dao && account && dao.creator.toLowerCase() === account.toLowerCase()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
        <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">Loading task...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!task || !dao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
        <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Task Not Found</h2>
            <p className="text-slate-300 mb-6">The task you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/dao")} className="bg-gradient-to-r from-blue-600 to-cyan-600">
              Browse Tasks
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push(`/dao/${task.daoId}`)}
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to DAO
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {(isTaskCreator || isDAOCreator) && task.status === 0 && (
                <Button
                  onClick={handleCancelTask}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                >
                  Cancel Task
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-4xl font-bold text-white">{task.title}</h1>
                {getTaskStatusBadge(task.status)}
              </div>

              <div className="flex items-center space-x-6 text-slate-400 mb-4">
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  <span>Task #{task.id}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {formatDate(task.createdAt)}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Due {formatDate(task.deadline)}
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <Button
                  onClick={() => router.push(`/dao/${dao.id}`)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {dao.name}
                </Button>
                <span className="text-slate-400">
                  by {task.creator.slice(0, 6)}...{task.creator.slice(-4)}
                </span>
              </div>
            </div>

            {canSubmitToTask() && (
              <Button
                onClick={() => setShowSubmitWork(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                Submit Work
              </Button>
            )}
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Reward</p>
                  <p className="text-2xl font-bold text-green-400">{formatReward(task.reward)} METIS</p>
                </div>
                <Coins className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Submissions</p>
                  <p className="text-2xl font-bold text-white">
                    {task.currentSubmissions}/{task.maxSubmissions}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Time Left</p>
                  <p className="text-2xl font-bold text-white">
                    {task.deadline * 1000 > Date.now()
                      ? Math.ceil((task.deadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) + "d"
                      : "Expired"}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-lg font-bold text-white">
                    {task.status === 0
                      ? "Open"
                      : task.status === 1
                        ? "In Review"
                        : task.status === 2
                          ? "Completed"
                          : "Cancelled"}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">
              Task Details
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-slate-700">
              Submissions ({submissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-400" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">{task.description}</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{task.requirements}</p>
                  </CardContent>
                </Card>

                {task.skillTags.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Star className="w-5 h-5 mr-2 text-yellow-400" />
                        Required Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {task.skillTags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Task Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reward:</span>
                      <span className="text-green-400 font-medium">{formatReward(task.reward)} METIS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Submissions:</span>
                      <span className="text-white">{task.maxSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Submissions:</span>
                      <span className="text-white">{task.currentSubmissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deadline:</span>
                      <span className="text-white">{formatDate(task.deadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      {getTaskStatusBadge(task.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">DAO Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-400">DAO Name</Label>
                      <p className="text-white font-medium">{dao.name}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400">Creator</Label>
                      <p className="text-slate-300 font-mono text-sm">
                        {task.creator.substring(0, 6)}...{task.creator.substring(task.creator.length - 4)}
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push(`/dao/${dao.id}`)}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      View DAO
                    </Button>
                  </CardContent>
                </Card>

                {task.deadline * 1000 < Date.now() && (
                  <Card className="bg-red-900/20 border-red-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-medium">Task Expired</span>
                      </div>
                      <p className="text-red-300 text-sm mt-2">
                        This task has passed its deadline and no longer accepts submissions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <div className="space-y-6">
              {submissions.length > 0 ? (
                <div className="grid gap-6">
                  {submissions.map((submission) => (
                    <Card key={submission.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                                  {submission.contributor.substring(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-white font-medium">
                                  {submission.contributor.substring(0, 6)}...
                                  {submission.contributor.substring(submission.contributor.length - 4)}
                                </p>
                                <p className="text-slate-400 text-sm">Submitted {formatDate(submission.submittedAt)}</p>
                              </div>
                              {getSubmissionStatusBadge(submission.status)}
                            </div>

                            {submission.workURI && (
                              <div className="mb-3">
                                <Label className="text-slate-400 text-sm">Work Submission:</Label>
                                <a
                                  href={submission.workURI}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm ml-2 flex items-center"
                                >
                                  View Work <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                              </div>
                            )}

                            {submission.proofData && (
                              <div className="mb-3">
                                <Label className="text-slate-400 text-sm">Description:</Label>
                                <p className="text-slate-300 text-sm mt-1">{submission.proofData}</p>
                              </div>
                            )}

                            {submission.feedback && (
                              <div className="mb-3">
                                <Label className="text-slate-400 text-sm">Feedback:</Label>
                                <p className="text-slate-300 text-sm mt-1">{submission.feedback}</p>
                              </div>
                            )}

                            {submission.qualityScore > 0 && (
                              <div className="mb-3">
                                <Label className="text-slate-400 text-sm">Quality Score:</Label>
                                <span className="text-green-400 font-medium ml-2">{submission.qualityScore}/100</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2">
                            {canReviewSubmission(submission) && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission)
                                  setShowReviewSubmission(true)
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Review
                              </Button>
                            )}

                            {canClaimReward(submission) && (
                              <Button
                                size="sm"
                                onClick={() => handleClaimReward(submission.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Coins className="w-4 h-4 mr-1" />
                                Claim Reward
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                  <p className="text-slate-400 mb-6">Be the first to submit work for this task!</p>
                  {canSubmitToTask() && (
                    <Button
                      onClick={() => setShowSubmitWork(true)}
                      className="bg-gradient-to-r from-green-600 to-blue-600"
                    >
                      Submit Work
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Work Submission Dialog */}
      <Dialog open={showSubmitWork} onOpenChange={setShowSubmitWork}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Work</DialogTitle>
            <p className="text-slate-300">
              Submit your work for: <span className="text-blue-400">{task.title}</span>
            </p>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-white">Work URL/Link *</Label>
              <Input
                value={workForm.workURI}
                onChange={(e) => setWorkForm((prev) => ({ ...prev, workURI: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="https://github.com/user/repo or https://drive.google.com/..."
              />
              <p className="text-xs text-slate-400 mt-1">
                Link to your completed work (GitHub repo, Google Drive, etc.)
              </p>
            </div>

            <div>
              <Label className="text-white">Proof/Description (Optional)</Label>
              <Textarea
                value={workForm.proofData}
                onChange={(e) => setWorkForm((prev) => ({ ...prev, proofData: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="Describe your work, provide additional context, or include proof of completion..."
                rows={4}
              />
            </div>

            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Task Requirements:</h4>
              <p className="text-slate-300 text-sm">{task.requirements}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-slate-400">
                <span>Reward: {formatReward(task.reward)} METIS</span>
                <span>Deadline: {formatDate(task.deadline)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowSubmitWork(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitWork}
                disabled={isSubmitting || !workForm.workURI.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Work"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Submission Dialog */}
      <Dialog open={showReviewSubmission} onOpenChange={setShowReviewSubmission}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Review Submission</DialogTitle>
            <p className="text-slate-300">
              Review work from:{" "}
              <span className="text-blue-400">
                {selectedSubmission?.contributor.substring(0, 6)}...
                {selectedSubmission?.contributor.substring(selectedSubmission.contributor.length - 4)}
              </span>
            </p>
          </DialogHeader>
          <div className="space-y-6">
            {selectedSubmission && (
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Submitted Work:</h4>
                <a
                  href={selectedSubmission.workURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center"
                >
                  View Work <ExternalLink className="w-4 h-4 ml-1" />
                </a>
                {selectedSubmission.proofData && (
                  <div className="mt-3">
                    <h5 className="text-slate-300 font-medium mb-1">Description:</h5>
                    <p className="text-slate-300 text-sm">{selectedSubmission.proofData}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-white">Quality Score (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={reviewForm.qualityScore}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, qualityScore: Number.parseInt(e.target.value) || 0 }))
                }
                className="bg-slate-700 border-slate-600 text-white mt-2"
              />
              <p className="text-xs text-slate-400 mt-1">
                Rate the quality of the submission (affects contributor bonus points)
              </p>
            </div>

            <div>
              <Label className="text-white">Feedback *</Label>
              <Textarea
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, feedback: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="Provide feedback on the submission..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowReviewSubmission(false)} disabled={isReviewing}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectSubmission}
                disabled={isReviewing || !reviewForm.feedback.trim()}
                className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
              >
                {isReviewing ? "Processing..." : "Reject"}
              </Button>
              <Button
                onClick={handleApproveSubmission}
                disabled={isReviewing || !reviewForm.feedback.trim()}
                className="bg-gradient-to-r from-green-600 to-blue-600"
              >
                {isReviewing ? "Processing..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
