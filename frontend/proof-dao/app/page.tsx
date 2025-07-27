import {
  ArrowRight,
  Shield,
  Zap,
  Trophy,
  Users,
  Github,
  Twitter,
  CheckCircle,
  Star,
  Coins,
  Brain,
  Network,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-600 to-slate-900">
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
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#community" className="text-slate-300 hover:text-white transition-colors">
                Community
              </a>
              <a href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Launch App
              </Button>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-slate-800/50 text-blue-400 border-blue-500/20">
            Powered by Hyperion AI & Metis Blockchain
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Where the world
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> proves</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Zero-knowledge proof system for trustless DAO task verification. No resumes. No KYC. Just proof of skill.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>No resumes. No KYC. Just zk-proof of skill</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <Brain className="w-5 h-5 text-blue-400" />
              <span>AI auto-verifies microtasks for DAOs</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Built on Metis – fast, cheap, EVM-ready</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span>Earn badges, climb leaderboards, get paid</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 py-4"
            >
              Start Contributing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-4 bg-transparent"
            >
              Create DAO Tasks
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Trustless Task Verification</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Revolutionary platform that connects DAOs with global talent through zero-knowledge proofs and AI-powered
              verification
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Shield className="w-12 h-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">Zero-Knowledge Proofs</CardTitle>
                <CardDescription className="text-slate-300">
                  Prove your skills without revealing personal information. Maintain privacy while building reputation.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Brain className="w-12 h-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">AI-Powered Validation</CardTitle>
                <CardDescription className="text-slate-300">
                  Hyperion AI co-agent automatically reviews submissions and ensures quality control for DAO tasks.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Zap className="w-12 h-12 text-yellow-400 mb-4" />
                <CardTitle className="text-white">Metis Integration</CardTitle>
                <CardDescription className="text-slate-300">
                  Built on Metis for fast, cheap transactions. Perfect for micro-payments and DAO workflows.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Trophy className="w-12 h-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Gamified Experience</CardTitle>
                <CardDescription className="text-slate-300">
                  Earn badges, climb leaderboards, and build your on-chain reputation through meaningful contributions.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Users className="w-12 h-12 text-indigo-400 mb-4" />
                <CardTitle className="text-white">Global Talent Pool</CardTitle>
                <CardDescription className="text-slate-300">
                  Access contributors worldwide without traditional hiring barriers. Skills matter, not location.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <Network className="w-12 h-12 text-pink-400 mb-4" />
                <CardTitle className="text-white">DAO Framework</CardTitle>
                <CardDescription className="text-slate-300">
                  Integrated with Metis DAC framework for seamless on-chain DAO governance and task management.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How ProofDAO Works</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Simple, trustless workflow that connects DAOs with verified contributors
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">DAOs Post Tasks</h3>
              <p className="text-slate-300">
                DAOs create bounties for microtasks like design, development, translations, or marketing with clear
                rewards and requirements.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Contributors Submit Work</h3>
              <p className="text-slate-300">
                Contributors complete tasks and submit work along with identity proofs (GitHub, Twitter, or on-chain
                reputation NFTs).
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Verifies & Rewards</h3>
              <p className="text-slate-300">
                Hyperion AI validates submissions, and upon approval, contributors are automatically rewarded based on
                DAO rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Powered by Cutting-Edge Tech</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Built on the most advanced blockchain and AI infrastructure for optimal performance
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700/50 text-center">
              <CardContent className="pt-6">
                <Network className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Metis Blockchain</h3>
                <p className="text-slate-300 text-sm">Fast, cheap, EVM-compatible transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-700/50 text-center">
              <CardContent className="pt-6">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Hyperion AI</h3>
                <p className="text-slate-300 text-sm">AI co-agent for task validation</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700/50 text-center">
              <CardContent className="pt-6">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Zero-Knowledge</h3>
                <p className="text-slate-300 text-sm">Privacy-preserving skill verification</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 border-yellow-700/50 text-center">
              <CardContent className="pt-6">
                <Globe className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Next.js + Web3</h3>
                <p className="text-slate-300 text-sm">Modern frontend with wagmi & RainbowKit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community & Gamification */}
      <section id="community" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Gamified Community Experience</h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Earn points, unlock badges, and climb leaderboards while contributing to the Web3 ecosystem
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-white text-2xl">Earn Points</CardTitle>
                <CardDescription className="text-slate-300">
                  Get points for creating DAOs, posting tasks, submitting work, and reviewing contributions
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <CardTitle className="text-white text-2xl">Unlock Badges</CardTitle>
                <CardDescription className="text-slate-300">
                  Collect achievement badges that showcase your skills and contributions to the community
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Coins className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <CardTitle className="text-white text-2xl">Climb Leaderboards</CardTitle>
                <CardDescription className="text-slate-300">
                  Compete with other contributors and DAOs on global leaderboards for recognition and rewards
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Join the Future of Work?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Whether you're a DAO looking for talent or a contributor ready to prove your skills, ProofDAO is your
            gateway to trustless collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg px-8 py-4"
            >
              Launch App
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-4 bg-transparent"
            >
              Read Documentation
            </Button>
          </div>
          <div className="flex justify-center space-x-6">
            <a href="https://twitter.com/i_dodgerini" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ProofDAO</span>
            </div>
            <div className="text-slate-400 text-sm">© 2025 ProofDAO. Building the future of trustless work.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
