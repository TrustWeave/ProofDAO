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
  Plus,
  Settings,
  TrendingUp,
  Clock,
  ExternalLink,
  Activity,
  Shield,
  Vote,
  Share2,
  BarChart3,
  CheckCircle,
  X,
  MessageSquare,
  AlertTriangle,
  Gavel,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CONTRACT_ADDRESS_DAO, CONTRACT_ADDRESS_DAC } from "@/utils/constants"
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
  members?: Array<{
    address: string
    role: string
    name?: string
  }>
  governance?: {
    votingPeriod: number
    quorum: number
    proposalThreshold: number
    enableDelegation: boolean
    requireStaking: boolean
  }
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

interface Proposal {
  id: string
  daoId: string
  proposer: string
  proposalType: number
  title: string
  description: string
  metadataURI: string
  targetId: string
  proposedValue: string
  createdAt: number
  votingDeadline: number
  forVotes: string
  againstVotes: string
  abstainVotes: string
  status: number
  executed: boolean
  executionResult: string
}

interface ProposalVote {
  voter: string
  proposalId: string
  support: number
  weight: string
  timestamp: number
  reason: string
}

interface DAOGovernance {
  daoId: string
  minQuorum: string
  votingDuration: number
  useReputationVoting: boolean
  allowDelegation: boolean
  members: string[]
}

// ProofDAO Core ABI
const coreContractABI = [
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
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "requirements", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint256", name: "maxSubmissions", type: "uint256" },
      { internalType: "string[]", name: "skillTags", type: "string[]" },
    ],
    name: "postTask",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
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

// MetisDAC ABI
const dacContractABI = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "proposals",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "address", name: "proposer", type: "address" },
      { internalType: "uint8", name: "proposalType", type: "uint8" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "targetId", type: "uint256" },
      { internalType: "uint256", name: "proposedValue", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "uint256", name: "votingDeadline", type: "uint256" },
      { internalType: "uint256", name: "forVotes", type: "uint256" },
      { internalType: "uint256", name: "againstVotes", type: "uint256" },
      { internalType: "uint256", name: "abstainVotes", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
      { internalType: "bool", name: "executed", type: "bool" },
      { internalType: "string", name: "executionResult", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "daoGovernance",
    outputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "uint256", name: "minQuorum", type: "uint256" },
      { internalType: "uint256", name: "votingDuration", type: "uint256" },
      { internalType: "bool", name: "useReputationVoting", type: "bool" },
      { internalType: "bool", name: "allowDelegation", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "bool", name: "useReputationVoting", type: "bool" },
      { internalType: "bool", name: "allowDelegation", type: "bool" },
      { internalType: "uint256", name: "customVotingDuration", type: "uint256" },
    ],
    name: "createDAOGovernance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "address", name: "member", type: "address" },
      { internalType: "uint256", name: "weight", type: "uint256" },
    ],
    name: "addDAOMember",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "uint8", name: "proposalType", type: "uint8" },
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
      { internalType: "uint256", name: "targetId", type: "uint256" },
      { internalType: "uint256", name: "proposedValue", type: "uint256" },
    ],
    name: "createProposal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "uint8", name: "support", type: "uint8" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "executeProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "address", name: "delegate", type: "address" },
    ],
    name: "delegateVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "taskId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "raiseDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "daoId", type: "uint256" }],
    name: "getDAOProposals",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "proposalId", type: "uint256" }],
    name: "getProposalVoters",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "daoId", type: "uint256" }],
    name: "getDAOMembers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "address", name: "member", type: "address" },
    ],
    name: "isDAOMember",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "daoId", type: "uint256" },
      { internalType: "address", name: "member", type: "address" },
    ],
    name: "getMemberVotingWeight",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

export default function DAODashboard() {
  const params = useParams()
  const router = useRouter()
  const daoId = params.id as string

  const [dao, setDao] = useState<DAO | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [daoGovernance, setDaoGovernance] = useState<DAOGovernance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showCreateGovernance, setShowCreateGovernance] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [coreContract, setCoreContract] = useState<ethers.Contract | null>(null)
  const [dacContract, setDacContract] = useState<ethers.Contract | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [isCreatingGovernance, setIsCreatingGovernance] = useState(false)

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showSubmitWork, setShowSubmitWork] = useState(false)
  const [showReviewSubmission, setShowReviewSubmission] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  // Task creation form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    requirements: "",
    reward: "",
    deadline: "",
    maxSubmissions: 1,
    skillTags: [] as string[],
  })

  // Proposal creation form
  const [proposalForm, setProposalForm] = useState({
    proposalType: 0,
    title: "",
    description: "",
    metadataURI: "",
    targetId: "",
    proposedValue: "",
  })

  // Governance creation form
  const [governanceForm, setGovernanceForm] = useState({
    useReputationVoting: false,
    allowDelegation: true,
    customVotingDuration: 0,
  })

  // Add member form
  const [memberForm, setMemberForm] = useState({
    address: "",
    weight: 1,
  })

  // Dispute form
  const [disputeForm, setDisputeForm] = useState({
    taskId: "",
    reason: "",
  })

  // Work submission form
  const [workForm, setWorkForm] = useState({
    workURI: "",
    proofData: "",
  })

  // Review form
  const [reviewForm, setReviewForm] = useState({
    feedback: "",
    qualityScore: 80,
  })

  // Initialize ethers and contracts
  useEffect(() => {
    const initializeEthers = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send("eth_requestAccounts", [])
          const coreContract = new ethers.Contract(CONTRACT_ADDRESS_DAO!, coreContractABI, provider)
          const dacContract = new ethers.Contract(CONTRACT_ADDRESS_DAC!, dacContractABI, provider)

          setProvider(provider)
          setAccount(accounts[0])
          setCoreContract(coreContract)
          setDacContract(dacContract)
        }
      } catch (error) {
        console.error("Failed to initialize ethers:", error)
      }
    }

    initializeEthers()
  }, [])

  // Fetch DAO metadata from IPFS
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

  // Load DAO data
  useEffect(() => {
    const loadDAO = async () => {
      if (!coreContract || !daoId) return

      try {
        const daoData = await coreContract.daos(BigInt(daoId))

        const [id, name, description, creator, metadataURI, createdAt, isActive, totalTasks, totalRewards] = daoData

        // Fetch metadata for additional info
        const metadata = await fetchDAOMetadata(metadataURI)

        setDao({
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
          members: metadata?.members || [],
          governance: metadata?.governance || {
            votingPeriod: 7,
            quorum: 50,
            proposalThreshold: 1,
            enableDelegation: true,
            requireStaking: false,
          },
        })
      } catch (error) {
        console.error("Error loading DAO:", error)
      }
    }

    loadDAO()
  }, [coreContract, daoId])

  // Load DAO governance
  useEffect(() => {
    const loadDAOGovernance = async () => {
      if (!dacContract || !daoId) return

      try {
        const governanceData = await dacContract.daoGovernance(BigInt(daoId))
        const [id, minQuorum, votingDuration, useReputationVoting, allowDelegation] = governanceData

        if (Number(id) > 0) {
          const members = await dacContract.getDAOMembers(BigInt(daoId))

          setDaoGovernance({
            daoId: id.toString(),
            minQuorum: minQuorum.toString(),
            votingDuration: Number(votingDuration),
            useReputationVoting,
            allowDelegation,
            members,
          })
        }
      } catch (error) {
        console.error("Error loading DAO governance:", error)
      }
    }

    loadDAOGovernance()
  }, [dacContract, daoId])

  // Load proposals
  useEffect(() => {
    const loadProposals = async () => {
      if (!dacContract || !daoId) return

      try {
        const proposalIds = await dacContract.getDAOProposals(BigInt(daoId))
        const proposalList: Proposal[] = []

        for (const proposalId of proposalIds) {
          try {
            const proposalData = await dacContract.proposals(proposalId)
            const [
              id,
              daoId,
              proposer,
              proposalType,
              title,
              description,
              metadataURI,
              targetId,
              proposedValue,
              createdAt,
              votingDeadline,
              forVotes,
              againstVotes,
              abstainVotes,
              status,
              executed,
              executionResult,
            ] = proposalData

            proposalList.push({
              id: id.toString(),
              daoId: daoId.toString(),
              proposer,
              proposalType: Number(proposalType),
              title,
              description,
              metadataURI,
              targetId: targetId.toString(),
              proposedValue: proposedValue.toString(),
              createdAt: Number(createdAt),
              votingDeadline: Number(votingDeadline),
              forVotes: forVotes.toString(),
              againstVotes: againstVotes.toString(),
              abstainVotes: abstainVotes.toString(),
              status: Number(status),
              executed,
              executionResult,
            })
          } catch (error) {
            console.error(`Error loading proposal ${proposalId}:`, error)
          }
        }

        setProposals(proposalList.sort((a, b) => b.createdAt - a.createdAt))
      } catch (error) {
        console.error("Error loading proposals:", error)
      }
    }

    if (dacContract && dao) {
      loadProposals()
    }
  }, [dacContract, dao, daoId])

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!coreContract || !daoId) return

      try {
        const taskIds = await coreContract.getDAOTasks(BigInt(daoId))
        const taskList: Task[] = []

        for (const taskId of taskIds) {
          try {
            const taskData = await coreContract.tasks(taskId)
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
              skillTags = await coreContract.getTaskSkillTags(taskId)
            } catch (error) {
              console.error(`Error loading skill tags for task ${taskId}:`, error)
            }

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
              skillTags,
            })
          } catch (error) {
            console.error(`Error loading task ${taskId}:`, error)
          }
        }

        setTasks(taskList)
      } catch (error) {
        console.error("Error loading tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (coreContract && dao) {
      loadTasks()
    }
  }, [coreContract, dao, daoId])

  // Load submissions for all tasks
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!coreContract || tasks.length === 0) return

      try {
        const allSubmissions: Submission[] = []

        for (const task of tasks) {
          try {
            const submissionIds = await coreContract.getTaskSubmissions(BigInt(task.id))

            for (const submissionId of submissionIds) {
              try {
                const submissionData = await coreContract.submissions(submissionId)
                const [id, taskId, contributor, workURI, proofData, submittedAt, status, feedback, qualityScore] =
                  submissionData

                allSubmissions.push({
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
          } catch (error) {
            console.error(`Error loading submissions for task ${task.id}:`, error)
          }
        }

        setSubmissions(allSubmissions)
      } catch (error) {
        console.error("Error loading submissions:", error)
      }
    }

    loadSubmissions()
  }, [coreContract, tasks])

  const handleCreateGovernance = async () => {
    if (!dacContract || !provider || !dao) {
      alert("Please connect your wallet first")
      return
    }

    try {
      setIsCreatingGovernance(true)

      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: createDAOGovernance is a custom contract method
      const tx = await contractWithSigner.createDAOGovernance(
        BigInt(dao.id),
        governanceForm.useReputationVoting,
        governanceForm.allowDelegation,
        BigInt(governanceForm.customVotingDuration),
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowCreateGovernance(false)
      setGovernanceForm({
        useReputationVoting: false,
        allowDelegation: true,
        customVotingDuration: 0,
      })

      // After successful governance creation, the creator is automatically added as a member
      // Refresh the page to show updated UI
      window.location.reload()
    } catch (error: any) {
      console.error("Error creating governance:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error creating governance. Please try again.")
      }
    } finally {
      setIsCreatingGovernance(false)
    }
  }

  const handleCreateProposal = async () => {
    if (!dacContract || !provider || !dao || !proposalForm.title || !proposalForm.description) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsCreatingProposal(true)

      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: createProposal is a custom contract method
      const tx = await contractWithSigner.createProposal(
        BigInt(dao.id),
        proposalForm.proposalType,
        proposalForm.title,
        proposalForm.description,
        proposalForm.metadataURI || "",
        BigInt(proposalForm.targetId || "0"),
        BigInt(proposalForm.proposedValue || "0"),
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowCreateProposal(false)
      setProposalForm({
        proposalType: 0,
        title: "",
        description: "",
        metadataURI: "",
        targetId: "",
        proposedValue: "",
      })

      window.location.reload()
    } catch (error: any) {
      console.error("Error creating proposal:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error creating proposal. Please try again.")
      }
    } finally {
      setIsCreatingProposal(false)
    }
  }

  const handleVoteOnProposal = async (proposalId: string, support: number, reason: string) => {
    if (!dacContract || !provider) {
      alert("Please connect your wallet")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: castVote is a custom contract method
      const tx = await contractWithSigner.castVote(BigInt(proposalId), support, reason)

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      alert("Vote cast successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error voting:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error voting. Please try again.")
      }
    }
  }

  const handleExecuteProposal = async (proposalId: string) => {
    if (!dacContract || !provider) {
      alert("Please connect your wallet")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: executeProposal is a custom contract method
      const tx = await contractWithSigner.executeProposal(BigInt(proposalId))

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      alert("Proposal executed successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error executing proposal:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error executing proposal. Please try again.")
      }
    }
  }

  const handleAddMember = async () => {
    if (!dacContract || !provider || !memberForm.address) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: addDAOMember is a custom contract method
      const tx = await contractWithSigner.addDAOMember(BigInt(daoId), memberForm.address, BigInt(memberForm.weight))

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowAddMember(false)
      setMemberForm({ address: "", weight: 1 })

      alert("Member added successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error adding member:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error adding member. Please try again.")
      }
    }
  }

  const handleRaiseDispute = async () => {
    if (!dacContract || !provider || !disputeForm.taskId || !disputeForm.reason) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = dacContract.connect(signer)

      // @ts-expect-error: raiseDispute is a custom contract method
      const tx = await contractWithSigner.raiseDispute(BigInt(disputeForm.taskId), disputeForm.reason)

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowDispute(false)
      setDisputeForm({ taskId: "", reason: "" })

      alert("Dispute raised successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error raising dispute:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error raising dispute. Please try again.")
      }
    }
  }

  const handleSubmitWork = async () => {
    if (!coreContract || !provider || !selectedTask || !workForm.workURI.trim()) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

      // @ts-expect-error: submitWork is a custom contract method
      const tx = await contractWithSigner.submitWork(
        BigInt(selectedTask.id),
        workForm.workURI,
        workForm.proofData || "",
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowSubmitWork(false)
      setWorkForm({ workURI: "", proofData: "" })
      setSelectedTask(null)

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
    if (!coreContract || !provider || !selectedSubmission || !reviewForm.feedback.trim()) {
      alert("Please provide feedback")
      return
    }

    try {
      setIsReviewing(true)

      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

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
    if (!coreContract || !provider || !selectedSubmission || !reviewForm.feedback.trim()) {
      alert("Please provide feedback")
      return
    }

    try {
      setIsReviewing(true)

      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

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
    if (!coreContract || !provider) {
      alert("Please connect your wallet")
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

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

  const handleCancelTask = async (taskId: string) => {
    if (!coreContract || !provider) {
      alert("Please connect your wallet")
      return
    }

    if (!confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      return
    }

    try {
      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

      // @ts-expect-error: cancelTask is a custom contract method
      const tx = await contractWithSigner.cancelTask(BigInt(taskId))

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      alert("Task cancelled successfully!")
      window.location.reload()
    } catch (error: any) {
      console.error("Error cancelling task:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error cancelling task. Please try again.")
      }
    }
  }

  const handleCreateTask = async () => {
    if (
      !coreContract ||
      !provider ||
      !dao ||
      !taskForm.title ||
      !taskForm.description ||
      !taskForm.requirements ||
      !taskForm.reward ||
      !taskForm.deadline
    ) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsCreatingTask(true)

      const rewardValue = Number.parseFloat(taskForm.reward)
      if (rewardValue <= 0) {
        alert("Reward must be greater than 0")
        return
      }

      if (rewardValue < 0.001) {
        alert("Minimum reward is 0.001 METIS")
        return
      }

      const deadlineDate = new Date(taskForm.deadline)
      const now = new Date()

      if (deadlineDate <= now) {
        alert("Deadline must be in the future")
        return
      }

      const maxDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (deadlineDate > maxDeadline) {
        alert("Deadline must be more than 30 days from now")
        return
      }

      const signer = await provider.getSigner()
      const contractWithSigner = coreContract.connect(signer)

      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000)
      const rewardWei = ethers.parseEther(taskForm.reward)

      let gasEstimate
      try {
        gasEstimate = await (contractWithSigner as any).postTask.estimateGas(
          BigInt(daoId),
          taskForm.title,
          taskForm.description,
          taskForm.requirements,
          "",
          BigInt(deadlineTimestamp),
          BigInt(taskForm.maxSubmissions),
          taskForm.skillTags,
          { value: rewardWei },
        )
      } catch (error) {
        console.error("Gas estimation failed:", error)
        alert("Transaction would fail. Please check your inputs and balance.")
        return
      }

      const tx = await (contractWithSigner as any).postTask(
        BigInt(daoId),
        taskForm.title,
        taskForm.description,
        taskForm.requirements,
        "",
        BigInt(deadlineTimestamp),
        BigInt(taskForm.maxSubmissions),
        taskForm.skillTags,
        {
          value: rewardWei,
          gasLimit: gasEstimate + BigInt(50000),
        },
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowCreateTask(false)
      setTaskForm({
        title: "",
        description: "",
        requirements: "",
        reward: "",
        deadline: "",
        maxSubmissions: 1,
        skillTags: [],
      })

      window.location.reload()
    } catch (error: any) {
      console.error("Error creating task:", error)

      if (error.code === "INSUFFICIENT_FUNDS") {
        alert("Insufficient funds to create this task")
      } else if (error.code === "USER_REJECTED") {
        alert("Transaction was rejected by user")
      } else if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else if (error.message) {
        alert(`Error: ${error.message}`)
      } else {
        alert("Error creating task. Please try again.")
      }
    } finally {
      setIsCreatingTask(false)
    }
  }

  const formatReward = (reward: string) => {
    const value = Number.parseFloat(ethers.formatEther(reward))
    return value.toFixed(4)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
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

  const getProposalStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">Active</Badge>
      case 1:
        return <Badge className="bg-green-900/50 text-green-400 border-green-700">Passed</Badge>
      case 2:
        return <Badge className="bg-red-900/50 text-red-400 border-red-700">Rejected</Badge>
      case 3:
        return <Badge className="bg-purple-900/50 text-purple-400 border-purple-700">Executed</Badge>
      case 4:
        return <Badge className="bg-gray-900/50 text-gray-400 border-gray-700">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-900/50 text-gray-400 border-gray-700">Unknown</Badge>
    }
  }

  const getProposalTypeName = (type: number) => {
    switch (type) {
      case 0:
        return "Task Approval"
      case 1:
        return "Reward Modification"
      case 2:
        return "DAO Governance"
      case 3:
        return "Platform Upgrade"
      case 4:
        return "Dispute Resolution"
      default:
        return "Unknown"
    }
  }

  const canSubmitToTask = (task: Task) => {
    if (!account) return false
    if (task.creator.toLowerCase() === account.toLowerCase()) return false
    if (task.status !== 0) return false
    if (Date.now() > task.deadline * 1000) return false
    if (task.currentSubmissions >= task.maxSubmissions) return false

    const userSubmission = submissions.find(
      (sub) => sub.taskId === task.id && sub.contributor.toLowerCase() === account.toLowerCase(),
    )
    return !userSubmission
  }

  const getTaskSubmissions = (taskId: string) => {
    return submissions.filter((sub) => sub.taskId === taskId)
  }

  const canReviewSubmission = (submission: Submission) => {
    if (!account) return false
    const task = tasks.find((t) => t.id === submission.taskId)
    if (!task) return false

    return (
      submission.status === 0 &&
      (task.creator.toLowerCase() === account.toLowerCase() || dao?.creator.toLowerCase() === account.toLowerCase())
    )
  }

  const canClaimReward = (submission: Submission) => {
    if (!account) return false
    return submission.status === 1 && submission.contributor.toLowerCase() === account.toLowerCase()
  }

  // Check if user can vote on proposals
  const canVoteOnProposal = (proposal: Proposal) => {
    if (!account || !daoGovernance) return false
    if (proposal.status !== 0) return false // Only active proposals
    if (Date.now() > proposal.votingDeadline * 1000) return false // Voting period ended

    // Check if user is a governance member (including DAO creator)
    const isGovernanceMember = daoGovernance.members.some((member) => member.toLowerCase() === account.toLowerCase())
    const isDAOCreator = dao?.creator.toLowerCase() === account.toLowerCase()

    return isGovernanceMember || isDAOCreator
  }

  const isDAOCreator = dao && account && dao.creator.toLowerCase() === account.toLowerCase()
  const isDAOMember =
    daoGovernance &&
    account &&
    (daoGovernance.members.some((member) => member.toLowerCase() === account.toLowerCase()) ||
      dao?.creator.toLowerCase() === account.toLowerCase())

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
            <p className="text-slate-300 text-lg">Loading DAO...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dao) {
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
            <h2 className="text-2xl font-bold text-white mb-4">DAO Not Found</h2>
            <p className="text-slate-300 mb-6">The DAO you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/dao")} className="bg-gradient-to-r from-blue-600 to-cyan-600">
              Browse DAOs
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
              <Button onClick={() => router.push("/dao")} variant="ghost" className="text-slate-300 hover:text-black">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to DAOs
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-300 hover:text-black">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {isDAOCreator && (
                <Button variant="ghost" className="text-slate-300 hover:text-black">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* DAO Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                  {dao.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{dao.name}</h1>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">{dao.category}</Badge>
                  <div className="flex items-center text-slate-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDate(dao.createdAt)}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Active
                  </div>
                  {daoGovernance && (
                    <Badge className="bg-purple-900/50 text-purple-400 border-purple-700">
                      <Vote className="w-3 h-3 mr-1" />
                      Governance Active
                    </Badge>
                  )}
                  {daoGovernance && isDAOMember && (
                    <Badge className="bg-green-900/50 text-green-400 border-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Can Vote
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isDAOCreator && (
                <>
                  <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div>
                          <Label className="text-white">Task Title *</Label>
                          <Input
                            value={taskForm.title}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            placeholder="Enter task title"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Description *</Label>
                          <Textarea
                            value={taskForm.description}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            placeholder="Describe the task"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label className="text-white">Requirements *</Label>
                          <Textarea
                            value={taskForm.requirements}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, requirements: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            placeholder="List the requirements and deliverables"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Reward (METIS) *</Label>
                            <Input
                              type="number"
                              step="0.001"
                              min="0.001"
                              value={taskForm.reward}
                              onChange={(e) => setTaskForm((prev) => ({ ...prev, reward: e.target.value }))}
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                              placeholder="0.1"
                            />
                            <p className="text-xs text-slate-400 mt-1">Minimum: 0.001 METIS</p>
                          </div>

                          <div>
                            <Label className="text-white">Max Submissions</Label>
                            <Input
                              type="number"
                              min="1"
                              value={taskForm.maxSubmissions}
                              onChange={(e) =>
                                setTaskForm((prev) => ({
                                  ...prev,
                                  maxSubmissions: Number.parseInt(e.target.value) || 1,
                                }))
                              }
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Deadline *</Label>
                          <Input
                            type="datetime-local"
                            value={taskForm.deadline}
                            onChange={(e) => setTaskForm((prev) => ({ ...prev, deadline: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            min={new Date().toISOString().slice(0, 16)}
                            max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                          />
                          <p className="text-xs text-slate-400 mt-1">Maximum: 30 days from now</p>
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setShowCreateTask(false)} disabled={isCreatingTask}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateTask}
                            disabled={isCreatingTask}
                            className="bg-gradient-to-r from-green-600 to-blue-600"
                          >
                            {isCreatingTask ? "Creating..." : "Create Task"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {!daoGovernance && (
                    <Dialog open={showCreateGovernance} onOpenChange={setShowCreateGovernance}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          <Vote className="w-4 h-4 mr-2" />
                          Setup Governance
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Setup DAO Governance</DialogTitle>
                          <p className="text-slate-300">Configure voting and governance settings for your DAO</p>
                        </DialogHeader>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-white">Use Reputation-Based Voting</Label>
                              <p className="text-slate-400 text-sm">Weight votes based on member reputation</p>
                            </div>
                            <Switch
                              checked={governanceForm.useReputationVoting}
                              onCheckedChange={(checked) =>
                                setGovernanceForm((prev) => ({ ...prev, useReputationVoting: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-white">Allow Vote Delegation</Label>
                              <p className="text-slate-400 text-sm">Members can delegate their voting power</p>
                            </div>
                            <Switch
                              checked={governanceForm.allowDelegation}
                              onCheckedChange={(checked) =>
                                setGovernanceForm((prev) => ({ ...prev, allowDelegation: checked }))
                              }
                            />
                          </div>

                          <div>
                            <Label className="text-white">Custom Voting Duration (days)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={governanceForm.customVotingDuration}
                              onChange={(e) =>
                                setGovernanceForm((prev) => ({
                                  ...prev,
                                  customVotingDuration: Number.parseInt(e.target.value) || 0,
                                }))
                              }
                              className="bg-slate-700 border-slate-600 text-white mt-2"
                              placeholder="0 for default (7 days)"
                            />
                            <p className="text-xs text-slate-400 mt-1">Leave 0 for default 7-day voting period</p>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowCreateGovernance(false)}
                              disabled={isCreatingGovernance}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateGovernance}
                              disabled={isCreatingGovernance}
                              className="bg-gradient-to-r from-purple-600 to-blue-600"
                            >
                              {isCreatingGovernance ? "Setting up..." : "Setup Governance"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}

              {daoGovernance && isDAOMember && (
                <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-white">Proposal Type *</Label>
                        <Select
                          value={proposalForm.proposalType.toString()}
                          onValueChange={(value) =>
                            setProposalForm((prev) => ({ ...prev, proposalType: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-2">
                            <SelectValue placeholder="Select proposal type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="0">Task Approval</SelectItem>
                            <SelectItem value="1">Reward Modification</SelectItem>
                            <SelectItem value="2">DAO Governance</SelectItem>
                            <SelectItem value="3">Platform Upgrade</SelectItem>
                            <SelectItem value="4">Dispute Resolution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white">Title *</Label>
                        <Input
                          value={proposalForm.title}
                          onChange={(e) => setProposalForm((prev) => ({ ...prev, title: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                          placeholder="Enter proposal title"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Description *</Label>
                        <Textarea
                          value={proposalForm.description}
                          onChange={(e) => setProposalForm((prev) => ({ ...prev, description: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white mt-2"
                          placeholder="Describe your proposal in detail"
                          rows={4}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Target ID (Optional)</Label>
                          <Input
                            value={proposalForm.targetId}
                            onChange={(e) => setProposalForm((prev) => ({ ...prev, targetId: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            placeholder="Task/Submission ID"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Proposed Value (Optional)</Label>
                          <Input
                            value={proposalForm.proposedValue}
                            onChange={(e) => setProposalForm((prev) => ({ ...prev, proposedValue: e.target.value }))}
                            className="bg-slate-700 border-slate-600 text-white mt-2"
                            placeholder="New reward amount"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateProposal(false)}
                          disabled={isCreatingProposal}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateProposal}
                          disabled={isCreatingProposal}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          {isCreatingProposal ? "Creating..." : "Create Proposal"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <p className="text-slate-300 text-lg max-w-4xl">{dao.description}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Members</p>
                  <p className="text-2xl font-bold text-white">
                    {daoGovernance?.members.length || dao.members?.length || 1}
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
                  <p className="text-slate-400 text-sm">Active Tasks</p>
                  <p className="text-2xl font-bold text-white">{tasks.filter((task) => task.status === 0).length}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Proposals</p>
                  <p className="text-2xl font-bold text-white">{proposals.filter((p) => p.status === 0).length}</p>
                </div>
                <Vote className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Rewards</p>
                  <p className="text-2xl font-bold text-white">{formatReward(dao.totalRewards)} METIS</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-slate-700 text-white">
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="proposals" className="data-[state=active]:bg-slate-700 text-white">
              Proposals ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-slate-700 text-white">
              Members ({daoGovernance?.members.length || dao.members?.length || 1})
            </TabsTrigger>
            <TabsTrigger value="governance" className="data-[state=active]:bg-slate-700 text-white">
              Governance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700 text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-slate-700 text-white">
              Submissions ({submissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Vote className="w-5 h-5 mr-2 text-purple-400" />
                    Recent Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposals.length > 0 ? (
                    <div className="space-y-4">
                      {proposals.slice(0, 3).map((proposal) => (
                        <div
                          key={proposal.id}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                        >
                          <div>
                            <h4 className="text-white font-medium">{proposal.title}</h4>
                            <p className="text-slate-400 text-sm">{getProposalTypeName(proposal.proposalType)}</p>
                          </div>
                          {getProposalStatusBadge(proposal.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Vote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No proposals yet</p>
                      <p className="text-slate-500 text-sm mb-4">Create proposals to make DAO decisions</p>
                      {daoGovernance && isDAOMember && (
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Proposal
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-400" />
                    Recent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasks.length > 0 ? (
                    <div className="space-y-4">
                      {tasks.slice(0, 3).map((task) => (
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
                      <p className="text-slate-400">No tasks yet</p>
                      <p className="text-slate-500 text-sm mb-4">Create tasks to engage your community</p>
                      {isDAOCreator && (
                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-blue-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Task
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-6">
              {tasks.length > 0 ? (
                <div className="grid gap-6">
                  {tasks.map((task) => (
                    <Card key={task.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                              {getTaskStatusBadge(task.status)}
                            </div>
                            <p className="text-slate-300 mb-4">{task.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-400 mb-4">
                              <div className="flex items-center">
                                <Coins className="w-4 h-4 mr-1" />
                                {formatReward(task.reward)} METIS
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Due {formatDate(task.deadline)}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {task.currentSubmissions}/{task.maxSubmissions} submissions
                              </div>
                            </div>

                            {getTaskSubmissions(task.id).length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-white font-medium mb-2">
                                  Submissions ({getTaskSubmissions(task.id).length})
                                </h4>
                                <div className="space-y-2">
                                  {getTaskSubmissions(task.id)
                                    .slice(0, 3)
                                    .map((submission) => (
                                      <div
                                        key={submission.id}
                                        className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="text-slate-300 text-sm">
                                            {submission.contributor.substring(0, 6)}...
                                            {submission.contributor.substring(submission.contributor.length - 4)}
                                          </span>
                                          {getSubmissionStatusBadge(submission.status)}
                                        </div>
                                        <span className="text-slate-400 text-xs">
                                          {formatDate(submission.submittedAt)}
                                        </span>
                                      </div>
                                    ))}
                                  {getTaskSubmissions(task.id).length > 3 && (
                                    <p className="text-slate-400 text-sm">
                                      +{getTaskSubmissions(task.id).length - 3} more submissions
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2">
                            {canSubmitToTask(task) && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedTask(task)
                                  setShowSubmitWork(true)
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Submit Work
                              </Button>
                            )}

                            {isDAOCreator && task.status === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelTask(task.id)}
                                className="border-red-600 text-red-400 hover:bg-red-900/20 hover:text-red-500"
                              >
                                Cancel Task
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/task/${task.id}`)}
                              className="border-slate-600 text-slate-800 hover:bg-slate-700 hover:text-slate-300"
                            >
                              View Details
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDisputeForm((prev) => ({ ...prev, taskId: task.id }))
                                setShowDispute(true)
                              }}
                              className="border-orange-600 text-orange-400 hover:bg-orange-900/20 hover:text-orange-500"
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Dispute
                            </Button>
                          </div>
                        </div>
                        <div className="border-t border-slate-700 pt-4">
                          <h4 className="text-white font-medium mb-2">Requirements</h4>
                          <p className="text-slate-300 text-sm">{task.requirements}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
                  <p className="text-slate-400 mb-6">This DAO hasn't created any tasks yet.</p>
                  {isDAOCreator && (
                    <Button
                      onClick={() => setShowCreateTask(true)}
                      className="bg-gradient-to-r from-green-600 to-blue-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Task
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="proposals" className="mt-6">
            <div className="space-y-6">
              {proposals.length > 0 ? (
                <div className="grid gap-6">
                  {proposals.map((proposal) => (
                    <Card key={proposal.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                              {getProposalStatusBadge(proposal.status)}
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {getProposalTypeName(proposal.proposalType)}
                              </Badge>
                            </div>
                            <p className="text-slate-300 mb-4">{proposal.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-400 mb-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Created {formatDate(proposal.createdAt)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {proposal.status === 0
                                  ? `Ends ${formatDateTime(proposal.votingDeadline)}`
                                  : `Ended ${formatDateTime(proposal.votingDeadline)}`}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                Proposer: {proposal.proposer.substring(0, 6)}...
                                {proposal.proposer.substring(proposal.proposer.length - 4)}
                              </div>
                            </div>

                            {/* Voting Results */}
                            <div className="mb-4">
                              <h4 className="text-white font-medium mb-2">Voting Results</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-green-400">For</span>
                                  <span className="text-white">{formatReward(proposal.forVotes)} votes</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-red-400">Against</span>
                                  <span className="text-white">{formatReward(proposal.againstVotes)} votes</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-yellow-400">Abstain</span>
                                  <span className="text-white">{formatReward(proposal.abstainVotes)} votes</span>
                                </div>
                              </div>
                            </div>

                            {proposal.executionResult && (
                              <div className="mb-4">
                                <h4 className="text-white font-medium mb-2">Execution Result</h4>
                                <p className="text-slate-300 text-sm">{proposal.executionResult}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2">
                            {canVoteOnProposal(proposal) && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleVoteOnProposal(proposal.id, 1, "Supporting this proposal")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Vote For
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVoteOnProposal(proposal.id, 0, "Opposing this proposal")}
                                  className="border-red-600 text-red-400 hover:bg-red-900/20"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Vote Against
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVoteOnProposal(proposal.id, 2, "Abstaining from this vote")}
                                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                                >
                                  Abstain
                                </Button>
                              </>
                            )}

                            {proposal.status === 1 && !proposal.executed && (
                              <Button
                                size="sm"
                                onClick={() => handleExecuteProposal(proposal.id)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Gavel className="w-4 h-4 mr-1" />
                                Execute
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
                  <Vote className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
                  <p className="text-slate-400 mb-6">
                    {daoGovernance
                      ? "Create proposals to make decisions for this DAO."
                      : "Setup governance first to enable proposals."}
                  </p>
                  {daoGovernance && isDAOMember && (
                    <Button
                      onClick={() => setShowCreateProposal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Proposal
                    </Button>
                  )}
                  {!daoGovernance && isDAOCreator && (
                    <Button
                      onClick={() => setShowCreateGovernance(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <Vote className="w-4 h-4 mr-2" />
                      Setup Governance
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="grid gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-400" />
                      DAO Members
                    </div>
                    {daoGovernance && isDAOMember && (
                      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add DAO Member</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-white">Member Address *</Label>
                              <Input
                                value={memberForm.address}
                                onChange={(e) => setMemberForm((prev) => ({ ...prev, address: e.target.value }))}
                                className="bg-slate-700 border-slate-600 text-white mt-2"
                                placeholder="0x..."
                              />
                            </div>
                            <div>
                              <Label className="text-white">Voting Weight</Label>
                              <Input
                                type="number"
                                min="1"
                                value={memberForm.weight}
                                onChange={(e) =>
                                  setMemberForm((prev) => ({ ...prev, weight: Number.parseInt(e.target.value) || 1 }))
                                }
                                className="bg-slate-700 border-slate-600 text-white mt-2"
                              />
                            </div>
                            <div className="flex justify-end space-x-3">
                              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddMember} className="bg-blue-600 hover:bg-blue-700">
                                Add Member
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* DAO Creator */}
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                            {dao.creator.substring(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-white font-medium">Creator</h4>
                          <p className="text-slate-400 text-sm font-mono">
                            {dao.creator.substring(0, 6)}...{dao.creator.substring(dao.creator.length - 4)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-900/50 text-purple-400 border-purple-700">Founder</Badge>
                    </div>

                    {/* Governance Members */}
                    {daoGovernance && daoGovernance.members.length > 1
                      ? daoGovernance.members
                          .filter((member) => member.toLowerCase() !== dao.creator.toLowerCase())
                          .map((member, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                    {member.substring(2, 4).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="text-white font-medium">Member</h4>
                                  <p className="text-slate-400 text-sm font-mono">
                                    {member.substring(0, 6)}...{member.substring(member.length - 4)}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">Voter</Badge>
                            </div>
                          ))
                      : /* Additional Members from metadata */
                        dao.members &&
                        dao.members.length > 0 &&
                        dao.members.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                                  {member.address.substring(2, 4).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-white font-medium">{member.name || "Member"}</h4>
                                <p className="text-slate-400 text-sm font-mono">
                                  {member.address.substring(0, 6)}...
                                  {member.address.substring(member.address.length - 4)}
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">
                              {member.role || "Member"}
                            </Badge>
                          </div>
                        ))}

                    {(!daoGovernance || daoGovernance.members.length <= 1) &&
                      (!dao.members || dao.members.length === 0) && (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-400">No additional members yet</p>
                          <p className="text-slate-500 text-sm">
                            {daoGovernance
                              ? "Add members to participate in governance"
                              : "Setup governance to manage members"}
                          </p>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="governance" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Vote className="w-5 h-5 mr-2 text-green-400" />
                    Governance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {daoGovernance ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Voting Duration</span>
                        <span className="text-white">{Math.floor(daoGovernance.votingDuration / 86400)} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Minimum Quorum</span>
                        <span className="text-white">{formatReward(daoGovernance.minQuorum)} votes</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Reputation Voting</span>
                        <span className="text-white">{daoGovernance.useReputationVoting ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Vote Delegation</span>
                        <span className="text-white">{daoGovernance.allowDelegation ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Members</span>
                        <span className="text-white">{daoGovernance.members.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Vote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">Governance not setup</p>
                      <p className="text-slate-500 text-sm mb-4">Enable governance to allow member voting</p>
                      {isDAOCreator && (
                        <Button
                          onClick={() => setShowCreateGovernance(true)}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-blue-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Setup Governance
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-purple-400" />
                    Voting History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {proposals.length > 0 ? (
                    <div className="space-y-3">
                      {proposals
                        .filter((p) => p.status !== 0)
                        .slice(0, 5)
                        .map((proposal) => (
                          <div
                            key={proposal.id}
                            className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                          >
                            <div>
                              <p className="text-white text-sm font-medium">{proposal.title}</p>
                              <p className="text-slate-400 text-xs">{formatDate(proposal.createdAt)}</p>
                            </div>
                            {getProposalStatusBadge(proposal.status)}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Vote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No voting history</p>
                      <p className="text-slate-500 text-sm">Past proposals and votes will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                    Task Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Task Status Distribution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Open Tasks</span>
                          <span className="text-green-400 font-medium">
                            {tasks.filter((t) => t.status === 0).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">In Review</span>
                          <span className="text-yellow-400 font-medium">
                            {tasks.filter((t) => t.status === 1).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Completed</span>
                          <span className="text-blue-400 font-medium">
                            {tasks.filter((t) => t.status === 2).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Cancelled</span>
                          <span className="text-red-400 font-medium">{tasks.filter((t) => t.status === 3).length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Vote className="w-5 h-5 mr-2 text-purple-400" />
                    Governance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Proposal Status Distribution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Active Proposals</span>
                          <span className="text-blue-400 font-medium">
                            {proposals.filter((p) => p.status === 0).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Passed</span>
                          <span className="text-green-400 font-medium">
                            {proposals.filter((p) => p.status === 1).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Rejected</span>
                          <span className="text-red-400 font-medium">
                            {proposals.filter((p) => p.status === 2).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Executed</span>
                          <span className="text-purple-400 font-medium">
                            {proposals.filter((p) => p.status === 3).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                    DAO Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Task Completion Rate</span>
                        <span className="text-white">
                          {dao.totalTasks > 0
                            ? Math.round((tasks.filter((t) => t.status === 2).length / dao.totalTasks) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          dao.totalTasks > 0 ? (tasks.filter((t) => t.status === 2).length / dao.totalTasks) * 100 : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Proposal Success Rate</span>
                        <span className="text-white">
                          {proposals.length > 0
                            ? Math.round(
                                (proposals.filter((p) => p.status === 1 || p.status === 3).length / proposals.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          proposals.length > 0
                            ? (proposals.filter((p) => p.status === 1 || p.status === 3).length / proposals.length) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Member Engagement</span>
                        <span className="text-white">
                          {daoGovernance ? Math.min(100, (daoGovernance.members.length / 10) * 100) : 0}%
                        </span>
                      </div>
                      <Progress
                        value={daoGovernance ? Math.min(100, (daoGovernance.members.length / 10) * 100) : 0}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <div className="space-y-6">
              {submissions.length > 0 ? (
                <div className="grid gap-6">
                  {submissions.map((submission) => {
                    const task = tasks.find((t) => t.id === submission.taskId)
                    if (!task) return null

                    return (
                      <Card key={submission.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                                {getSubmissionStatusBadge(submission.status)}
                              </div>
                              <p className="text-slate-400 text-sm mb-2">
                                by {submission.contributor.substring(0, 6)}...
                                {submission.contributor.substring(submission.contributor.length - 4)}
                              </p>
                              <p className="text-slate-300 text-sm mb-3">
                                Submitted {formatDate(submission.submittedAt)}
                              </p>

                              {submission.workURI && (
                                <div className="mb-3">
                                  <Label className="text-slate-400 text-sm">Work Submission:</Label>
                                  <a
                                    href={submission.workURI}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm ml-2"
                                  >
                                    View Work <ExternalLink className="w-3 h-3 inline ml-1" />
                                  </a>
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

                          <div className="border-t border-slate-700 pt-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Task Reward: {formatReward(task.reward)} METIS</span>
                              <span className="text-slate-400">Task Status: {getTaskStatusBadge(task.status)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
                  <p className="text-slate-400 mb-6">
                    Task submissions will appear here once contributors start submitting work.
                  </p>
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
              Submit your work for: <span className="text-blue-400">{selectedTask?.title}</span>
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

            {selectedTask && (
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Task Requirements:</h4>
                <p className="text-slate-300 text-sm">{selectedTask.requirements}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-slate-400">
                  <span>Reward: {formatReward(selectedTask.reward)} METIS</span>
                  <span>Deadline: {formatDate(selectedTask.deadline)}</span>
                </div>
              </div>
            )}

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

      {/* Dispute Dialog */}
      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Raise Dispute</DialogTitle>
            <p className="text-slate-300">Report an issue with a task or submission</p>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-white">Task ID *</Label>
              <Input
                value={disputeForm.taskId}
                onChange={(e) => setDisputeForm((prev) => ({ ...prev, taskId: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="Enter task ID"
              />
            </div>

            <div>
              <Label className="text-white">Dispute Reason *</Label>
              <Textarea
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm((prev) => ({ ...prev, reason: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white mt-2"
                placeholder="Explain the issue in detail..."
                rows={4}
              />
            </div>

            <div className="bg-orange-900/20 border border-orange-700/30 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium">Important</p>
                  <p className="text-orange-300 text-sm">
                    Disputes will be reviewed by DAO members through the governance process. Provide clear evidence and
                    reasoning.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDispute(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRaiseDispute}
                disabled={!disputeForm.taskId || !disputeForm.reason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Raise Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
