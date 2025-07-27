"use client"

import { useState, useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Settings,
  CheckCircle,
  Plus,
  X,
  Shield,
  Vote,
  UserPlus,
  Sparkles,
} from "lucide-react"
import axios from "axios"; 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { CONTRACT_ADDRESS_DAO, PINATA_API_KEY, PINATA_API_SECRET } from "@/utils/constants"
import { useRouter } from "next/navigation";

interface DAOFormData {
  name: string
  description: string
  category: string
  logo: string
  governance: {
    votingPeriod: number
    quorum: number
    proposalThreshold: number
    enableDelegation: boolean
    requireStaking: boolean
  }
  members: Array<{
    address: string
    role: string
    name?: string
  }>
}

export default function CreateDAOPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")
  const [daoId, setDaoId] = useState("")

  const router = useRouter();

  // Contract configuration
  const contractAddress = CONTRACT_ADDRESS_DAO as `0x${string}`
  const contractABI = [
    {
      "inputs": [
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "name": "description", "type": "string" },
        { "internalType": "string", "name": "metadataURI", "type": "string" }
      ],
      "name": "createDAO",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

  // Wagmi hooks
  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const [formData, setFormData] = useState<DAOFormData>({
    name: "",
    description: "",
    category: "",
    logo: "",
    governance: {
      votingPeriod: 7,
      quorum: 50,
      proposalThreshold: 1,
      enableDelegation: true,
      requireStaking: false,
    },
    members: [],
  })

  const [newMember, setNewMember] = useState({ address: "", role: "Member", name: "" })

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const categories = [
    "DeFi Protocol",
    "NFT Community",
    "Gaming Guild",
    "Investment Club",
    "Social Impact",
    "Developer Tools",
    "Content Creation",
    "Research Group",
  ]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleGovernanceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      governance: {
        ...prev.governance,
        [field]: value,
      },
    }))
  }

  const addMember = () => {
    if (newMember.address) {
      setFormData((prev) => ({
        ...prev,
        members: [...prev.members, { ...newMember }],
      }))
      setNewMember({ address: "", role: "Member", name: "" })
    }
  }

  const removeMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }))
  }

  const handleCreateDAO = async () => {
    try {
      setIsCreating(true)

      // Create metadata object
      const metadata = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        governance: formData.governance,
        members: formData.members,
        createdAt: new Date().toISOString(),
        version: "1.0.0"
      }

      const res = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_API_SECRET,
          },
        }
      )

      const metadataCID = res.data.IpfsHash;
      const metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataCID}`

      console.log(metadataURI);

      // Call the smart contract using wagmi
      writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'createDAO',
        args: [formData.name, formData.description, metadataURI],
      })

    } catch (error) {
      console.error("Error creating DAO:", error)
      setIsCreating(false)
    }
  }

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setTransactionHash(hash)
      setDaoId(Math.floor(Math.random() * 10000).toString()) // In real app, parse from event logs
      setIsCreating(false)
      setIsSuccess(true)
      setShowConfetti(true)
      setCurrentStep(5)
      
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }, [isConfirmed, hash])

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error)
      setIsCreating(false)
      alert(`Error creating DAO: ${error.message}`)
    }
  }, [error])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Basic Information</h2>
              <p className="text-slate-300">Let's start with the basics of your DAO</p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white text-lg mb-2 block">
                  DAO Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your DAO name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white text-lg p-4"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-white text-lg mb-2 block">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your DAO's mission and goals"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white min-h-32"
                />
              </div>

              <div>
                <Label className="text-white text-lg mb-4 block">Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={formData.category === category ? "default" : "outline"}
                      onClick={() => handleInputChange("category", category)}
                      className={`p-3 text-sm ${
                        formData.category === category
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                          : "border-slate-600 text-slate-900 hover:bg-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Governance Settings</h2>
              <p className="text-slate-300">Configure how your DAO will make decisions</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Vote className="w-5 h-5 mr-2 text-blue-400" />
                    Voting Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Voting Period (days)</Label>
                    <Input
                      type="number"
                      value={formData.governance.votingPeriod}
                      onChange={(e) => handleGovernanceChange("votingPeriod", Number.parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Quorum (%)</Label>
                    <Input
                      type="number"
                      value={formData.governance.quorum}
                      onChange={(e) => handleGovernanceChange("quorum", Number.parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Proposal Threshold (%)</Label>
                    <Input
                      type="number"
                      value={formData.governance.proposalThreshold}
                      onChange={(e) => handleGovernanceChange("proposalThreshold", Number.parseInt(e.target.value))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-slate-400" />
                    Advanced Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Enable Delegation</Label>
                      <p className="text-slate-400 text-sm">Allow members to delegate voting power</p>
                    </div>
                    <Switch
                      checked={formData.governance.enableDelegation}
                      onCheckedChange={(checked) => handleGovernanceChange("enableDelegation", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Require Staking</Label>
                      <p className="text-slate-400 text-sm">Members must stake tokens to vote</p>
                    </div>
                    <Switch
                      checked={formData.governance.requireStaking}
                      onCheckedChange={(checked) => handleGovernanceChange("requireStaking", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Invite Members</h2>
              <p className="text-slate-300">Add initial members to your DAO (optional)</p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-green-400" />
                  Add New Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <Label className="text-slate-300">Wallet Address</Label>
                    <Input
                      placeholder="0x..."
                      value={newMember.address}
                      onChange={(e) => setNewMember((prev) => ({ ...prev, address: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Name (Optional)</Label>
                    <Input
                      placeholder="Member name"
                      value={newMember.name}
                      onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addMember} className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {formData.members.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    Invited Members ({formData.members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                              {member.name ? member.name[0].toUpperCase() : member.address.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">
                              {member.name || `${member.address.slice(0, 6)}...${member.address.slice(-4)}`}
                            </p>
                            <p className="text-slate-400 text-sm">{member.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">{member.role}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMember(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Review & Preview</h2>
              <p className="text-slate-300">Review your DAO configuration before creation</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-400">Name</Label>
                    <p className="text-white font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Description</Label>
                    <p className="text-slate-300 text-sm">{formData.description}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Category</Label>
                    <Badge className="bg-blue-900/50 text-blue-400 border-blue-700 mt-1">{formData.category}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Governance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voting Period:</span>
                    <span className="text-white">{formData.governance.votingPeriod} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quorum:</span>
                    <span className="text-white">{formData.governance.quorum}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proposal Threshold:</span>
                    <span className="text-white">{formData.governance.proposalThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delegation:</span>
                    <span className={formData.governance.enableDelegation ? "text-green-400" : "text-red-400"}>
                      {formData.governance.enableDelegation ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {formData.members.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Initial Members ({formData.members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {formData.members.map((member, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-slate-700/30 rounded">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                            {member.name ? member.name[0].toUpperCase() : member.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {member.name || `${member.address.slice(0, 8)}...${member.address.slice(-6)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-2">Smart Contract Deployment</h3>
                    <p className="text-slate-300 text-sm">
                      Your DAO will be deployed to:{" "}
                      <code className="bg-slate-800 px-2 py-1 rounded text-blue-400">
                        0x42AC28dB42F5BE11B922f84893F3D4b960a28968
                      </code>
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="confetti-container">
                    {[...Array(50)].map((_, i) => (
                      <div
                        key={i}
                        className="confetti"
                        style={{
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 3}s`,
                          backgroundColor: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"][
                            Math.floor(Math.random() * 5)
                          ],
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-4xl font-bold text-white mb-4">🎉 DAO Created Successfully!</h2>
              <p className="text-xl text-slate-300 mb-8">
                Welcome to <span className="text-blue-400 font-semibold">{formData.name}</span>!
              </p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DAO ID:</span>
                    <span className="text-white font-mono">#{daoId || "..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction:</span>
                    <span className="text-blue-400 font-mono text-sm">
                      {transactionHash ? `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}` : "..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-white">Metis Sepolia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gas Used:</span>
                    <span className="text-white">0.0023 METIS</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                View DAO Dashboard
              </Button>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent">
                Create Another DAO
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.description.trim()
      case 2:
        return true
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
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
            <Button onClick={() => router.push("/dashboard")} variant="ghost" className="text-slate-300 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        {!isSuccess && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">Create Your DAO</h1>
              <Badge className="bg-slate-800 text-slate-300 px-3 py-1">
                Step {currentStep} of {totalSteps}
              </Badge>
            </div>
            <Progress value={progress} className="h-2 bg-slate-800" />
            <div className="flex justify-between text-sm text-slate-400 mt-2">
              <span>Basic Info</span>
              <span>Governance</span>
              <span>Members</span>
              <span>Review</span>
              <span>Success</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation Buttons */}
        {!isSuccess && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateDAO}
                disabled={isPending || isConfirming || !canProceed()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isPending || isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {isPending ? "Confirm in Wallet..." : "Creating DAO..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create DAO
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #3B82F6;
          animation: confetti-fall 3s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}