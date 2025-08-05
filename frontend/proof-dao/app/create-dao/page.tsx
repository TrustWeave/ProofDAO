"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
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

// Network configuration - Add this to your constants file or here
const NETWORK_CONFIG = {
  chainId: '0x20A55', // 133717 in hex (Metis Sepolia)
  chainName: 'Metis Sepolia Testnet',
  nativeCurrency: {
    name: 'Metis',
    symbol: 'METIS',
    decimals: 18,
  },
  rpcUrls: ['https://hyperion-testnet.metisdevops.link'], // Primary RPC
}

// Fallback RPC URLs in case primary fails
const FALLBACK_RPC_URLS = [
  'https://sepolia.metisdevops.link',
  'https://sepolia.rpc.metis.io',
  // Add more RPC URLs if available
]

export default function CreateDAOPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")
  const [daoId, setDaoId] = useState("")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)

  const router = useRouter();

  // Contract configuration - Updated ABI to match your contract
  const contractAddress = CONTRACT_ADDRESS_DAO || "0x42ac28db42f5be11b922f84893f3d4b960a28968"
  const contractABI = [
    {
      "type": "function",
      "name": "createDAO",
      "inputs": [
        {
          "name": "name",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "description",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "metadataURI",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "DAOCreated",
      "inputs": [
        {
          "name": "daoId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "name",
          "type": "string",
          "indexed": false,
          "internalType": "string"
        }
      ],
      "anonymous": false
    }
  ]

  // Function to switch to correct network
  const switchToCorrectNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw new Error('Failed to add Metis Sepolia network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  }

  // Function to test RPC connection
  const testRPCConnection = async (rpcUrl: string): Promise<ethers.JsonRpcProvider | null> => {
    try {
      const testProvider = new ethers.JsonRpcProvider(rpcUrl);
      await testProvider.getBlockNumber(); // Test the connection
      console.log(`RPC connection successful: ${rpcUrl}`);
      return testProvider;
    } catch (error) {
      console.warn(`RPC connection failed for ${rpcUrl}:`, error);
      return null;
    }
  }

  // Function to get working RPC provider
  const getWorkingProvider = async (): Promise<ethers.JsonRpcProvider | null> => {
    for (const rpcUrl of FALLBACK_RPC_URLS) {
      const provider = await testRPCConnection(rpcUrl);
      if (provider) {
        return provider;
      }
    }
    return null;
  }

  // Function to test contract connection
  const testContractConnection = async () => {
    if (!contract || !provider || !signer) {
      alert("Please connect your wallet first")
      return
    }

    try {
      console.log("Testing contract connection...")
      
      // Test basic contract call using provider (read-only)
      const owner = await contract.owner()
      console.log("Contract owner:", owner)
      
      // Test if we can encode a function call
      const contractInterface = new ethers.Interface(contractABI)
      const testData = contractInterface.encodeFunctionData("owner", [])
      console.log("Test function data:", testData)
      
      // Test if we can call the owner function directly
      try {
        const ownerResult = await provider.call({
          to: contractAddress,
          data: testData
        })
        console.log("Owner call result:", ownerResult)
        
        // Decode the result
        const decodedOwner = contractInterface.decodeFunctionResult("owner", ownerResult)
        console.log("Decoded owner:", decodedOwner)
      } catch (callError) {
        console.error("Direct call to owner failed:", callError)
      }
      
      // Test createDAO function encoding
      const createDAOData = contractInterface.encodeFunctionData("createDAO", [
        "Test DAO",
        "Test Description",
        "https://example.com/metadata"
      ])
      console.log("createDAO function data:", createDAOData)
      
      // Test with the actual form data
      const actualFormData = contractInterface.encodeFunctionData("createDAO", [
        formData.name,
        formData.description,
        "https://example.com/metadata"
      ])
      console.log("Actual form data encoding:", actualFormData)
      
      // Test if we can estimate gas for createDAO (this will fail if the function has issues)
      try {
        const gasEstimate = await provider.estimateGas({
          to: contractAddress,
          data: createDAOData,
          from: await signer.getAddress()
        })
        console.log("Gas estimate for createDAO:", gasEstimate.toString())
      } catch (gasError) {
        console.error("Gas estimation failed:", gasError)
      }
      
      // Check contract state
      try {
        const counters = await contract.getCurrentCounters()
        console.log("Contract counters:", counters)
        
        // Test if we can read from the contract
        const owner = await contract.owner()
        console.log("Contract owner:", owner)
        
        // Test if we can read a non-existent DAO (should return default values)
        try {
          const dao = await contract.daos(1)
          console.log("DAO 1 data:", dao)
        } catch (daoError) {
          console.warn("Could not read DAO 1:", daoError)
        }
        
      } catch (error) {
        console.warn("Could not get contract state:", error)
      }
      
      alert("Contract connection successful! Owner: " + owner + "\nFunction encoding works!")
      
      // Additional contract verification
      console.log("\n=== CONTRACT VERIFICATION ===")
      try {
        // Check if contract exists at address
        const code = await provider.getCode(contractAddress)
        console.log("Contract code length:", code.length)
        console.log("Contract exists:", code !== "0x")
        
        if (code === "0x") {
          alert("WARNING: No contract found at the specified address!")
          return
        }
        
        // Check network
        const network = await provider.getNetwork()
        console.log("Network:", network)
        
        // Check balance
        const balance = await provider.getBalance(await signer.getAddress())
        console.log("Signer balance:", ethers.formatEther(balance), "METIS")
        
      } catch (verifyError) {
        console.error("Contract verification failed:", verifyError)
      }
      
      // Ask user if they want to test a minimal transaction
      const testMinimal = confirm("Would you like to test a minimal DAO creation transaction?")
      if (testMinimal) {
        try {
          console.log("=== MINIMAL TRANSACTION TEST ===")
          console.log("Contract address:", contractAddress)
          console.log("Signer address:", await signer.getAddress())
          
          // Test 1: Simple owner call
          console.log("\n1. Testing owner function...")
          const ownerData = contractInterface.encodeFunctionData("owner", [])
          const ownerResult = await provider.call({
            to: contractAddress,
            data: ownerData
          })
          console.log("Owner result:", ownerResult)
          
          // Test 2: Gas estimation
          console.log("\n2. Testing gas estimation...")
          const minimalData = contractInterface.encodeFunctionData("createDAO", [
            "Test",
            "Test", 
            "https://example.com"
          ])
          console.log("Function data:", minimalData)
          console.log("Function selector:", minimalData.slice(0, 10))
          
          const gasEstimate = await provider.estimateGas({
            to: contractAddress,
            data: minimalData,
            from: await signer.getAddress()
          })
          console.log("Gas estimate:", gasEstimate.toString())
          
          // Test 3: Send transaction
          console.log("\n3. Sending transaction...")
          const feeData = await provider.getFeeData()
          console.log("Gas price:", feeData.gasPrice?.toString())
          
          const testTx = await signer.sendTransaction({
            to: contractAddress,
            data: minimalData,
            gasLimit: gasEstimate + BigInt(50000),
            gasPrice: feeData.gasPrice
          })
          
          console.log("Transaction sent:", testTx.hash)
          console.log("=== TEST COMPLETE ===")
          
          alert("Test completed! Check console for details. Hash: " + testTx.hash)
        } catch (error: any) {
          console.error("=== TEST FAILED ===")
          console.error("Error:", error)
          console.error("Error code:", error.code)
          console.error("Error reason:", error.reason)
          console.error("Error message:", error.message)
          console.error("Transaction data:", error.transaction)
          console.error("Receipt:", error.receipt)
          alert("Test failed! Check console for details.")
        }
      }
    } catch (error: any) {
      console.error("Contract test failed:", error)
      alert("Contract test failed: " + (error.message || 'Unknown error'))
    }
  }

  // Initialize ethers and connect wallet
  useEffect(() => {
    const initializeEthers = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          // First, try to get the network from MetaMask
          const provider = new ethers.BrowserProvider(window.ethereum)
          
          try {
            const network = await provider.getNetwork()
            console.log('Current network:', network)
            
            // Check if we're on the correct network
            if (network.chainId !== BigInt(parseInt(NETWORK_CONFIG.chainId, 16))) {
              setNetworkError(`Please switch to Metis Sepolia network (Chain ID: ${parseInt(NETWORK_CONFIG.chainId, 16)})`)
            } else {
              setNetworkError(null)
            }
          } catch (networkError) {
            console.warn('Could not get network from MetaMask, will try to switch later')
          }
          
          setProvider(provider)
          
          // Check if already connected
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            const signer = await provider.getSigner()
            const contractInterface = new ethers.Interface(contractABI)
            const contract = new ethers.Contract(contractAddress!, contractABI, signer)
            setSigner(signer)
            setContract(contract)
            setIsWalletConnected(true)
          }
        }
      } catch (error) {
        console.error("Error initializing ethers:", error)
        setNetworkError("Failed to initialize wallet connection")
      }
    }

    initializeEthers()
  }, [])

  // Connect wallet function with network switching
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask to create a DAO")
        return
      }

      // First, switch to the correct network
      await switchToCorrectNetwork()

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Verify we're on the correct network
      const network = await provider.getNetwork()
      console.log('Connected to network:', network)
      
      if (network.chainId !== BigInt(parseInt(NETWORK_CONFIG.chainId, 16))) {
        throw new Error(`Wrong network. Please switch to Metis Sepolia (Chain ID: ${parseInt(NETWORK_CONFIG.chainId, 16)})`)
      }

      const signer = await provider.getSigner()
      const contractInterface = new ethers.Interface(contractABI)
      const contract = new ethers.Contract(contractAddress!, contractABI, signer)
      
      // Test contract connection
      try {
        // Try to call a view function or check if contract exists
        const code = await provider.getCode(contractAddress!)
        if (code === '0x') {
          throw new Error('Contract not found at the specified address')
        }
        console.log('Contract verified at:', contractAddress)
        
        // Try to call a simple view function to verify the contract is working
        const testContract = new ethers.Contract(contractAddress!, contractABI, provider)
        try {
          await testContract.owner()
          console.log('Contract is accessible and working')
        } catch (viewError) {
          console.warn('View function call failed, but contract exists:', viewError)
        }
      } catch (contractError) {
        console.error('Contract verification failed:', contractError)
        throw new Error(`Contract not found or invalid at address: ${contractAddress}`)
      }
      
      setProvider(provider)
      setSigner(signer)
      setContract(contract)
      setIsWalletConnected(true)
      setNetworkError(null)
      
      console.log('Wallet connected successfully')
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setNetworkError(error.message)
      alert(`Error connecting wallet: ${error.message}`)
    }
  }

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
    if (!isWalletConnected || !contract || !provider) {
      alert("Please connect your wallet first")
      return
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert("DAO name is required")
      return
    }

    if (!formData.description.trim()) {
      alert("DAO description is required")
      return
    }

    try {
      setIsCreating(true)

      // Verify network again before transaction
      const network = await provider.getNetwork()
      if (network.chainId !== BigInt(parseInt(NETWORK_CONFIG.chainId, 16))) {
        throw new Error('Please switch to Metis Sepolia network')
      }

      // Check account balance
      const balance = await provider.getBalance(await signer!.getAddress())
      console.log('Account balance:', ethers.formatEther(balance), 'METIS')
      
      if (balance === BigInt(0)) {
        throw new Error('Insufficient balance. You need some METIS tokens to pay for gas.')
      }
      
      // Check if balance is too low (less than 0.01 METIS)
      if (balance < ethers.parseEther("0.01")) {
        throw new Error('Balance too low. You need at least 0.01 METIS tokens to pay for gas.')
      }

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

      console.log("Uploading metadata to IPFS...")

      // Upload to IPFS
      let metadataURI: string;
      if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.warn('Pinata API keys not configured, using fallback metadata URI')
        metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`
        console.log("Using fallback metadata URI:", metadataURI)
      } else {
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
        metadataURI = `https://gateway.pinata.cloud/ipfs/${metadataCID}`

        console.log("Metadata uploaded:", metadataURI);
      }

      // Validate form data
      if (!formData.name || formData.name.trim() === "") {
        throw new Error("DAO name is required")
      }
      
      if (!formData.description || formData.description.trim() === "") {
        throw new Error("DAO description is required")
      }
      
      // Validate metadataURI
      if (!metadataURI) {
        throw new Error("Failed to create metadata URI")
      }
      
      console.log("Form validation passed:")
      console.log("- Name:", formData.name)
      console.log("- Description:", formData.description)
      console.log("- Metadata URI length:", metadataURI.length)
      console.log("- Metadata URI preview:", metadataURI.substring(0, 100) + "...")
      
      // Check if metadataURI is too long (should be reasonable for a string parameter)
      if (metadataURI.length > 1000) {
        console.warn("Metadata URI is very long, this might cause issues")
      }

      // Validate contract address
      if (!contractAddress) {
        throw new Error("Contract address is not configured")
      }

      console.log("Creating DAO with contract at:", contractAddress)
      console.log("Signer address:", await signer!.getAddress())
      console.log("Parameters:", {
        name: formData.name,
        description: formData.description,
        metadataURI
      })

      // Get current gas price
      const feeData = await provider.getFeeData()
      console.log("Current gas price:", feeData.gasPrice?.toString())

      // Estimate gas first
      let gasEstimate
      try {
        gasEstimate = await contract.createDAO.estimateGas(
          formData.name,
          formData.description,
          metadataURI
        )
        console.log("Estimated gas:", gasEstimate.toString())
      } catch (estimateError) {
        console.warn("Gas estimation failed, using fallback:", estimateError)
        gasEstimate = BigInt(1000000) // Fallback gas limit
      }
      
      // Ensure we have a reasonable gas limit
      const finalGasLimit = gasEstimate + BigInt(100000) // Add more buffer
      console.log("Final gas limit:", finalGasLimit.toString())

      // Call the smart contract with estimated gas
      console.log("Calling createDAO with parameters:", {
        name: formData.name,
        description: formData.description,
        metadataURI: metadataURI
      })
      
      // Encode the function call data manually to debug
      console.log("Contract interface:", contract.interface)
      console.log("Contract address:", contract.target)
      console.log("Contract ABI:", contractABI)
      
      // Create a new interface manually to ensure it works
      const contractInterface = new ethers.Interface(contractABI)
      console.log("Manual interface:", contractInterface)
      
      const functionData = contractInterface.encodeFunctionData("createDAO", [
        formData.name,
        formData.description,
        metadataURI
      ])
      console.log("Encoded function data:", functionData)
      
      // Verify the function selector
      const expectedSelector = "0xcfb83a8d"
      const actualSelector = functionData.slice(0, 10)
      console.log("Expected selector:", expectedSelector)
      console.log("Actual selector:", actualSelector)
      
      if (actualSelector !== expectedSelector) {
        throw new Error(`Function selector mismatch. Expected: ${expectedSelector}, Got: ${actualSelector}`)
      }
      
      if (!functionData || functionData === "0x") {
        throw new Error("Function data is empty - encoding failed")
      }
      
      // Test the encoding with simple parameters
      const testData = contractInterface.encodeFunctionData("createDAO", [
        "Test DAO",
        "Test Description", 
        "https://example.com/metadata"
      ])
      console.log("Test function data:", testData)
      
      if (!testData || testData === "0x") {
        throw new Error("Test function encoding failed")
      }
      
      // Try calling the function with explicit transaction data
      console.log("Sending transaction with data:", functionData)
      console.log("Transaction params:", {
        to: contractAddress,
        data: functionData,
        gasLimit: gasEstimate + BigInt(50000),
        gasPrice: feeData.gasPrice
      })
      
      const tx = await signer!.sendTransaction({
        to: contractAddress,
        data: functionData,
        gasLimit: finalGasLimit, // Use the final gas limit with more buffer
        gasPrice: feeData.gasPrice // Use current network gas price
      })
      
      console.log("Transaction sent:", tx.hash)
      setTransactionHash(tx.hash)

      // Wait for transaction to be mined with timeout
      console.log("Waiting for transaction confirmation...")
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Transaction timeout - please check your transaction hash")), 120000) // 2 minutes timeout
      })
      
      const receiptPromise = tx.wait(1) // Wait for 1 confirmation
      const receipt = await Promise.race([receiptPromise, timeoutPromise]) as any
      console.log("Transaction confirmed:", receipt)
      
      if (receipt.status === 0) {
        throw new Error("Transaction failed on-chain")
      }

      // Parse the events to get the DAO ID
      let newDaoId = "0";
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          // Look for DAOCreated event
          for (const log of receipt.logs) {
            try {
              const parsedLog = contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              })
              
              if (parsedLog && parsedLog.name === 'DAOCreated') {
                newDaoId = parsedLog.args.daoId.toString()
                console.log("DAO ID from event:", newDaoId)
                break
              }
            } catch (parseError) {
              // Skip logs that can't be parsed
              continue
            }
          }
        } catch (error) {
          console.error("Error parsing events:", error)
          // Fallback - use a placeholder ID
          newDaoId = Math.floor(Math.random() * 10000).toString()
        }
      }

      setDaoId(newDaoId)
      setIsCreating(false)
      setIsSuccess(true)
      setShowConfetti(true)
      setCurrentStep(5)
      
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000)

    } catch (error: any) {
      console.error("Error creating DAO:", error)
      setIsCreating(false)
      
      // Handle different types of errors
      if (error.code === 'ACTION_REJECTED') {
        alert("Transaction was rejected by user")
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        alert("Insufficient funds for transaction. Please ensure you have enough METIS tokens.")
      } else if (error.code === 'NETWORK_ERROR') {
        alert("Network error. Please check your internet connection and try again.")
      } else if (error.code === 'TIMEOUT') {
        alert("Transaction timed out. Please try again.")
      } else if (error.message && error.message.includes('timeout')) {
        alert("Transaction timed out. Please check your transaction hash and try again.")
      } else if (error.message && error.message.includes('Contract not found')) {
        alert("Contract not found. Please check the contract address configuration.")
      } else if (error.message && error.message.includes('Wrong network')) {
        alert("Please switch to Metis Sepolia testnet in your wallet.")
      } else if (error.reason) {
        alert(`Transaction failed: ${error.reason}`)
      } else {
        alert(`Error creating DAO: ${error.message || 'Unknown error occurred'}`)
      }
    }
  }

  // Rest of your render methods remain the same...
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

            {/* Network Error Warning */}
            {networkError && (
              <Card className="bg-red-900/20 border-red-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-red-400 font-semibold mb-2">Network Issue</h3>
                      <p className="text-red-300 text-sm">{networkError}</p>
                    </div>
                    <Button onClick={connectWallet} className="bg-red-600 hover:bg-red-700">
                      Fix Network
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet Connection Status */}
            {!isWalletConnected && (
              <Card className="bg-orange-900/20 border-orange-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-orange-400 font-semibold mb-2">Wallet Not Connected</h3>
                      <p className="text-orange-300 text-sm">
                        You need to connect your wallet to create a DAO
                      </p>
                    </div>
                    <Button onClick={connectWallet} className="bg-orange-600 hover:bg-orange-700">
                      Connect Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <p className="text-slate-400 text-xs mt-1">
                      Network: Metis Sepolia Testnet (Chain ID: {parseInt(NETWORK_CONFIG.chainId, 16)})
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Shield className="w-8 h-8 text-blue-400" />
                    {isWalletConnected && (
                      <Button 
                        onClick={testContractConnection}
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                      >
                        Test Contract
                      </Button>
                    )}
                  </div>
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
                      {transactionHash ? (
                        <a 
                          href={`https://sepolia-andromeda-explorer.metis.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
                        </a>
                      ) : "..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-white">Metis Sepolia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-green-400">Confirmed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push(`/dao/${daoId}`)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View DAO Dashboard
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
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
        return isWalletConnected && !networkError
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
                disabled={isCreating || !canProceed()}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating DAO...
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