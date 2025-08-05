"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Star,
  Trophy,
  Award,
  ExternalLink,
  Github,
  Twitter,
  MessageCircle,
  Linkedin,
  Globe,
  Edit,
  Zap,
} from "lucide-react"

interface ReputationNFT {
  tokenId: string
  contributor: string
  skillType: number
  level: number
  completedTasks: number
  totalEarnings: string
  averageQuality: number
  createdAt: number
  lastUpdated: number
  badges: string[]
  isActive: boolean
}

interface SocialLinks {
  github: string
  twitter: string
  discord: string
  linkedin: string
  website: string
}

interface ReputationNFTCardProps {
  tokenId: string
  contract: ethers.Contract | null
  provider: ethers.BrowserProvider | null
  account: string | null
  isOwner?: boolean
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

const REPUTATION_LEVELS = ["Newcomer", "Contributor", "Expert", "Master", "Legend"]

const LEVEL_COLORS = ["bg-gray-500", "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-yellow-500"]

const LEVEL_THRESHOLDS = [0, 5, 20, 50, 100]

export default function ReputationNFTCard({
  tokenId,
  contract,
  provider,
  account,
  isOwner = false,
}: ReputationNFTCardProps) {
  const [reputation, setReputation] = useState<ReputationNFT | null>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSocialDialog, setShowSocialDialog] = useState(false)
  const [isUpdatingSocial, setIsUpdatingSocial] = useState(false)
  const [socialForm, setSocialForm] = useState({
    github: "",
    twitter: "",
    discord: "",
    linkedin: "",
    website: "",
  })

  useEffect(() => {
    loadReputationData()
  }, [tokenId, contract])

  const loadReputationData = async () => {
    if (!contract || !tokenId) return

    try {
      setIsLoading(true)

      // Load reputation data
      const repData = await contract.reputations(BigInt(tokenId))
      const badges = await contract.getReputationBadges(BigInt(tokenId))

      const reputationNFT: ReputationNFT = {
        tokenId,
        contributor: repData[0],
        skillType: Number(repData[1]),
        level: Number(repData[2]),
        completedTasks: Number(repData[3]),
        totalEarnings: repData[4].toString(),
        averageQuality: Number(repData[5]),
        createdAt: Number(repData[6]),
        lastUpdated: Number(repData[7]),
        badges: badges,
        isActive: repData[9],
      }

      setReputation(reputationNFT)

      // Load social links if it's the user's own NFT
      if (account && reputationNFT.contributor.toLowerCase() === account.toLowerCase()) {
        try {
          const social = await contract.socialLinks(account)
          const socialData: SocialLinks = {
            github: social[0],
            twitter: social[1],
            discord: social[2],
            linkedin: social[3],
            website: social[4],
          }
          setSocialLinks(socialData)
          setSocialForm(socialData)
        } catch (error) {
          console.error("Error loading social links:", error)
        }
      }
    } catch (error) {
      console.error("Error loading reputation data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSocialLinks = async () => {
    if (!contract || !provider || !account) {
      alert("Please connect your wallet")
      return
    }

    try {
      setIsUpdatingSocial(true)

      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)

      const tx = await contractWithSigner.updateSocialLinks(
        socialForm.github,
        socialForm.twitter,
        socialForm.discord,
        socialForm.linkedin,
        socialForm.website,
      )

      console.log("Transaction sent:", tx.hash)
      await tx.wait()

      setSocialLinks(socialForm)
      setShowSocialDialog(false)
      alert("Social links updated successfully!")
    } catch (error: any) {
      console.error("Error updating social links:", error)
      if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert("Error updating social links. Please try again.")
      }
    } finally {
      setIsUpdatingSocial(false)
    }
  }

  const formatEarnings = (earnings: string) => {
    const value = Number.parseFloat(ethers.formatEther(earnings))
    return value.toFixed(4)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getProgressToNextLevel = () => {
    if (!reputation) return 0

    const currentLevel = reputation.level
    const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel]

    if (currentLevel >= LEVEL_THRESHOLDS.length - 1) return 100

    const progress =
      ((reputation.completedTasks - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const getTasksToNextLevel = () => {
    if (!reputation) return 0

    const currentLevel = reputation.level
    if (currentLevel >= LEVEL_THRESHOLDS.length - 1) return 0

    const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel + 1]
    return Math.max(0, nextLevelThreshold - reputation.completedTasks)
  }

  const isOwnNFT = account && reputation && reputation.contributor.toLowerCase() === account.toLowerCase()

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!reputation) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-slate-400">Failed to load reputation data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={`${LEVEL_COLORS[reputation.level]} text-white text-lg`}>
                {SKILL_TYPES[reputation.skillType].substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-white text-lg">{SKILL_TYPES[reputation.skillType]} Reputation</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={`${LEVEL_COLORS[reputation.level]} text-white border-0`}>
                  <Trophy className="w-3 h-3 mr-1" />
                  {REPUTATION_LEVELS[reputation.level]}
                </Badge>
                <span className="text-slate-400 text-sm">#{tokenId}</span>
              </div>
            </div>
          </div>

          {isOwnNFT && (
            <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Update Social Links</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">GitHub Username</Label>
                    <Input
                      value={socialForm.github}
                      onChange={(e) => setSocialForm((prev) => ({ ...prev, github: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Twitter Handle</Label>
                    <Input
                      value={socialForm.twitter}
                      onChange={(e) => setSocialForm((prev) => ({ ...prev, twitter: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Discord Username</Label>
                    <Input
                      value={socialForm.discord}
                      onChange={(e) => setSocialForm((prev) => ({ ...prev, discord: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="username#1234"
                    />
                  </div>
                  <div>
                    <Label className="text-white">LinkedIn Profile</Label>
                    <Input
                      value={socialForm.linkedin}
                      onChange={(e) => setSocialForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Website</Label>
                    <Input
                      value={socialForm.website}
                      onChange={(e) => setSocialForm((prev) => ({ ...prev, website: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowSocialDialog(false)} disabled={isUpdatingSocial}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateSocialLinks}
                      disabled={isUpdatingSocial}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdatingSocial ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-white">{reputation.completedTasks}</p>
            <p className="text-slate-400 text-sm">Tasks Completed</p>
          </div>
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-green-400">{formatEarnings(reputation.totalEarnings)}</p>
            <p className="text-slate-400 text-sm">METIS Earned</p>
          </div>
        </div>

        {/* Quality Score */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Average Quality</span>
            <span className="text-white">{reputation.averageQuality}/100</span>
          </div>
          <Progress value={reputation.averageQuality} className="h-2" />
        </div>

        {/* Level Progress */}
        {reputation.level < REPUTATION_LEVELS.length - 1 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progress to {REPUTATION_LEVELS[reputation.level + 1]}</span>
              <span className="text-white">{getTasksToNextLevel()} tasks to go</span>
            </div>
            <Progress value={getProgressToNextLevel()} className="h-2" />
          </div>
        )}

        {/* Badges */}
        {reputation.badges.length > 0 && (
          <div>
            <h4 className="text-white font-medium mb-2 flex items-center">
              <Award className="w-4 h-4 mr-2 text-yellow-400" />
              Badges ({reputation.badges.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {reputation.badges.map((badge, index) => (
                <Badge key={index} variant="outline" className="border-yellow-600 text-yellow-400">
                  <Star className="w-3 h-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {socialLinks &&
          (socialLinks.github ||
            socialLinks.twitter ||
            socialLinks.discord ||
            socialLinks.linkedin ||
            socialLinks.website) && (
            <div>
              <h4 className="text-white font-medium mb-2">Social Links</h4>
              <div className="flex flex-wrap gap-2">
                {socialLinks.github && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    asChild
                  >
                    <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-1" />
                      GitHub
                    </a>
                  </Button>
                )}
                {socialLinks.twitter && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    asChild
                  >
                    <a
                      href={`https://twitter.com/${socialLinks.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="w-4 h-4 mr-1" />
                      Twitter
                    </a>
                  </Button>
                )}
                {socialLinks.discord && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {socialLinks.discord}
                  </Button>
                )}
                {socialLinks.linkedin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    asChild
                  >
                    <a
                      href={
                        socialLinks.linkedin.startsWith("http")
                          ? socialLinks.linkedin
                          : `https://${socialLinks.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="w-4 h-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {socialLinks.website && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    asChild
                  >
                    <a
                      href={
                        socialLinks.website.startsWith("http") ? socialLinks.website : `https://${socialLinks.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

        {/* Metadata */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>Created: {formatDate(reputation.createdAt)}</p>
          <p>Last Updated: {formatDate(reputation.lastUpdated)}</p>
          <p>
            Owner: {reputation.contributor.substring(0, 6)}...
            {reputation.contributor.substring(reputation.contributor.length - 4)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            asChild
          >
            <a
              href={`https://opensea.io/assets/ethereum/${contract?.target}/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View on OpenSea
            </a>
          </Button>
          {isOwner && (
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Zap className="w-4 h-4 mr-1" />
              Boost Reputation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
