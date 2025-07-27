// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MetisDAC
 * @dev Integration with Metis DAC framework for enhanced DAO governance
 * @author ProofDAO Team
 */
contract MetisDAC is Ownable, ReentrancyGuard {
    
    // ProofDAO Core contract reference
    address public proofDAOCore;
    
    // Voting parameters
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant MIN_QUORUM_PERCENTAGE = 10; // 10%
    uint256 public constant PROPOSAL_THRESHOLD = 1000; // Minimum points to create proposal
    
    // Proposal types
    enum ProposalType { 
        TaskApproval,      // Approve/reject task submissions
        RewardModification, // Modify task rewards
        DAOGovernance,     // General DAO governance
        PlatformUpgrade,   // Platform improvements
        DisputeResolution  // Resolve disputes
    }
    
    // Proposal status
    enum ProposalStatus { 
        Active, 
        Passed, 
        Rejected, 
        Executed, 
        Cancelled 
    }
    
    // Governance proposal structure
    struct Proposal {
        uint256 id;
        uint256 daoId;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        string metadataURI; // IPFS hash for detailed proposal
        uint256 targetId; // Task ID, Submission ID, or other relevant ID
        uint256 proposedValue; // New reward amount or other numeric value
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
        bool executed;
        string executionResult;
    }
    
    // Vote structure
    struct Vote {
        address voter;
        uint256 proposalId;
        uint8 support; // 0 = against, 1 = for, 2 = abstain
        uint256 weight; // Voting weight based on reputation/points
        uint256 timestamp;
        string reason;
    }
    
    // DAO governance settings
    struct DAOGovernance {
        uint256 daoId;
        uint256 minQuorum; // Minimum votes required
        uint256 votingDuration; // Custom voting duration
        bool useReputationVoting; // Use reputation-based voting weights
        bool allowDelegation; // Allow vote delegation
        address[] members; // DAO members with voting rights
        mapping(address => bool) isMember;
        mapping(address => uint256) votingWeight;
        mapping(address => address) delegates; // Vote delegation
    }
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => uint256[]) public daoProposals; // daoId => proposalIds[]
    mapping(uint256 => mapping(address => Vote)) public votes; // proposalId => voter => vote
    mapping(uint256 => address[]) public proposalVoters; // proposalId => voters[]
    mapping(uint256 => DAOGovernance) public daoGovernance;
    mapping(address => uint256[]) public userProposals;
    mapping(address => uint256[]) public userVotes;
    
    // Counters
    uint256 private _proposalIds;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed daoId,
        address indexed proposer,
        ProposalType proposalType,
        string title
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight,
        string reason
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        ProposalStatus status,
        string result
    );
    
    event DAOGovernanceCreated(uint256 indexed daoId, address indexed creator);
    event VoteDelegated(address indexed delegator, address indexed delegate, uint256 indexed daoId);
    event QuorumReached(uint256 indexed proposalId, uint256 totalVotes);
    event DisputeRaised(uint256 indexed taskId, address indexed disputer, string reason);
    
    // Modifiers
    modifier onlyProofDAOCore() {
        require(msg.sender == proofDAOCore, "Only ProofDAO Core can call");
        _;
    }
    
    modifier validProposal(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= _proposalIds, "Invalid proposal ID");
        _;
    }
    
    modifier onlyDAOMember(uint256 daoId) {
        require(daoGovernance[daoId].isMember[msg.sender], "Not a DAO member");
        _;
    }
    
    modifier votingActive(uint256 proposalId) {
        require(proposals[proposalId].status == ProposalStatus.Active, "Voting not active");
        require(block.timestamp <= proposals[proposalId].votingDeadline, "Voting period ended");
        _;
    }
    
    constructor(address _proofDAOCore) Ownable(msg.sender) {
        proofDAOCore = _proofDAOCore;
    }
    
    /**
     * @dev Create DAO governance structure
     * @param daoId DAO ID from ProofDAO Core
     * @param useReputationVoting Whether to use reputation-based voting
     * @param allowDelegation Whether to allow vote delegation
     * @param customVotingDuration Custom voting duration (0 for default)
     */
    function createDAOGovernance(
        uint256 daoId,
        bool useReputationVoting,
        bool allowDelegation,
        uint256 customVotingDuration
    ) external returns (bool) {
        require(daoGovernance[daoId].daoId == 0, "Governance already exists");
        
        uint256 votingDuration = customVotingDuration > 0 ? customVotingDuration : VOTING_DURATION;
        
        DAOGovernance storage governance = daoGovernance[daoId];
        governance.daoId = daoId;
        governance.minQuorum = 0; // Will be calculated based on member count
        governance.votingDuration = votingDuration;
        governance.useReputationVoting = useReputationVoting;
        governance.allowDelegation = allowDelegation;
        
        // Add creator as first member
        governance.members.push(msg.sender);
        governance.isMember[msg.sender] = true;
        governance.votingWeight[msg.sender] = 1;
        
        emit DAOGovernanceCreated(daoId, msg.sender);
        return true;
    }
    
    /**
     * @dev Add member to DAO governance
     * @param daoId DAO ID
     * @param member Address to add as member
     * @param weight Voting weight for the member
     */
    function addDAOMember(
        uint256 daoId,
        address member,
        uint256 weight
    ) external onlyDAOMember(daoId) {
        require(!daoGovernance[daoId].isMember[member], "Already a member");
        require(weight > 0, "Weight must be > 0");
        
        DAOGovernance storage governance = daoGovernance[daoId];
        governance.members.push(member);
        governance.isMember[member] = true;
        governance.votingWeight[member] = weight;
        
        // Update minimum quorum based on member count
        governance.minQuorum = (governance.members.length * MIN_QUORUM_PERCENTAGE) / 100;
        if (governance.minQuorum == 0) governance.minQuorum = 1;
    }
    
    /**
     * @dev Create a proposal for DAO voting
     * @param daoId DAO ID
     * @param proposalType Type of proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param metadataURI IPFS hash for detailed proposal
     * @param targetId Relevant ID (task, submission, etc.)
     * @param proposedValue Proposed numeric value
     */
    function createProposal(
        uint256 daoId,
        ProposalType proposalType,
        string memory title,
        string memory description,
        string memory metadataURI,
        uint256 targetId,
        uint256 proposedValue
    ) external onlyDAOMember(daoId) returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        
        // Check if proposer meets threshold (this would integrate with reputation system)
        // For now, any DAO member can propose
        
        _proposalIds++;
        uint256 proposalId = _proposalIds;
        
        uint256 votingDeadline = block.timestamp + daoGovernance[daoId].votingDuration;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            daoId: daoId,
            proposer: msg.sender,
            proposalType: proposalType,
            title: title,
            description: description,
            metadataURI: metadataURI,
            targetId: targetId,
            proposedValue: proposedValue,
            createdAt: block.timestamp,
            votingDeadline: votingDeadline,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            status: ProposalStatus.Active,
            executed: false,
            executionResult: ""
        });
        
        // Update mappings
        daoProposals[daoId].push(proposalId);
        userProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(proposalId, daoId, msg.sender, proposalType, title);
        return proposalId;
    }
    
    /**
     * @dev Cast vote on a proposal
     * @param proposalId Proposal ID
     * @param support Vote type (0=against, 1=for, 2=abstain)
     * @param reason Voting reason
     */
    function castVote(
        uint256 proposalId,
        uint8 support,
        string memory reason
    ) external validProposal(proposalId) votingActive(proposalId) {
        require(support <= 2, "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        uint256 daoId = proposal.daoId;
        
        require(daoGovernance[daoId].isMember[msg.sender], "Not a DAO member");
        require(votes[proposalId][msg.sender].voter == address(0), "Already voted");
        
        // Calculate voting weight
        uint256 weight = _calculateVotingWeight(msg.sender, daoId);
        
        // Record vote
        votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            proposalId: proposalId,
            support: support,
            weight: weight,
            timestamp: block.timestamp,
            reason: reason
        });
        
        proposalVoters[proposalId].push(msg.sender);
        userVotes[msg.sender].push(proposalId);
        
        // Update vote counts
        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight, reason);
        
        // Check if quorum reached
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes >= daoGovernance[daoId].minQuorum) {
            emit QuorumReached(proposalId, totalVotes);
        }
    }
    
    /**
     * @dev Execute proposal after voting period
     * @param proposalId Proposal ID
     */
    function executeProposal(uint256 proposalId) external validProposal(proposalId) nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.votingDeadline, "Voting still active");
        require(!proposal.executed, "Already executed");
        
        uint256 daoId = proposal.daoId;
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        
        // Check quorum
        if (totalVotes < daoGovernance[daoId].minQuorum) {
            proposal.status = ProposalStatus.Rejected;
            proposal.executionResult = "Quorum not reached";
        } else if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Passed;
            
            // Execute based on proposal type
            bool executionSuccess = _executeProposalAction(proposal);
            
            if (executionSuccess) {
                proposal.status = ProposalStatus.Executed;
                proposal.executionResult = "Successfully executed";
            } else {
                proposal.executionResult = "Execution failed";
            }
        } else {
            proposal.status = ProposalStatus.Rejected;
            proposal.executionResult = "More votes against than for";
        }
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId, proposal.status, proposal.executionResult);
    }
    
    /**
     * @dev Internal function to execute proposal actions
     */
    function _executeProposalAction(Proposal memory proposal) internal returns (bool) {
        // This would integrate with ProofDAO Core contract
        // For now, return true for successful simulation
        
        if (proposal.proposalType == ProposalType.TaskApproval) {
            // Would call ProofDAO Core to approve/reject submission
            return true;
        } else if (proposal.proposalType == ProposalType.RewardModification) {
            // Would call ProofDAO Core to modify task reward
            return true;
        } else if (proposal.proposalType == ProposalType.DisputeResolution) {
            // Would handle dispute resolution logic
            return true;
        }
        
        return true; // Default success for governance proposals
    }
    
    /**
     * @dev Delegate voting power to another address
     * @param daoId DAO ID
     * @param delegate Address to delegate to
     */
    function delegateVote(uint256 daoId, address delegate) external onlyDAOMember(daoId) {
        require(daoGovernance[daoId].allowDelegation, "Delegation not allowed");
        require(daoGovernance[daoId].isMember[delegate], "Delegate not a member");
        require(delegate != msg.sender, "Cannot delegate to self");
        
        daoGovernance[daoId].delegates[msg.sender] = delegate;
        emit VoteDelegated(msg.sender, delegate, daoId);
    }
    
    /**
     * @dev Calculate voting weight for a member
     * @param member Member address
     * @param daoId DAO ID
     */
    function _calculateVotingWeight(address member, uint256 daoId) internal view returns (uint256) {
        DAOGovernance storage governance = daoGovernance[daoId];
        
        if (governance.useReputationVoting) {
            // This would integrate with reputation system
            // For now, return base weight
            return governance.votingWeight[member];
        } else {
            return governance.votingWeight[member];
        }
    }
    
    /**
     * @dev Raise a dispute for a task or submission
     * @param taskId Task ID
     * @param reason Dispute reason
     */
    function raiseDispute(uint256 taskId, string memory reason) external {
        require(bytes(reason).length > 0, "Reason required");
        
        // This would create a dispute resolution proposal
        // For now, just emit event
        emit DisputeRaised(taskId, msg.sender, reason);
    }
    
    /**
     * @dev Get DAO proposals
     */
    function getDAOProposals(uint256 daoId) external view returns (uint256[] memory) {
        return daoProposals[daoId];
    }
    
    /**
     * @dev Get proposal voters
     */
    function getProposalVoters(uint256 proposalId) external view returns (address[] memory) {
        return proposalVoters[proposalId];
    }
    
    /**
     * @dev Get user's proposals
     */
    function getUserProposals(address user) external view returns (uint256[] memory) {
        return userProposals[user];
    }
    
    /**
     * @dev Get user's votes
     */
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return userVotes[user];
    }
    
    /**
     * @dev Get DAO members
     */
    function getDAOMembers(uint256 daoId) external view returns (address[] memory) {
        return daoGovernance[daoId].members;
    }
    
    /**
     * @dev Check if address is DAO member
     */
    function isDAOMember(uint256 daoId, address member) external view returns (bool) {
        return daoGovernance[daoId].isMember[member];
    }
    
    /**
     * @dev Get member voting weight
     */
    function getMemberVotingWeight(uint256 daoId, address member) external view returns (uint256) {
        return daoGovernance[daoId].votingWeight[member];
    }
    
    /**
     * @dev Get vote delegation
     */
    function getVoteDelegate(uint256 daoId, address member) external view returns (address) {
        return daoGovernance[daoId].delegates[member];
    }
    
    /**
     * @dev Update ProofDAO Core contract address
     */
    function updateProofDAOCore(address _proofDAOCore) external onlyOwner {
        proofDAOCore = _proofDAOCore;
    }
    
    /**
     * @dev Cancel proposal (only proposer or owner)
     */
    function cancelProposal(uint256 proposalId) external validProposal(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        
        proposal.status = ProposalStatus.Cancelled;
        proposal.executionResult = "Cancelled by proposer/admin";
        
        emit ProposalExecuted(proposalId, ProposalStatus.Cancelled, "Cancelled");
    }
    
    /**
     * @dev Update DAO governance settings
     */
    function updateDAOGovernance(
        uint256 daoId,
        uint256 newVotingDuration,
        bool newUseReputationVoting,
        bool newAllowDelegation
    ) external onlyDAOMember(daoId) {
        DAOGovernance storage governance = daoGovernance[daoId];
        governance.votingDuration = newVotingDuration;
        governance.useReputationVoting = newUseReputationVoting;
        governance.allowDelegation = newAllowDelegation;
    }
}