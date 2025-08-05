"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  ArrowLeft,
  Target,
  Coins,
  Calendar,
  Trophy,
  Award,
  Shield,
  ExternalLink,
  CheckCircle,
  Star,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTRACT_ADDRESS_DAO, CONTRACT_ADDRESS_REPUTATION } from "@/utils/constants"
import ReputationNFTCard from "@/components/reputation-nftcard"

interface UserStats {
  points: number
  completedTasks: number
  earnings: string
  level: number
  nextLevelPoints: number
}

interface Submission {
  id: string
  taskId: string
  taskTitle: string
  daoName: string
  workURI: string
  submittedAt: number
  status: number
  feedback: string
  qualityScore: number
  reward: string
}

interface DAO {
  id: string
  name: string
  description: string
  createdAt: number
  totalTasks: number
  totalRewards: string
}

const contractABI = [
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userPoints",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userCompletedTasks",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userEarnings",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserSubmissions",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserDAOs",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
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
]

const reputationContractABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserReputations",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "reputations",
    outputs: [
      { internalType: "address", name: "contributor", type: "address" },
      { internalType: "uint8", name: "skillType", type: "uint8" },
      { internalType: "uint8", name: "level", type: "uint8" },
      { internalType: "uint256", name: "completedTasks", type: "uint256" },
      { internalType: "uint256", name: "totalEarnings", type: "uint256" },
      { internalType: "uint256", name: "averageQuality", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "lastUpdated", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getReputationBadges",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "socialLinks",
    outputs: [
      { internalType: "string", name: "github", type: "string" },
      { internalType: "string", name: "twitter", type: "string" },
      { internalType: "string", name: "discord", type: "string" },
      { internalType: "string", name: "linkedin", type: "string" },
      { internalType: "string", name: "website", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userAddress = params.address as string

  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    completedTasks: 0,
    earnings: "0",
    level: 1,
    nextLevelPoints: 1000,
  })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [userDAOs, setUserDAOs] = useState<DAO[]>([])
  const [userReputations, setUserReputations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [reputationContract, setReputationContract] = useState<ethers.Contract | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  // Initialize ethers and contract
  useEffect(() => {
    const initializeEthers = async () => {
      try {
        let provider: ethers.Provider

        if (typeof window !== "undefined" && window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
          setAccount(accounts[0])
        } else {
          provider = new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link")
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, provider)
        setContract(contract)
        setProvider(provider as ethers.BrowserProvider)

        // Initialize reputation contract if available
        if (CONTRACT_ADDRESS_REPUTATION) {
          const reputationContract = new ethers.Contract(CONTRACT_ADDRESS_REPUTATION, reputationContractABI, provider)
          setReputationContract(reputationContract)
        }
      } catch (error) {
        console.error("Failed to initialize ethers:", error)
        setIsLoading(false)
      }
    }

    initializeEthers()
  }, [])

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!contract || !userAddress) return

      try {
        const [points, completedTasks, earnings] = await Promise.all([
          contract.userPoints(userAddress),
          contract.userCompletedTasks(userAddress),
          contract.userEarnings(userAddress),
        ])

        // Calculate level based on points (every 1000 points = 1 level)
        const pointsNum = Number(points)
        const level = Math.floor(pointsNum / 1000) + 1
        const nextLevelPoints = level * 1000

        setUserStats({
          points: pointsNum,
          completedTasks: Number(completedTasks),
          earnings: earnings.toString(),
          level,
          nextLevelPoints,
        })
      } catch (error) {
        console.error("Error loading user stats:", error)
      }
    }

    loadUserStats()
  }, [contract, userAddress])

  // Load user reputation NFTs
  useEffect(() => {
    const loadUserReputations = async () => {
      if (!reputationContract || !userAddress) return

      try {
        const tokenIds = await reputationContract.getUserReputations(userAddress)
        setUserReputations(tokenIds.map((id: any) => id.toString()))
      } catch (error) {
        console.error("Error loading user reputations:", error)
      }
    }

    loadUserReputations()
  }, [reputationContract, userAddress])

  // Load user submissions
  useEffect(() => {
    const loadUserSubmissions = async () => {
      if (!contract || !userAddress) return

      try {
        const submissionIds = await contract.getUserSubmissions(userAddress)
        const submissionList: Submission[] = []

        for (const submissionId of submissionIds) {
          try {
            const submissionData = await contract.submissions(submissionId)
            const [id, taskId, contributor, workURI, proofData, submittedAt, status, feedback, qualityScore] =
              submissionData

            // Get task details
            const taskData = await contract.tasks(taskId)
            const taskTitle = taskData[2] // title is at index 2
            const taskReward = taskData[6] // reward is at index 6
            const daoId = taskData[1] // daoId is at index 1

            // Get DAO name
            const daoData = await contract.daos(daoId)
            const daoName = daoData[1] // name is at index 1

            submissionList.push({
              id: id.toString(),
              taskId: taskId.toString(),
              taskTitle,
              daoName,
              workURI,
              submittedAt: Number(submittedAt),
              status: Number(status),
              feedback,
              qualityScore: Number(qualityScore),
              reward: taskReward.toString(),
            })
          } catch (error) {
            console.error(`Error loading submission ${submissionId}:`, error)
          }
        }

        setSubmissions(submissionList.sort((a, b) => b.submittedAt - a.submittedAt))
      } catch (error) {
        console.error("Error loading user submissions:", error)
      }
    }

    loadUserSubmissions()
  }, [contract, userAddress])

  // Load user DAOs
  useEffect(() => {
    const loadUserDAOs = async () => {
      if (!contract || !userAddress) return

      try {
        const daoIds = await contract.getUserDAOs(userAddress)
        const daoList: DAO[] = []

        for (const daoId of daoIds) {
          try {
            const daoData = await contract.daos(daoId)
            const [id, name, description, creator, metadataURI, createdAt, isActive, totalTasks, totalRewards] = daoData

            if (isActive) {
              daoList.push({
                id: id.toString(),
                name,
                description,
                createdAt: Number(createdAt),
                totalTasks: Number(totalTasks),
                totalRewards: totalRewards.toString(),
              })
            }
          } catch (error) {
            console.error(`Error loading DAO ${daoId}:`, error)
          }
        }

        setUserDAOs(daoList.sort((a, b) => b.createdAt - a.createdAt))
      } catch (error) {
        console.error("Error loading user DAOs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserDAOs()
  }, [contract, userAddress])

  const formatReward = (reward: string) => {
    const value = Number.parseFloat(ethers.formatEther(reward))
    return value.toFixed(4)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
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

  const getSuccessRate = () => {
    if (submissions.length === 0) return 0
    const approved = submissions.filter((s) => s.status === 1).length
    return Math.round((approved / submissions.length) * 100)
  }

  const getAverageQualityScore = () => {
    const approvedSubmissions = submissions.filter((s) => s.status === 1 && s.qualityScore > 0)
    if (approvedSubmissions.length === 0) return 0
    const total = approvedSubmissions.reduce((sum, s) => sum + s.qualityScore, 0)
    return Math.round(total / approvedSubmissions.length)
  }

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
            <p className="text-slate-300 text-lg">Loading profile...</p>
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
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-6 mb-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl">
                {userAddress.substring(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{formatAddress(userAddress)}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg">
                  Level {userStats.level}
                </Badge>
                <div className="flex items-center text-slate-400">
                  <Trophy className="w-4 h-4 mr-1" />
                  {userStats.points.toLocaleString()} points
                </div>
                <div className="flex items-center text-slate-400">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {userStats.completedTasks} tasks completed
                </div>
                {userReputations.length > 0 && (
                  <div className="flex items-center text-slate-400">
                    <Award className="w-4 h-4 mr-1" />
                    {userReputations.length} reputation NFTs
                  </div>
                )}
              </div>

              {/* Level Progress */}
              <div className="max-w-md">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Level Progress</span>
                  <span className="text-white">
                    {userStats.nextLevelPoints - userStats.points} points to Level {userStats.level + 1}
                  </span>
                </div>
                <Progress value={(userStats.points % 1000) / 10} className="h-3 bg-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-400">{formatReward(userStats.earnings)} METIS</p>
                </div>
                <Coins className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{getSuccessRate()}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Quality Score</p>
                  <p className="text-2xl font-bold text-purple-400">{getAverageQualityScore()}/100</p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">DAOs Created</p>
                  <p className="text-2xl font-bold text-yellow-400">{userDAOs.length}</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="submissions">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="submissions" className="data-[state=active]:bg-slate-700">
              Submissions ({submissions.length})
            </TabsTrigger>
            <TabsTrigger value="daos" className="data-[state=active]:bg-slate-700">
              Created DAOs ({userDAOs.length})
            </TabsTrigger>
            {userReputations.length > 0 && (
              <TabsTrigger value="reputation" className="data-[state=active]:bg-slate-700">
                Reputation NFTs ({userReputations.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
              Analytics
            </TabsTrigger>
          </TabsList>

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
                              <h3 className="text-lg font-semibold text-white">{submission.taskTitle}</h3>
                              {getSubmissionStatusBadge(submission.status)}
                            </div>
                            <p className="text-slate-400 text-sm mb-2">
                              for <span className="text-blue-400">{submission.daoName}</span>
                            </p>
                            <div className="flex items-center space-x-6 text-sm text-slate-400 mb-3">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Submitted {formatDate(submission.submittedAt)}
                              </div>
                              <div className="flex items-center">
                                <Coins className="w-4 h-4 mr-1" />
                                {formatReward(submission.reward)} METIS
                              </div>
                              {submission.qualityScore > 0 && (
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 mr-1" />
                                  {submission.qualityScore}/100
                                </div>
                              )}
                            </div>

                            {submission.feedback && (
                              <div className="mb-3">
                                <p className="text-slate-400 text-sm">Feedback:</p>
                                <p className="text-slate-300 text-sm">{submission.feedback}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/task/${submission.taskId}`)}
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              View Task
                            </Button>
                            {submission.workURI && (
                              <Button
                                size="sm"
                                onClick={() => window.open(submission.workURI, "_blank")}
                                variant="outline"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Work
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
                  <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                  <p className="text-slate-400 mb-6">This user hasn't submitted any work yet.</p>
                  <Button onClick={() => router.push("/dao")} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    Browse Tasks
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="daos" className="mt-6">
            <div className="space-y-6">
              {userDAOs.length > 0 ? (
                <div className="grid gap-6">
                  {userDAOs.map((dao) => (
                    <Card key={dao.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-white mb-2">{dao.name}</h3>
                            <p className="text-slate-300 mb-4">{dao.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-400">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Created {formatDate(dao.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                {dao.totalTasks} tasks
                              </div>
                              <div className="flex items-center">
                                <Coins className="w-4 h-4 mr-1" />
                                {formatReward(dao.totalRewards)} METIS total rewards
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/dao/${dao.id}`)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600"
                          >
                            View DAO
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No DAOs Created</h3>
                  <p className="text-slate-400 mb-6">This user hasn't created any DAOs yet.</p>
                  <Button
                    onClick={() => router.push("/create-dao")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    Create DAO
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {userReputations.length > 0 && (
            <TabsContent value="reputation" className="mt-6">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userReputations.map((tokenId) => (
                    <ReputationNFTCard
                      key={tokenId}
                      tokenId={tokenId}
                      contract={reputationContract}
                      provider={provider}
                      account={account}
                      isOwner={account?.toLowerCase() === userAddress.toLowerCase()}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Success Rate</span>
                        <span className="text-white">{getSuccessRate()}%</span>
                      </div>
                      <Progress value={getSuccessRate()} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Average Quality Score</span>
                        <span className="text-white">{getAverageQualityScore()}/100</span>
                      </div>
                      <Progress value={getAverageQualityScore()} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Level Progress</span>
                        <span className="text-white">Level {userStats.level}</span>
                      </div>
                      <Progress value={(userStats.points % 1000) / 10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-400" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Submissions:</span>
                      <span className="text-white">{submissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Approved:</span>
                      <span className="text-green-400">{submissions.filter((s) => s.status === 1).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pending:</span>
                      <span className="text-yellow-400">{submissions.filter((s) => s.status === 0).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rejected:</span>
                      <span className="text-red-400">{submissions.filter((s) => s.status === 2).length}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Points:</span>
                        <span className="text-blue-400 font-medium">{userStats.points.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Earnings:</span>
                        <span className="text-green-400 font-medium">{formatReward(userStats.earnings)} METIS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Reputation NFTs:</span>
                        <span className="text-purple-400 font-medium">{userReputations.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                    Achievements & Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {userStats.completedTasks >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <Award className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-green-400 font-medium">First Task</p>
                          <p className="text-slate-300 text-sm">Completed your first task</p>
                        </div>
                      </div>
                    )}

                    {userStats.completedTasks >= 5 && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <Target className="w-8 h-8 text-blue-400" />
                        <div>
                          <p className="text-blue-400 font-medium">Task Master</p>
                          <p className="text-slate-300 text-sm">Completed 5+ tasks</p>
                        </div>
                      </div>
                    )}

                    {userDAOs.length >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                        <Shield className="w-8 h-8 text-purple-400" />
                        <div>
                          <p className="text-purple-400 font-medium">DAO Creator</p>
                          <p className="text-slate-300 text-sm">Created your first DAO</p>
                        </div>
                      </div>
                    )}

                    {getSuccessRate() >= 80 && submissions.length >= 3 && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                        <Star className="w-8 h-8 text-yellow-400" />
                        <div>
                          <p className="text-yellow-400 font-medium">High Performer</p>
                          <p className="text-slate-300 text-sm">80%+ success rate</p>
                        </div>
                      </div>
                    )}

                    {userStats.points >= 1000 && (
                      <div className="flex items-center space-x-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg">
                        <Trophy className="w-8 h-8 text-orange-400" />
                        <div>
                          <p className="text-orange-400 font-medium">Point Collector</p>
                          <p className="text-slate-300 text-sm">Earned 1000+ points</p>
                        </div>
                      </div>
                    )}

                    {Number.parseFloat(formatReward(userStats.earnings)) >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                        <Coins className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-green-400 font-medium">Earner</p>
                          <p className="text-slate-300 text-sm">Earned 1+ METIS</p>
                        </div>
                      </div>
                    )}

                    {userReputations.length >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                        <Award className="w-8 h-8 text-purple-400" />
                        <div>
                          <p className="text-purple-400 font-medium">Reputation Holder</p>
                          <p className="text-slate-300 text-sm">Owns reputation NFTs</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {userStats.completedTasks === 0 && userDAOs.length === 0 && userReputations.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No achievements yet</p>
                      <p className="text-slate-500 text-sm">Complete tasks and create DAOs to earn badges</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
