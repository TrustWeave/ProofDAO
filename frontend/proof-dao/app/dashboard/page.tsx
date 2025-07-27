"use client"

import {
    Bell,
    Plus,
    Search,
    Trophy,
    Users,
    CheckCircle,
    Clock,
    Award,
    Coins,
    Brain,
    Shield,
    ArrowRight,
    Gift,
    Router,
  } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent } from "@/components/ui/card"
  import { Badge } from "@/components/ui/badge"
  import { Progress } from "@/components/ui/progress"
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
  
  export default function DashboardPage() {
    const router = useRouter();
    // Mock user data
    const userData = {
      address: "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4",
      username: "cryptodev_alice",
      level: 12,
      points: 2847,
      nextLevelPoints: 3000,
      completedTasks: 23,
      createdDAOs: 2,
      reputation: 4.8,
      badges: 8,
    }
  
    const recentActivities = [
      {
        id: 1,
        type: "task_completed",
        title: "Smart Contract Audit completed",
        dao: "DeFi Protocol DAO",
        reward: "150 METIS",
        time: "2 hours ago",
        status: "completed",
      },
      {
        id: 2,
        type: "badge_earned",
        title: "Security Expert badge earned",
        description: "Completed 10 security audits",
        time: "1 day ago",
        status: "new",
      },
      {
        id: 3,
        type: "dao_created",
        title: "Created 'Web3 Marketing DAO'",
        description: "Successfully launched with 50 initial members",
        time: "3 days ago",
        status: "success",
      },
      {
        id: 4,
        type: "task_submitted",
        title: "UI/UX Design submitted",
        dao: "NFT Marketplace DAO",
        time: "5 days ago",
        status: "pending",
      },
    ]
  
    const aiRecommendations = [
      {
        id: 1,
        title: "Smart Contract Development",
        dao: "GameFi Protocol",
        reward: "200 METIS",
        difficulty: "Advanced",
        match: 95,
        deadline: "3 days",
        tags: ["Solidity", "DeFi", "Security"],
      },
      {
        id: 2,
        title: "Frontend React Development",
        dao: "Social DAO Platform",
        reward: "120 METIS",
        difficulty: "Intermediate",
        match: 88,
        deadline: "1 week",
        tags: ["React", "Web3", "UI/UX"],
      },
      {
        id: 3,
        title: "Technical Documentation",
        dao: "Cross-chain Bridge",
        reward: "80 METIS",
        difficulty: "Beginner",
        match: 82,
        deadline: "5 days",
        tags: ["Writing", "Technical", "Documentation"],
      },
    ]
  
    const leaderboardData = [
      { rank: 1, username: "zk_master", points: 5420, badge: "🏆" },
      { rank: 2, username: "dao_builder", points: 4890, badge: "🥈" },
      { rank: 3, username: "crypto_alice", points: 4250, badge: "🥉" },
      { rank: 4, username: "web3_dev", points: 3890, badge: "⭐" },
      { rank: 5, username: "defi_expert", points: 3650, badge: "⭐" },
    ]
  
    const notifications = [
      {
        id: 1,
        type: "task_approved",
        message: "Your smart contract audit was approved!",
        time: "1 hour ago",
        unread: true,
      },
      {
        id: 2,
        type: "new_task",
        message: "New high-paying task matches your skills",
        time: "3 hours ago",
        unread: true,
      },
      {
        id: 3,
        type: "level_up",
        message: "Congratulations! You reached Level 12",
        time: "1 day ago",
        unread: false,
      },
    ]
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-600 to-slate-900">
        {/* Navigation */}
        <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ProofDAO</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                    CA
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </nav>
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome back, {userData.username}! 👋</h1>
                <p className="text-slate-300">
                  Ready to contribute to the Web3 ecosystem? Here's what's happening today.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg">
                  Level {userData.level}
                </Badge>
              </div>
            </div>
  
            {/* User Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{userData.points.toLocaleString()}</div>
                  <div className="text-sm text-slate-300">Total Points</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{userData.completedTasks}</div>
                  <div className="text-sm text-slate-300">Tasks Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{userData.reputation}</div>
                  <div className="text-sm text-slate-300">Reputation</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">{userData.badges}</div>
                  <div className="text-sm text-slate-300">Badges Earned</div>
                </CardContent>
              </Card>
            </div>
  
            {/* Level Progress */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Level Progress</h3>
                    <p className="text-slate-300 text-sm">
                      {userData.nextLevelPoints - userData.points} points to Level {userData.level + 1}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <Progress value={(userData.points / userData.nextLevelPoints) * 100} className="h-3 bg-slate-700" />
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>{userData.points} points</span>
                  <span>{userData.nextLevelPoints} points</span>
                </div>
              </CardContent>
            </Card>
          </div>
  
          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card onClick={() => router.push("/create-dao")} className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700/50 hover:from-blue-800/50 hover:to-blue-700/50 transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <Plus className="w-12 h-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-semibold text-white mb-2">Create DAO</h3>
                      <p className="text-slate-300 text-sm">Launch your own DAO and start posting tasks</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-700/50 hover:from-purple-800/50 hover:to-purple-700/50 transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <Search className="w-12 h-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-semibold text-white mb-2">Browse Tasks</h3>
                      <p className="text-slate-300 text-sm">Find tasks that match your skills</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700/50 hover:from-green-800/50 hover:to-green-700/50 transition-all cursor-pointer group">
                    <CardContent className="p-6 text-center">
                      <Award className="w-12 h-12 text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-semibold text-white mb-2">Check Reputation</h3>
                      <p className="text-slate-300 text-sm">View your on-chain reputation and badges</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
  
              {/* AI Recommendations */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Brain className="w-6 h-6 text-purple-400 mr-2" />
                    AI-Powered Recommendations
                  </h2>
                  <Button variant="ghost" className="text-slate-300 hover:text-white">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {aiRecommendations.map((task) => (
                    <Card
                      key={task.id}
                      className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                              <Badge className="bg-green-900/50 text-green-400 border-green-700">
                                {task.match}% Match
                              </Badge>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">by {task.dao}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {task.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="border-slate-600 text-slate-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400 mb-1">{task.reward}</div>
                            <div className="text-sm text-slate-400">{task.difficulty}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-slate-400 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {task.deadline} left
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            Apply Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
  
              {/* Recent Activity */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-slate-700/30">
                          <div className="flex-shrink-0">
                            {activity.type === "task_completed" && <CheckCircle className="w-6 h-6 text-green-400" />}
                            {activity.type === "badge_earned" && <Award className="w-6 h-6 text-yellow-400" />}
                            {activity.type === "dao_created" && <Users className="w-6 h-6 text-blue-400" />}
                            {activity.type === "task_submitted" && <Clock className="w-6 h-6 text-orange-400" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{activity.title}</h4>
                            {activity.dao && <p className="text-slate-300 text-sm">for {activity.dao}</p>}
                            {activity.description && <p className="text-slate-300 text-sm">{activity.description}</p>}
                            {activity.reward && <p className="text-green-400 text-sm font-medium">+{activity.reward}</p>}
                            <p className="text-slate-400 text-xs mt-1">{activity.time}</p>
                          </div>
                          <Badge
                            className={
                              activity.status === "completed"
                                ? "bg-green-900/50 text-green-400 border-green-700"
                                : activity.status === "new"
                                  ? "bg-blue-900/50 text-blue-400 border-blue-700"
                                  : activity.status === "success"
                                    ? "bg-purple-900/50 text-purple-400 border-purple-700"
                                    : "bg-orange-900/50 text-orange-400 border-orange-700"
                            }
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
  
            {/* Right Column */}
            <div className="space-y-8">
              {/* Notifications */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Bell className="w-6 h-6 text-blue-400 mr-2" />
                  Notifications
                </h2>
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg ${
                            notification.unread ? "bg-blue-900/20 border border-blue-700/30" : "bg-slate-700/30"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white text-sm">{notification.message}</p>
                              <p className="text-slate-400 text-xs mt-1">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-slate-300 hover:text-white">
                      View All Notifications
                    </Button>
                  </CardContent>
                </Card>
              </div>
  
              {/* Leaderboard Preview */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mr-2" />
                  Leaderboard
                </h2>
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {leaderboardData.map((user) => (
                        <div
                          key={user.rank}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            user.username === "crypto_alice"
                              ? "bg-blue-900/30 border border-blue-700/50"
                              : "bg-slate-700/30"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{user.badge}</span>
                            <div>
                              <p className="text-white font-medium">
                                #{user.rank} {user.username}
                              </p>
                              <p className="text-slate-400 text-sm">{user.points.toLocaleString()} points</p>
                            </div>
                          </div>
                          {user.username === "crypto_alice" && (
                            <Badge className="bg-blue-900/50 text-blue-400 border-blue-700">You</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4 text-slate-300 hover:text-white">
                      View Full Leaderboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
  
              {/* Points Balance */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Coins className="w-6 h-6 text-green-400 mr-2" />
                  Earnings
                </h2>
                <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-green-400 mb-2">847.5 METIS</div>
                      <p className="text-slate-300 text-sm">Total Earned This Month</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>Completed Tasks:</span>
                        <span className="text-green-400">+720 METIS</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Bonus Rewards:</span>
                        <span className="text-green-400">+127.5 METIS</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                      <Gift className="w-4 h-4 mr-2" />
                      Claim Rewards
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  