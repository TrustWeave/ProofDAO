// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProofDAOCore
 * @dev Main contract for ProofDAO - handles DAO creation, task management, and payments
 * @author ProofDAO Team
 */
contract ProofDAOCore is ReentrancyGuard, Ownable {
    // ID Counters
    uint256 private _daoIdCounter;
    uint256 private _taskIdCounter;
    uint256 private _submissionIdCounter;

    // Contract constants
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
    uint256 public constant PERCENTAGE_BASE = 10000;
    uint256 public constant MIN_TASK_REWARD = 0.001 ether;
    uint256 public constant MAX_TASK_DURATION = 30 days;

    // Structs
    struct DAO {
        uint256 id;
        string name;
        string description;
        address creator;
        string metadataURI;
        uint256 createdAt;
        bool isActive;
        uint256 totalTasks;
        uint256 totalRewards;
    }

    struct Task {
        uint256 id;
        uint256 daoId;
        string title;
        string description;
        string requirements;
        string metadataURI;
        uint256 reward;
        address creator;
        uint256 deadline;
        uint256 createdAt;
        TaskStatus status;
        uint256 maxSubmissions;
        uint256 currentSubmissions;
        string[] skillTags;
    }

    struct Submission {
        uint256 id;
        uint256 taskId;
        address contributor;
        string workURI;
        string proofData;
        uint256 submittedAt;
        SubmissionStatus status;
        string feedback;
        uint256 qualityScore;
    }

    // Enums
    enum TaskStatus { Open, InReview, Completed, Cancelled }
    enum SubmissionStatus { Pending, Approved, Rejected }

    // Mappings
    mapping(uint256 => DAO) public daos;
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Submission) public submissions;
    mapping(address => uint256[]) public userDAOs;
    mapping(address => uint256[]) public userTasks;
    mapping(address => uint256[]) public userSubmissions;
    mapping(uint256 => uint256[]) public daoTasks;
    mapping(uint256 => uint256[]) public taskSubmissions;

    // Platform statistics
    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public userCompletedTasks;
    mapping(address => uint256) public userEarnings;

    // Events
    event DAOCreated(uint256 indexed daoId, address indexed creator, string name);
    event TaskPosted(uint256 indexed taskId, uint256 indexed daoId, address indexed creator, uint256 reward);
    event WorkSubmitted(uint256 indexed submissionId, uint256 indexed taskId, address indexed contributor);
    event SubmissionApproved(uint256 indexed submissionId, uint256 indexed taskId, address indexed contributor, uint256 reward);
    event SubmissionRejected(uint256 indexed submissionId, uint256 indexed taskId, address indexed contributor);
    event RewardClaimed(uint256 indexed submissionId, address indexed contributor, uint256 amount);
    event TaskCancelled(uint256 indexed taskId, address indexed creator);
    event PointsAwarded(address indexed user, uint256 points, string reason);

    // Modifiers
    modifier onlyDAOCreator(uint256 daoId) {
        require(daos[daoId].creator == msg.sender, "Not DAO creator");
        _;
    }

    modifier onlyTaskCreator(uint256 taskId) {
        require(tasks[taskId].creator == msg.sender, "Not task creator");
        _;
    }

    modifier validDAO(uint256 daoId) {
        require(daoId > 0 && daoId <= _daoIdCounter, "Invalid DAO ID");
        require(daos[daoId].isActive, "DAO is not active");
        _;
    }

    modifier validTask(uint256 taskId) {
        require(taskId > 0 && taskId <= _taskIdCounter, "Invalid task ID");
        require(tasks[taskId].status == TaskStatus.Open, "Task is not open");
        require(block.timestamp <= tasks[taskId].deadline, "Task deadline passed");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function createDAO(string memory name, string memory description, string memory metadataURI) external returns (uint256) {
        require(bytes(name).length > 0, "DAO name required");
        require(bytes(description).length > 0, "DAO description required");

        _daoIdCounter++;
        uint256 daoId = _daoIdCounter;

        daos[daoId] = DAO({
            id: daoId,
            name: name,
            description: description,
            creator: msg.sender,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            isActive: true,
            totalTasks: 0,
            totalRewards: 0
        });

        userDAOs[msg.sender].push(daoId);
        _awardPoints(msg.sender, 100, "DAO Creation");

        emit DAOCreated(daoId, msg.sender, name);
        return daoId;
    }

    function postTask(
        uint256 daoId,
        string memory title,
        string memory description,
        string memory requirements,
        string memory metadataURI,
        uint256 deadline,
        uint256 maxSubmissions,
        string[] memory skillTags
    ) external payable validDAO(daoId) returns (uint256) {
        require(msg.value >= MIN_TASK_REWARD, "Reward too low");
        require(deadline > block.timestamp, "Deadline must be in future");
        require(deadline <= block.timestamp + MAX_TASK_DURATION, "Deadline too far");
        require(bytes(title).length > 0, "Title required");
        require(bytes(requirements).length > 0, "Requirements required");
        require(maxSubmissions > 0, "Max submissions must be > 0");

        _taskIdCounter++;
        uint256 taskId = _taskIdCounter;

        tasks[taskId] = Task({
            id: taskId,
            daoId: daoId,
            title: title,
            description: description,
            requirements: requirements,
            metadataURI: metadataURI,
            reward: msg.value,
            creator: msg.sender,
            deadline: deadline,
            createdAt: block.timestamp,
            status: TaskStatus.Open,
            maxSubmissions: maxSubmissions,
            currentSubmissions: 0,
            skillTags: skillTags
        });

        daos[daoId].totalTasks++;
        daos[daoId].totalRewards += msg.value;
        userTasks[msg.sender].push(taskId);
        daoTasks[daoId].push(taskId);

        _awardPoints(msg.sender, 50, "Task Creation");

        emit TaskPosted(taskId, daoId, msg.sender, msg.value);
        return taskId;
    }

    function submitWork(
        uint256 taskId,
        string memory workURI,
        string memory proofData
    ) external validTask(taskId) returns (uint256) {
        Task storage task = tasks[taskId];
        require(task.currentSubmissions < task.maxSubmissions, "Max submissions reached");
        require(bytes(workURI).length > 0, "Work URI required");
        require(msg.sender != task.creator, "Task creator cannot submit");

        uint256[] memory userSubs = userSubmissions[msg.sender];
        for (uint256 i = 0; i < userSubs.length; i++) {
            require(submissions[userSubs[i]].taskId != taskId, "Already submitted to this task");
        }

        _submissionIdCounter++;
        uint256 submissionId = _submissionIdCounter;

        submissions[submissionId] = Submission({
            id: submissionId,
            taskId: taskId,
            contributor: msg.sender,
            workURI: workURI,
            proofData: proofData,
            submittedAt: block.timestamp,
            status: SubmissionStatus.Pending,
            feedback: "",
            qualityScore: 0
        });

        task.currentSubmissions++;
        userSubmissions[msg.sender].push(submissionId);
        taskSubmissions[taskId].push(submissionId);

        _awardPoints(msg.sender, 25, "Work Submission");

        emit WorkSubmitted(submissionId, taskId, msg.sender);
        return submissionId;
    }

    function approveSubmission(
        uint256 submissionId,
        string memory feedback,
        uint256 qualityScore
    ) external nonReentrant {
        require(submissionId > 0 && submissionId <= _submissionIdCounter, "Invalid submission ID");
        require(qualityScore <= 100, "Quality score must be <= 100");

        Submission storage submission = submissions[submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        Task storage task = tasks[submission.taskId];
        DAO storage dao = daos[task.daoId];

        require(msg.sender == task.creator || msg.sender == dao.creator, "Not authorized to approve");

        submission.status = SubmissionStatus.Approved;
        submission.feedback = feedback;
        submission.qualityScore = qualityScore;

        task.status = TaskStatus.Completed;
        userCompletedTasks[submission.contributor]++;
        userEarnings[submission.contributor] += task.reward;

        _awardPoints(msg.sender, 30, "Submission Review");
        uint256 contributorBonus = (qualityScore * 50) / 100;
        _awardPoints(submission.contributor, 50 + contributorBonus, "Task Completion");

        emit SubmissionApproved(submissionId, submission.taskId, submission.contributor, task.reward);
    }

    function rejectSubmission(uint256 submissionId, string memory feedback) external {
        require(submissionId > 0 && submissionId <= _submissionIdCounter, "Invalid submission ID");

        Submission storage submission = submissions[submissionId];
        require(submission.status == SubmissionStatus.Pending, "Submission not pending");

        Task storage task = tasks[submission.taskId];
        DAO storage dao = daos[task.daoId];

        require(msg.sender == task.creator || msg.sender == dao.creator, "Not authorized to reject");

        submission.status = SubmissionStatus.Rejected;
        submission.feedback = feedback;
        task.currentSubmissions--;

        emit SubmissionRejected(submissionId, submission.taskId, submission.contributor);
    }

    function claimReward(uint256 submissionId) external nonReentrant {
        require(submissionId > 0 && submissionId <= _submissionIdCounter, "Invalid submission ID");

        Submission storage submission = submissions[submissionId];
        require(submission.contributor == msg.sender, "Not your submission");
        require(submission.status == SubmissionStatus.Approved, "Submission not approved");

        Task storage task = tasks[submission.taskId];
        uint256 reward = task.reward;

        uint256 platformFee = (reward * PLATFORM_FEE_PERCENTAGE) / PERCENTAGE_BASE;
        uint256 contributorReward = reward - platformFee;

        task.reward = 0;

        (bool success, ) = payable(msg.sender).call{value: contributorReward}("");
        require(success, "Reward transfer failed");

        emit RewardClaimed(submissionId, msg.sender, contributorReward);
    }

    function cancelTask(uint256 taskId) external nonReentrant {
        require(taskId > 0 && taskId <= _taskIdCounter, "Invalid task ID");

        Task storage task = tasks[taskId];
        require(msg.sender == task.creator, "Not task creator");
        require(task.status == TaskStatus.Open, "Task not open");

        uint256[] memory subs = taskSubmissions[taskId];
        for (uint256 i = 0; i < subs.length; i++) {
            require(submissions[subs[i]].status != SubmissionStatus.Approved, "Cannot cancel with approved submissions");
        }

        task.status = TaskStatus.Cancelled;
        uint256 refund = task.reward;
        task.reward = 0;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        require(success, "Refund failed");

        emit TaskCancelled(taskId, msg.sender);
    }

    function _awardPoints(address user, uint256 points, string memory reason) internal {
        userPoints[user] += points;
        emit PointsAwarded(user, points, reason);
    }

    function getDAOTasks(uint256 daoId) external view returns (uint256[] memory) {
        return daoTasks[daoId];
    }

    function getTaskSubmissions(uint256 taskId) external view returns (uint256[] memory) {
        return taskSubmissions[taskId];
    }

    function getUserDAOs(address user) external view returns (uint256[] memory) {
        return userDAOs[user];
    }

    function getUserTasks(address user) external view returns (uint256[] memory) {
        return userTasks[user];
    }

    function getUserSubmissions(address user) external view returns (uint256[] memory) {
        return userSubmissions[user];
    }

    function getCurrentCounters() external view returns (uint256 daos, uint256 tasks, uint256 submissions) {
        return (_daoIdCounter, _taskIdCounter, _submissionIdCounter);
    }

    function getTaskSkillTags(uint256 taskId) external view returns (string[] memory) {
        return tasks[taskId].skillTags;
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function pauseDAO(uint256 daoId) external onlyOwner {
        daos[daoId].isActive = false;
    }

    function unpauseDAO(uint256 daoId) external onlyOwner {
        daos[daoId].isActive = true;
    }
}
