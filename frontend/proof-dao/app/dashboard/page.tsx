"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  Users,
  Calendar,
  Coins,
  Shield,
  Plus,
  ArrowRight,
  CheckCircle,
  Target,
  Trophy,
  Award,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CONTRACT_ADDRESS_DAO, CONTRACT_ADDRESS_REPUTATION } from "@/utils/constants"
import ReputationNFTCard from "@/components/reputation-nftcard"

interface DAO {
  id: string
  name: string
  description: string
  creator: string
  metadataURI: string
  createdAt: number
  isActive: boolean
  totalTasks: number
  totalRewards: string
  category?: string
  members?: number
}

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

interface UserStats {
  points: number
  completedTasks: number
  earnings: string
  level: number
  nextLevelPoints: number
}

const contractABI = [
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
    inputs: [],
    name: "getCurrentCounters",
    outputs: [
      { internalType: "uint256", name: "daos", type: "uint256" },
      { internalType: "uint256", name: "tasks", type: "uint256" },
      { internalType: "uint256", name: "submissions", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
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
    inputs: [{ internalType: "uint256", name: "daoId", type: "uint256" }],
    name: "getDAOTasks",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
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

export default function DashboardPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [daos, setDaos] = useState<DAO[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [userReputations, setUserReputations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [reputationContract, setReputationContract] = useState<ethers.Contract | null>(null)
  const [totalDAOs, setTotalDAOs] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)
  const [account, setAccount] = useState<string | null>(null)

  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    completedTasks: 0,
    earnings: "0",
    level: 1,
    nextLevelPoints: 1000,
  })

  // Initialize ethers provider and contract
  useEffect(() => {
    const initializeEthers = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send("eth_requestAccounts", [])
          const contract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, provider)

          setProvider(provider)
          setContract(contract)
          setAccount(accounts[0])

          // Initialize reputation contract if available
          if (CONTRACT_ADDRESS_REPUTATION) {
            const reputationContract = new ethers.Contract(CONTRACT_ADDRESS_REPUTATION, reputationContractABI, provider)
            setReputationContract(reputationContract)
          }

          // Get total counters
          const counters = await contract.getCurrentCounters()
          setTotalDAOs(Number(counters[0]))
          setTotalTasks(Number(counters[1]))
        } else {
          // For read-only operations
          const provider = new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link")
          const contract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, provider)

          setContract(contract)

          const counters = await contract.getCurrentCounters()
          setTotalDAOs(Number(counters[0]))
          setTotalTasks(Number(counters[1]))
        }
      } catch (error) {
        console.error("Error initializing ethers:", error)
        setIsLoading(false)
      }
    }

    initializeEthers()
  }, [])

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      if (!contract || !account) return

      try {
        const [points, completedTasks, earnings] = await Promise.all([
          contract.userPoints(account),
          contract.userCompletedTasks(account),
          contract.userEarnings(account),
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
  }, [contract, account])

  // Load user reputation NFTs
  useEffect(() => {
    const loadUserReputations = async () => {
      if (!reputationContract || !account) return

      try {
        const tokenIds = await reputationContract.getUserReputations(account)
        setUserReputations(tokenIds.map((id: any) => id.toString()))
      } catch (error) {
        console.error("Error loading user reputations:", error)
      }
    }

    loadUserReputations()
  }, [reputationContract, account])

  // Load recent DAOs and tasks
  useEffect(() => {
    const fetchRecentData = async () => {
      if (!contract || totalDAOs === 0) {
        setIsLoading(false)
        return
      }

      const daoList: DAO[] = []
      const taskList: Task[] = []

      // Load recent DAOs (last 6)
      const startDAO = Math.max(1, totalDAOs - 5)
      for (let i = totalDAOs; i >= startDAO; i--) {
        try {
          const result = await contract.daos(i)
          if (result && result[6]) {
            // isActive
            const [id, name, description, creator, metadataURI, createdAt, isActive, totalTasks, totalRewards] = result
            daoList.push({
              id: id.toString(),
              name,
              description,
              creator,
              metadataURI,
              createdAt: Number(createdAt),
              isActive,
              totalTasks: Number(totalTasks),
              totalRewards: totalRewards.toString(),
              category: "General",
              members: 1,
            })
          }
        } catch (err) {
          console.error(`Error fetching DAO ${i}:`, err)
        }
      }

      // Load recent tasks from recent DAOs
      for (const dao of daoList.slice(0, 3)) {
        try {
          const taskIds = await contract.getDAOTasks(BigInt(dao.id))
          for (const taskId of taskIds.slice(-2)) {
            // Get last 2 tasks per DAO
            try {
              const taskData = await contract.tasks(taskId)
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

              taskList.push({
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
                skillTags: [],
              })
            } catch (error) {
              console.error(`Error loading task ${taskId}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error loading tasks for DAO ${dao.id}:`, error)
        }
      }

      setDaos(daoList)
      setRecentTasks(taskList.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6))
      setIsLoading(false)
    }

    fetchRecentData()
  }, [contract, totalDAOs])

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
            <p className="text-slate-300 text-lg">Loading dashboard...</p>
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ProofDAO</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/dao")} variant="ghost" className="text-slate-300 hover:text-white">
                Browse DAOs
              </Button>
              <Button
                onClick={() => router.push("/reputation")}
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Reputation
              </Button>
              <Button
                onClick={() => router.push("/create-dao")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create DAO
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-xl text-slate-300">Welcome back! Here's what's happening in your DAOs</p>
        </div>

        {/* User Stats */}
        {account && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm">Your Points</p>
                      <p className="text-2xl font-bold text-white">{userStats.points.toLocaleString()}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm">Completed Tasks</p>
                      <p className="text-2xl font-bold text-white">{userStats.completedTasks}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-300 text-sm">Total Earnings</p>
                      <p className="text-2xl font-bold text-white">{formatReward(userStats.earnings)} METIS</p>
                    </div>
                    <Coins className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm">Reputation NFTs</p>
                      <p className="text-2xl font-bold text-white">{userReputations.length}</p>
                    </div>
                    <Award className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total DAOs</p>
                  <p className="text-2xl font-bold text-white">{totalDAOs}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Tasks</p>
                  <p className="text-2xl font-bold text-white">
                    {recentTasks.filter((task) => task.status === 0).length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{totalTasks}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Rewards</p>
                  <p className="text-2xl font-bold text-white">
                    {daos.reduce((sum, dao) => sum + Number.parseFloat(formatReward(dao.totalRewards)), 0).toFixed(2)}{" "}
                    METIS
                  </p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-700">
              Recent Tasks
            </TabsTrigger>
            <TabsTrigger value="daos" className="data-[state=active]:bg-slate-700">
              Recent DAOs
            </TabsTrigger>
            {userReputations.length > 0 && (
              <TabsTrigger value="reputation" className="data-[state=active]:bg-slate-700">
                My Reputation NFTs
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTasks.length > 0 ? (
                    <div className="space-y-4">
                      {recentTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div>
                            <h4 className="text-white font-medium">{task.title}</h4>
                            <p className="text-slate-400 text-sm">{formatReward(task.reward)} METIS</p>
                          </div>
                          {getTaskStatusBadge(task.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    Popular DAOs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {daos.length > 0 ? (
                    <div className="space-y-4">
                      {daos.slice(0, 3).map((dao) => (
                        <div key={dao.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                                {dao.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-white font-medium">{dao.name}</h4>
                              <p className="text-slate-400 text-sm">{dao.totalTasks} tasks</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dao/${dao.id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No DAOs available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-6">
              {recentTasks.length > 0 ? (
                <div className="grid gap-6">
                  {recentTasks.map((task) => (
                    <Card key={task.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                              {getTaskStatusBadge(task.status)}
                            </div>
                            <p className="text-slate-300 mb-4">{task.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-400">
                              <div className="flex items-center">
                                <Coins className="w-4 h-4 mr-1" />
                                {formatReward(task.reward)} METIS
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Due {formatDate(task.deadline)}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {task.currentSubmissions}/{task.maxSubmissions} submissions
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/task/${task.id}`)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600"
                          >
                            View Task
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Recent Tasks</h3>
                  <p className="text-slate-400 mb-6">Check back later for new opportunities</p>
                  <Button onClick={() => router.push("/dao")} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    Browse All Tasks
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="daos" className="mt-6">
            <div className="space-y-6">
              {daos.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {daos.map((dao) => (
                    <Card
                      key={dao.id}
                      className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
                      onClick={() => router.push(`/dao/${dao.id}`)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                {dao.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                                {dao.name}
                              </CardTitle>
                              <Badge className="bg-blue-900/50 text-blue-400 border-blue-700 text-xs">
                                {dao.category}
                              </Badge>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-slate-300 text-sm line-clamp-3">{dao.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-green-400" />
                            <span className="text-slate-400">{dao.totalTasks} Tasks</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-400">{dao.members} Members</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-slate-400">{formatReward(dao.totalRewards)} METIS</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="text-slate-400">{formatDate(dao.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-sm">Active</span>
                          </div>

                          <div className="text-slate-400 text-xs">
                            Creator: {dao.creator.slice(0, 6)}...{dao.creator.slice(-4)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No DAOs Available</h3>
                  <p className="text-slate-400 mb-6">Be the first to create a DAO on ProofDAO!</p>
                  <Button
                    onClick={() => router.push("/create-dao")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First DAO
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {userReputations.length > 0 && (
            <TabsContent value="reputation" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Your Reputation NFTs</h3>
                  <Button
                    onClick={() => router.push("/reputation")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userReputations.slice(0, 6).map((tokenId) => (
                    <ReputationNFTCard
                      key={tokenId}
                      tokenId={tokenId}
                      contract={reputationContract}
                      provider={provider}
                      account={account}
                      isOwner={true}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
