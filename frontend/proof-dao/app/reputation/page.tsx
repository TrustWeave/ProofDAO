"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReputationDashboard from "@/components/reputation-dashboard"

export default function ReputationPage() {
  const router = useRouter()
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    initializeEthers()
  }, [])

  const initializeEthers = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])

        setProvider(provider)
        setAccount(accounts[0])

        // Check if user is admin (you can implement your own logic here)
        // For now, we'll assume the first account is admin for demo purposes
        setIsAdmin(true)
      }
    } catch (error) {
      console.error("Failed to initialize ethers:", error)
    }
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
                className="text-slate-300 hover:text-black"
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
        <ReputationDashboard account={account} provider={provider} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
