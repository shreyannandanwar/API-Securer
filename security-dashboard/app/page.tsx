"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Shield,
  AlertTriangle,
  Clock,
  Search,
  Globe,
  UserX,
  RefreshCw,
  Filter,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Sample data for charts
const requestData = [
  { time: "00:00", requests: 120, blocked: 5 },
  { time: "01:00", requests: 90, blocked: 3 },
  { time: "02:00", requests: 75, blocked: 2 },
  { time: "03:00", requests: 60, blocked: 1 },
  { time: "04:00", requests: 80, blocked: 2 },
  { time: "05:00", requests: 110, blocked: 4 },
  { time: "06:00", requests: 150, blocked: 7 },
  { time: "07:00", requests: 210, blocked: 12 },
  { time: "08:00", requests: 250, blocked: 15 },
  { time: "09:00", requests: 310, blocked: 20 },
  { time: "10:00", requests: 350, blocked: 25 },
  { time: "11:00", requests: 320, blocked: 18 },
]

const threatTypeData = [
  { name: "DDoS", value: 35 },
  { name: "Brute Force", value: 25 },
  { name: "Bot Activity", value: 30 },
  { name: "Other", value: 10 },
]

const COLORS = ["#ff4d4f", "#faad14", "#1890ff", "#52c41a"]

// Sample request logs
const initialRequestLogs = [
  { id: 1, ip: "192.168.1.105", endpoint: "/api/users", timestamp: "2023-10-15 10:23:45", status: "allowed" },
  {
    id: 2,
    ip: "45.123.45.67",
    endpoint: "/api/login",
    timestamp: "2023-10-15 10:23:40",
    status: "blocked",
    reason: "brute-force",
  },
  { id: 3, ip: "103.45.78.123", endpoint: "/api/products", timestamp: "2023-10-15 10:23:35", status: "allowed" },
  {
    id: 4,
    ip: "72.34.67.189",
    endpoint: "/api/login",
    timestamp: "2023-10-15 10:23:30",
    status: "blocked",
    reason: "bot-detection",
  },
  { id: 5, ip: "192.168.1.110", endpoint: "/api/checkout", timestamp: "2023-10-15 10:23:25", status: "allowed" },
  {
    id: 6,
    ip: "45.123.45.67",
    endpoint: "/api/login",
    timestamp: "2023-10-15 10:23:20",
    status: "blocked",
    reason: "brute-force",
  },
  { id: 7, ip: "89.34.56.123", endpoint: "/api/products/1", timestamp: "2023-10-15 10:23:15", status: "allowed" },
  { id: 8, ip: "192.168.1.115", endpoint: "/api/cart", timestamp: "2023-10-15 10:23:10", status: "allowed" },
  { id: 9, ip: "103.45.78.123", endpoint: "/api/products/2", timestamp: "2023-10-15 10:23:05", status: "allowed" },
  {
    id: 10,
    ip: "72.34.67.189",
    endpoint: "/api/login",
    timestamp: "2023-10-15 10:23:00",
    status: "blocked",
    reason: "bot-detection",
  },
]

// Sample blacklisted IPs
const initialBlacklist = [
  {
    id: 1,
    ip: "45.123.45.67",
    reason: "Brute Force Attack",
    timestamp: "2023-10-15 10:23:40",
    expires: "2023-10-15 11:23:40",
  },
  {
    id: 2,
    ip: "72.34.67.189",
    reason: "Bot Activity",
    timestamp: "2023-10-15 10:23:30",
    expires: "2023-10-15 11:23:30",
  },
  {
    id: 3,
    ip: "91.45.67.23",
    reason: "DDoS Attempt",
    timestamp: "2023-10-15 10:22:15",
    expires: "2023-10-15 11:22:15",
  },
  {
    id: 4,
    ip: "123.45.67.89",
    reason: "Anomaly Detection",
    timestamp: "2023-10-15 10:21:10",
    expires: "2023-10-15 11:21:10",
  },
  {
    id: 5,
    ip: "45.67.89.123",
    reason: "Brute Force Attack",
    timestamp: "2023-10-15 10:20:05",
    expires: "2023-10-15 11:20:05",
  },
]

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false)
  const [requestLogs, setRequestLogs] = useState(initialRequestLogs)
  const [blacklist, setBlacklist] = useState(initialBlacklist)
  const [searchTerm, setSearchTerm] = useState("")
  const [ipLimitValue, setIpLimitValue] = useState([100])
  const [userLimitValue, setUserLimitValue] = useState([50])
  const [jwtLimitValue, setJwtLimitValue] = useState([200])
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Filter logs based on search term and status filter
  const filteredLogs = requestLogs.filter((log) => {
    const matchesSearch =
      log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "blocked" && log.status === "blocked") ||
      (statusFilter === "allowed" && log.status === "allowed")

    return matchesSearch && matchesStatus
  })

  // Simulate new requests coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ["allowed", "blocked"]
      const endpoints = ["/api/users", "/api/login", "/api/products", "/api/checkout", "/api/cart"]
      const reasons = ["brute-force", "bot-detection", "ddos-attempt"]

      const newLog = {
        id: Date.now(),
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      }

      if (newLog.status === "blocked") {
        newLog.reason = reasons[Math.floor(Math.random() * reasons.length)]
      }

      setRequestLogs((prev) => [newLog, ...prev.slice(0, 9)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Function to unblock an IP
  const handleUnblock = (id) => {
    setBlacklist((prev) => prev.filter((item) => item.id !== id))
  }

  // Function to manually block an IP
  const handleManualBlock = () => {
    const ipInput = document.getElementById("block-ip-input")
    const reasonInput = document.getElementById("block-reason-input")

    if (ipInput && reasonInput && ipInput.value) {
      const newBlockedIP = {
        id: Date.now(),
        ip: ipInput.value,
        reason: reasonInput.value || "Manual Block",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        expires: new Date(Date.now() + 3600000).toISOString().replace("T", " ").substring(0, 19),
      }

      setBlacklist((prev) => [newBlockedIP, ...prev])

      // Reset inputs
      ipInput.value = ""
      reasonInput.value = ""
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? "dark" : ""}`}>
      <div className="dark:bg-gray-900 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">API Security Shield</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
                {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
              </button>
              <Button variant="outline" className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-4">
              <TabsTrigger value="dashboard" className="flex items-center justify-center">
                <Shield className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="threats" className="flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Threat Detection
              </TabsTrigger>
              <TabsTrigger value="rate-limiting" className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" />
                Rate Limiting
              </TabsTrigger>
              <TabsTrigger value="blacklist" className="flex items-center justify-center">
                <UserX className="h-4 w-4 mr-2" />
                Blacklist
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24,567</div>
                    <p className="text-xs text-muted-foreground">+12.5% from yesterday</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Blocked Requests (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+5.2% from yesterday</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Blacklisted IPs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{blacklist.length}</div>
                    <p className="text-xs text-muted-foreground">Updated just now</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>API Request Trends</CardTitle>
                    <CardDescription>Requests per hour (last 12 hours)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={requestData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorRequests)"
                            animationDuration={1000}
                          />
                          <Area
                            type="monotone"
                            dataKey="blocked"
                            stroke="#ff4d4f"
                            fillOpacity={1}
                            fill="url(#colorBlocked)"
                            animationDuration={1000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Threat Distribution</CardTitle>
                    <CardDescription>Types of threats detected</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={threatTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={1000}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {threatTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Live Request Logs</CardTitle>
                    <CardDescription>Real-time API request monitoring</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search logs..."
                        className="pl-8 w-[200px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center"
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      Filters
                      {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 overflow-hidden"
                    >
                      <div className="py-2 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                        <span className="text-sm font-medium">Status:</span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant={statusFilter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("all")}
                          >
                            All
                          </Button>
                          <Button
                            variant={statusFilter === "allowed" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("allowed")}
                          >
                            Allowed
                          </Button>
                          <Button
                            variant={statusFilter === "blocked" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("blocked")}
                          >
                            Blocked
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted p-2 text-xs font-medium">
                      <div className="col-span-3">IP Address</div>
                      <div className="col-span-3">Endpoint</div>
                      <div className="col-span-3">Timestamp</div>
                      <div className="col-span-3">Status</div>
                    </div>
                    <div className="divide-y">
                      <AnimatePresence initial={false}>
                        {filteredLogs.map((log) => (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-12 items-center p-2 text-sm"
                          >
                            <div className="col-span-3 flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                              {log.ip}
                            </div>
                            <div className="col-span-3 truncate">{log.endpoint}</div>
                            <div className="col-span-3 text-muted-foreground">{log.timestamp}</div>
                            <div className="col-span-3">
                              {log.status === "blocked" ? (
                                <div className="flex items-center">
                                  <Badge variant="destructive" className="mr-2">
                                    Blocked
                                  </Badge>
                                  <span className="text-xs text-muted-foreground capitalize">{log.reason}</span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Allowed
                                </Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Threat Detection Tab */}
            <TabsContent value="threats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Brute Force Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">347</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Bot Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">523</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">DDoS Attempts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Threat Activity</CardTitle>
                    <CardDescription>Threats detected over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={requestData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="blocked" name="Threats Blocked" fill="#ff4d4f" animationDuration={1000} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ML Model Confidence</CardTitle>
                    <CardDescription>Threat detection confidence levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Brute Force Detection</span>
                          <span className="text-sm font-medium">95%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <motion.div
                            className="bg-red-600 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Bot Detection</span>
                          <span className="text-sm font-medium">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <motion.div
                            className="bg-blue-600 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "87%" }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">DDoS Detection</span>
                          <span className="text-sm font-medium">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <motion.div
                            className="bg-yellow-500 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "92%" }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Anomaly Detection</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <motion.div
                            className="bg-green-500 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "78%" }}
                            transition={{ duration: 1 }}
                          ></motion.div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Manual IP Blocking</CardTitle>
                  <CardDescription>Block IP addresses manually</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="block-ip-input">IP Address</Label>
                      <Input id="block-ip-input" placeholder="Enter IP address to block" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="block-reason-input">Reason</Label>
                      <Input id="block-reason-input" placeholder="Reason for blocking" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleManualBlock} className="w-full md:w-auto">
                        Block IP
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rate Limiting Tab */}
            <TabsContent value="rate-limiting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rate Limiting Settings</CardTitle>
                  <CardDescription>Configure rate limits for different authentication methods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="ip-rate-limit">IP-based Rate Limit (requests per minute)</Label>
                      <span className="text-sm font-medium">{ipLimitValue[0]}</span>
                    </div>
                    <Slider
                      id="ip-rate-limit"
                      min={10}
                      max={500}
                      step={10}
                      value={ipLimitValue}
                      onValueChange={setIpLimitValue}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10</span>
                      <span>500</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="user-rate-limit">User-based Rate Limit (requests per minute)</Label>
                      <span className="text-sm font-medium">{userLimitValue[0]}</span>
                    </div>
                    <Slider
                      id="user-rate-limit"
                      min={10}
                      max={300}
                      step={10}
                      value={userLimitValue}
                      onValueChange={setUserLimitValue}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10</span>
                      <span>300</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="jwt-rate-limit">JWT-based Rate Limit (requests per minute)</Label>
                      <span className="text-sm font-medium">{jwtLimitValue[0]}</span>
                    </div>
                    <Slider
                      id="jwt-rate-limit"
                      min={50}
                      max={1000}
                      step={50}
                      value={jwtLimitValue}
                      onValueChange={setJwtLimitValue}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50</span>
                      <span>1000</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="adaptive-rate-limiting">Adaptive Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically adjust rate limits based on traffic patterns
                        </p>
                      </div>
                      <Switch id="adaptive-rate-limiting" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="geo-based-limiting">Geo-based Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Apply different rate limits based on geographic location
                        </p>
                      </div>
                      <Switch id="geo-based-limiting" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="burst-protection">Burst Protection</Label>
                        <p className="text-sm text-muted-foreground">
                          Prevent sudden spikes in traffic from a single source
                        </p>
                      </div>
                      <Switch id="burst-protection" defaultChecked />
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto">Save Rate Limit Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limit Violations</CardTitle>
                  <CardDescription>Recent rate limit violations by IP address</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted p-2 text-xs font-medium">
                      <div className="col-span-3">IP Address</div>
                      <div className="col-span-3">Endpoint</div>
                      <div className="col-span-2">Requests</div>
                      <div className="col-span-2">Limit</div>
                      <div className="col-span-2">Action</div>
                    </div>
                    <div className="divide-y">
                      <div className="grid grid-cols-12 items-center p-2 text-sm">
                        <div className="col-span-3">45.123.45.67</div>
                        <div className="col-span-3">/api/login</div>
                        <div className="col-span-2">152</div>
                        <div className="col-span-2">100</div>
                        <div className="col-span-2">
                          <Badge variant="destructive">Blocked</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 items-center p-2 text-sm">
                        <div className="col-span-3">72.34.67.189</div>
                        <div className="col-span-3">/api/products</div>
                        <div className="col-span-2">243</div>
                        <div className="col-span-2">200</div>
                        <div className="col-span-2">
                          <Badge variant="destructive">Blocked</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 items-center p-2 text-sm">
                        <div className="col-span-3">91.45.67.23</div>
                        <div className="col-span-3">/api/checkout</div>
                        <div className="col-span-2">87</div>
                        <div className="col-span-2">100</div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Warning
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 items-center p-2 text-sm">
                        <div className="col-span-3">123.45.67.89</div>
                        <div className="col-span-3">/api/users</div>
                        <div className="col-span-2">112</div>
                        <div className="col-span-2">100</div>
                        <div className="col-span-2">
                          <Badge variant="destructive">Blocked</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 items-center p-2 text-sm">
                        <div className="col-span-3">45.67.89.123</div>
                        <div className="col-span-3">/api/cart</div>
                        <div className="col-span-2">76</div>
                        <div className="col-span-2">100</div>
                        <div className="col-span-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Warning
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Blacklist Tab */}
            <TabsContent value="blacklist" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Blacklisted IP Addresses</CardTitle>
                  <CardDescription>Currently blocked IP addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 bg-muted p-2 text-xs font-medium">
                      <div className="col-span-3">IP Address</div>
                      <div className="col-span-3">Reason</div>
                      <div className="col-span-3">Blocked At</div>
                      <div className="col-span-2">Expires</div>
                      <div className="col-span-1">Action</div>
                    </div>
                    <div className="divide-y">
                      <AnimatePresence initial={false}>
                        {blacklist.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-12 items-center p-2 text-sm"
                          >
                            <div className="col-span-3">{item.ip}</div>
                            <div className="col-span-3">{item.reason}</div>
                            <div className="col-span-3">{item.timestamp}</div>
                            <div className="col-span-2">{item.expires}</div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblock(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Unblock</span>
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Blacklist Settings</CardTitle>
                    <CardDescription>Configure blacklist behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-blacklist">Automatic Blacklisting</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically blacklist IPs after multiple violations
                        </p>
                      </div>
                      <Switch id="auto-blacklist" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="persistent-blacklist">Persistent Blacklisting</Label>
                        <p className="text-sm text-muted-foreground">
                          Keep blacklisted IPs blocked after server restart
                        </p>
                      </div>
                      <Switch id="persistent-blacklist" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications for new blacklisted IPs
                        </p>
                      </div>
                      <Switch id="email-alerts" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="block-duration">Default Block Duration (minutes)</Label>
                      <Input id="block-duration" type="number" defaultValue="60" />
                    </div>

                    <Button className="w-full sm:w-auto">Save Blacklist Settings</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Import/Export Blacklist</CardTitle>
                    <CardDescription>Manage blacklist data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-blacklist">Import Blacklist</Label>
                      <Input id="import-blacklist" type="file" />
                      <p className="text-xs text-muted-foreground">
                        Upload a CSV or JSON file with IP addresses to blacklist
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label>Export Blacklist</Label>
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">
                          Export as CSV
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Export as JSON
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button variant="destructive" className="w-full">
                        Clear All Blacklisted IPs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

