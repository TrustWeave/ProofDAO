"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ReputationNFTCard from "./reputation-nftcard"
import { Trophy, Star, Award, Plus, TrendingUp, Target, Gift } from "lucide-react"
import { CONTRACT_ADDRESS_REPUTATION } from "@/utils/constants"

interface ReputationDashboardProps {
  account: string | null
  provider: ethers.BrowserProvider | null
  isAdmin?: boolean
}

const SKILL_TYPES = [
  "Design",
  "Development",
  "Marketing",
  "Translation",
  "Writing",
  "Community",
  "Research",
  "Analysis",
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
    inputs: [
      { internalType: "address", name: "contributor", type: "address" },
      { internalType: "uint8", name: "skillType", type: "uint8" },
    ],
    name: "mintReputation",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "contributor", type: "address" },
      { internalType: "uint8", name: "skillType", type: "uint8" },
      { internalType: "uint256", name: "qualityScore", type: "uint256" },
      { internalType: "uint256", name: "earnings", type: "uint256" },
    ],
    name: "updateReputation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "string", name: "badge", type: "string" },
    ],
    name: "awardBadge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "github", type: "string" },
      { internalType: "string", name: "twitter", type: "string" },
      { internalType: "string", name: "discord", type: "string" },
      { internalType: "string", name: "linkedin", type: "string" },
      { internalType: "string", name: "website", type: "string" },
    ],
    name: "updateSocialLinks",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      { internalType: "address", name: "contributor", type: "address" },
      { internalType: "uint8", name: "skillType", type: "uint8" },
    ],
    name: "getReputationLevel",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
]

export default function ReputationDashboard({ account, provider, isAdmin = false }: ReputationDashboardProps) {
  const [userReputations, setUserReputations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [showMintDialog, setShowMintDialog] = useState(false)
  const [showAwardDialog, setShowAwardDialog] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [isAwarding, setIsAwarding] = useState(false)

  const [mintForm, setMintForm] = useState({
    contributor: "",
    skillType: 0,
  })

  const [awardForm, setAwardForm] = useState({
    tokenId: "",
    badge: "",
  })

  useEffect(() => {
    initializeContract()
  }, [provider])

  useEffect(() => {
    if (contract && account) {
      loadUserReputations()
    }
  }, [contract, account])

  const initializeContract = async () => {
    if (!provider || !CONTRACT_ADDRESS_REPUTATION) return

    try {
      const reputationContract = new ethers.Contract(CONTRACT_ADDRESS_REPUTATION, reputationContractABI, provider)
      setContract(reputationContract)
    } catch (error) {
      console.error("Error initializing reputation contract:", error)
    }
  }

  const loadUserReputations = async () => {
    if (!contract || !account) return

    try {
      setIsLoading(true)
      const tokenIds = await contract.getUserReputations(account)
      setUserReputations(tokenIds.map((id: any) => id.toString()))
    } catch (error) {
      console.error("Error loading user reputations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMintReputation = async () => {
    if (!contract || !provider || !mintForm.contributor) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsMinting(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      const tx = await contractWithSigner.mintReputation(mintForm.contributor, mintForm.skillType)

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowMintDialog(false)
      setMintForm({ contributor: "", skillType: 0 })

      // Reload reputations if minting for current user
      if (mintForm.contributor.toLowerCase() === account?.toLowerCase()) {
        loadUserReputations()
      }

      alert("Reputation NFT minted successfully!")
    } catch (error: any) {
      console.error("Error minting reputation:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error minting reputation. Please try again.")
      }
    } finally {
      setIsMinting(false)
    }
  }

  const handleAwardBadge = async () => {
    if (!contract || !provider || !awardForm.tokenId || !awardForm.badge) {
      alert("Please fill in all required fields")
      return
    }

    try {
      setIsAwarding(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      const tx = await contractWithSigner.awardBadge(BigInt(awardForm.tokenId), awardForm.badge)

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setShowAwardDialog(false)
      setAwardForm({ tokenId: "", badge: "" })

      // Reload reputations to show new badge
      loadUserReputations()

      alert("Badge awarded successfully!")
    } catch (error: any) {
      console.error("Error awarding badge:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error awarding badge. Please try again.")
      }
    } finally {
      setIsAwarding(false)
    }
  }

  if (!account) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400">Connect your wallet to view your reputation NFTs</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Reputation Dashboard</h2>
          <p className="text-slate-300">Manage your skill-based reputation NFTs</p>
        </div>

        {isAdmin && (
          <div className="flex space-x-3">
            <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Mint Reputation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Mint Reputation NFT</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Contributor Address *</Label>
                    <Input
                      value={mintForm.contributor}
                      onChange={(e) => setMintForm((prev) => ({ ...prev, contributor: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="0x..."
                    />
                  </div>
                  <div>
                    <Label className="text-white">Skill Type *</Label>
                    <Select
                      value={mintForm.skillType.toString()}
                      onValueChange={(value) => setMintForm((prev) => ({ ...prev, skillType: Number.parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-2">
                        <SelectValue placeholder="Select skill type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {SKILL_TYPES.map((skill, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowMintDialog(false)} disabled={isMinting}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMintReputation}
                      disabled={isMinting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isMinting ? "Minting..." : "Mint NFT"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-yellow-600 to-orange-600">
                  <Gift className="w-4 h-4 mr-2" />
                  Award Badge
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Award Badge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Token ID *</Label>
                    <Input
                      value={awardForm.tokenId}
                      onChange={(e) => setAwardForm((prev) => ({ ...prev, tokenId: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Badge Name *</Label>
                    <Input
                      value={awardForm.badge}
                      onChange={(e) => setAwardForm((prev) => ({ ...prev, badge: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="Special Achievement"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowAwardDialog(false)} disabled={isAwarding}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAwardBadge}
                      disabled={isAwarding}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isAwarding ? "Awarding..." : "Award Badge"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total NFTs</p>
                <p className="text-2xl font-bold text-white">{userReputations.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Skills Mastered</p>
                <p className="text-2xl font-bold text-white">{userReputations.length}</p>
              </div>
              <Star className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Badges Earned</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <Award className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Reputation Score</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reputation NFTs */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Your Reputation NFTs</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : userReputations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userReputations.map((tokenId) => (
              <ReputationNFTCard
                key={tokenId}
                tokenId={tokenId}
                contract={contract}
                provider={provider}
                account={account}
                isOwner={true}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Reputation NFTs Yet</h3>
              <p className="text-slate-400 mb-6">Complete tasks to earn reputation NFTs and showcase your skills</p>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Target className="w-4 h-4 mr-2" />
                Browse Tasks
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
