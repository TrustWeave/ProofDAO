"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import {
  Search,
  Filter,
  Users,
  Calendar,
  Coins,
  TrendingUp,
  Shield,
  Plus,
  ArrowRight,
  CheckCircle,
  Target,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CONTRACT_ADDRESS_DAO } from "@/utils/constants"
import axios from "axios"

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
]

export default function DAOListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [daos, setDaos] = useState<DAO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [totalDAOs, setTotalDAOs] = useState(0)
  const router = useRouter()

  const [userStats, setUserStats] = useState({
    points: 0,
    completedTasks: 0,
    earnings: "0",
  })
  const [account, setAccount] = useState<string | null>(null)

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

          // Get total DAOs count
          const counters = await contract.getCurrentCounters()
          setTotalDAOs(Number(counters[0]))
        } else {
          // For read-only operations, you can use a JSON-RPC provider
          // Replace with your network's RPC URL (e.g., for Metis)
          const provider = new ethers.JsonRpcProvider("https://hyperion-testnet.metisdevops.link")
          const contract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, provider)

          // Do not setProvider here, since provider is not a BrowserProvider and will cause a type error
          setContract(contract)

          const counters = await contract.getCurrentCounters()
          setTotalDAOs(Number(counters[0]))
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

        setUserStats({
          points: Number(points),
          completedTasks: Number(completedTasks),
          earnings: earnings.toString(),
        })
      } catch (error) {
        console.error("Error loading user stats:", error)
      }
    }

    loadUserStats()
  }, [contract, account])

  useEffect(() => {
    const fetchAllDAOs = async () => {
      if (!contract || totalDAOs === 0) {
        setIsLoading(false)
        return
      }

      const daoList: DAO[] = []

      for (let i = 1; i <= totalDAOs; i++) {
        try {
          const result = await contract.daos(i)

          console.log(result)

          if (result) {
            const [id, name, description, creator, metadataURI, createdAt, isActive, totalTasks, totalRewards] = result
            const metadata = await fetchDAOMetadata(metadataURI)

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
              category: metadata?.category || "General",
              members: metadata?.members?.length || 1,
            })
          }
        } catch (err) {
          console.error(`Error fetching DAO ${i}:`, err)
        }
      }

      setDaos(daoList.filter((dao) => dao.isActive))
      setIsLoading(false)
    }

    fetchAllDAOs()
  }, [contract, totalDAOs])

  const categories = [
    "All",
    "DeFi Protocol",
    "NFT Community",
    "Gaming Guild",
    "Investment Club",
    "Social Impact",
    "Developer Tools",
    "Content Creation",
    "Research Group",
  ]

  const filteredDAOs = daos.filter((dao) => {
    const matchesSearch =
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || dao.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const fetchDAOMetadata = async (metadataURI: string): Promise<any | null> => {
    try {
      const resolvedURI = metadataURI.startsWith("https")
        ? metadataURI
        : `https://gateway.pinata.cloud/ipfs/${metadataURI.replace("ipfs://", "")}`

      const response = await axios.get(resolvedURI)
      return response.data
    } catch (error) {
      console.error("Failed to fetch DAO metadata:", error)
      return null
    }
  }

  const formatReward = (reward: string) => {
    const value = Number.parseFloat(ethers.formatEther(reward))
    return value.toFixed(4)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Function to connect wallet (if needed for transactions)
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS_DAO!, contractABI, signer)

        setProvider(provider)
        setContract(contractWithSigner)

        return { provider, signer, contract: contractWithSigner }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
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
            <p className="text-slate-300 text-lg">Loading DAOs...</p>
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
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ProofDAO</span>
            </a>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="text-slate-300 hover:text-white"
              >
                Dashboard
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
          <h1 className="text-4xl font-bold text-white mb-4">Discover DAOs</h1>
          <p className="text-xl text-slate-300">
            Join decentralized organizations and contribute to meaningful projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total DAOs</p>
                  <p className="text-2xl font-bold text-white">{daos.length}</p>
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
                  <p className="text-2xl font-bold text-white">{daos.reduce((sum, dao) => sum + dao.totalTasks, 0)}</p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
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

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{daos.reduce((sum, dao) => sum + dao.members!, 0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Stats (if connected) */}
        {account && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search DAOs by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex space-x-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                      : "border-slate-600 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* DAO Grid */}
        {filteredDAOs.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No DAOs Found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || selectedCategory !== "All"
                  ? "Try adjusting your search or filter criteria"
                  : "Be the first to create a DAO on ProofDAO!"}
              </p>
              <Button
                onClick={() => router.push("/create-dao")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First DAO
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDAOs.map((dao) => (
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
                        <Badge className="bg-blue-900/50 text-blue-400 border-blue-700 text-xs">{dao.category}</Badge>
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
        )}
      </div>
    </div>
  )
}
