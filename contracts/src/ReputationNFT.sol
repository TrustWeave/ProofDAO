// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title ReputationNFT
 * @dev ERC-721 contract for contributor reputation system
 * @author ProofDAO Team
 */
contract ReputationNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    // Token counter
    uint256 private _tokenIds;
    
    // ProofDAO Core contract address
    address public proofDAOCore;
    
    // Skill types enum
    enum SkillType { Design, Development, Marketing, Translation, Writing, Community, Research, Analysis }
    
    // Reputation levels
    enum ReputationLevel { Newcomer, Contributor, Expert, Master, Legend }
    
    // Reputation data structure
    struct Reputation {
        address contributor;
        SkillType skillType;
        ReputationLevel level;
        uint256 completedTasks;
        uint256 totalEarnings;
        uint256 averageQuality;
        uint256 createdAt;
        uint256 lastUpdated;
        string[] badges;
        bool isActive;
    }
    
    // Social links structure
    struct SocialLinks {
        string github;
        string twitter;
        string discord;
        string linkedin;
        string website;
    }
    
    // Mappings
    mapping(uint256 => Reputation) public reputations;
    mapping(address => uint256[]) public userReputations;
    mapping(address => mapping(SkillType => uint256)) public skillToTokenId;
    mapping(address => SocialLinks) public socialLinks;
    mapping(address => bool) public authorizedUpdaters;
    
    // Reputation thresholds
    mapping(ReputationLevel => uint256) public levelThresholds;
    
    // Events
    event ReputationMinted(uint256 indexed tokenId, address indexed contributor, SkillType skillType);
    event ReputationUpdated(uint256 indexed tokenId, ReputationLevel newLevel, uint256 completedTasks);
    event BadgeAwarded(uint256 indexed tokenId, string badge);
    event SocialLinksUpdated(address indexed contributor);
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);
    
    // Modifiers
    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            msg.sender == proofDAOCore || 
            authorizedUpdaters[msg.sender], 
            "Not authorized"
        );
        _;
    }
    
    modifier validTokenId(uint256 tokenId) {
        require(tokenId > 0 && tokenId <= _tokenIds, "Invalid token ID");
        _;
    }
    
    constructor(address _proofDAOCore) ERC721("ProofDAO Reputation", "PDAOREP") Ownable(msg.sender) {
        proofDAOCore = _proofDAOCore;
        
        // Set level thresholds
        levelThresholds[ReputationLevel.Newcomer] = 0;
        levelThresholds[ReputationLevel.Contributor] = 5;
        levelThresholds[ReputationLevel.Expert] = 20;
        levelThresholds[ReputationLevel.Master] = 50;
        levelThresholds[ReputationLevel.Legend] = 100;
    }
    
    /**
     * @dev Mint reputation NFT for a contributor
     * @param contributor Address of the contributor
     * @param skillType Type of skill
     */
    function mintReputation(
        address contributor,
        SkillType skillType
    ) external onlyAuthorized returns (uint256) {
        require(contributor != address(0), "Invalid contributor address");
        require(skillToTokenId[contributor][skillType] == 0, "Reputation already exists");
        
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        
        // Create reputation data
        reputations[tokenId] = Reputation({
            contributor: contributor,
            skillType: skillType,
            level: ReputationLevel.Newcomer,
            completedTasks: 0,
            totalEarnings: 0,
            averageQuality: 0,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            badges: new string[](0),
            isActive: true
        });
        
        // Update mappings
        userReputations[contributor].push(tokenId);
        skillToTokenId[contributor][skillType] = tokenId;
        
        // Mint NFT
        _safeMint(contributor, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ReputationMinted(tokenId, contributor, skillType);
        return tokenId;
    }
    
    /**
     * @dev Update reputation based on task completion
     * @param contributor Address of the contributor
     * @param skillType Type of skill
     * @param qualityScore Quality score of completed task (0-100)
     * @param earnings Amount earned from the task
     */
    function updateReputation(
        address contributor,
        SkillType skillType,
        uint256 qualityScore,
        uint256 earnings
    ) external onlyAuthorized {
        uint256 tokenId = skillToTokenId[contributor][skillType];
        
        // Mint if doesn't exist
        // if (tokenId == 0) {
        //     tokenId = mintReputation(contributor, skillType);
        // }
        
        Reputation storage rep = reputations[tokenId];
        require(rep.isActive, "Reputation is inactive");
        
        // Update stats
        rep.completedTasks++;
        rep.totalEarnings += earnings;
        
        // Calculate new average quality
        if (rep.completedTasks == 1) {
            rep.averageQuality = qualityScore;
        } else {
            rep.averageQuality = ((rep.averageQuality * (rep.completedTasks - 1)) + qualityScore) / rep.completedTasks;
        }
        
        // Update level based on completed tasks
        ReputationLevel newLevel = _calculateLevel(rep.completedTasks);
        if (newLevel != rep.level) {
            rep.level = newLevel;
            _awardLevelBadge(tokenId, newLevel);
        }
        
        // Award quality badges
        if (qualityScore >= 90 && !_hasBadge(tokenId, "Quality Master")) {
            _awardBadge(tokenId, "Quality Master");
        }
        
        rep.lastUpdated = block.timestamp;
        
        // Update token URI
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit ReputationUpdated(tokenId, newLevel, rep.completedTasks);
    }
    
    /**
     * @dev Award a badge to a reputation NFT
     * @param tokenId Token ID
     * @param badge Badge name
     */
    function awardBadge(uint256 tokenId, string memory badge) external onlyAuthorized validTokenId(tokenId) {
        _awardBadge(tokenId, badge);
    }
    
    /**
     * @dev Internal function to award badge
     */
    function _awardBadge(uint256 tokenId, string memory badge) internal {
        if (!_hasBadge(tokenId, badge)) {
            reputations[tokenId].badges.push(badge);
            _setTokenURI(tokenId, _generateTokenURI(tokenId));
            emit BadgeAwarded(tokenId, badge);
        }
    }
    
    /**
     * @dev Award level-based badge
     */
    function _awardLevelBadge(uint256 tokenId, ReputationLevel level) internal {
        string memory badge;
        
        if (level == ReputationLevel.Contributor) {
            badge = "Rising Star";
        } else if (level == ReputationLevel.Expert) {
            badge = "Skilled Expert";
        } else if (level == ReputationLevel.Master) {
            badge = "Master Craftsman";
        } else if (level == ReputationLevel.Legend) {
            badge = "Legendary Contributor";
        }
        
        if (bytes(badge).length > 0) {
            _awardBadge(tokenId, badge);
        }
    }
    
    /**
     * @dev Check if reputation has a specific badge
     */
    function _hasBadge(uint256 tokenId, string memory badge) internal view returns (bool) {
        string[] memory badges = reputations[tokenId].badges;
        for (uint256 i = 0; i < badges.length; i++) {
            if (keccak256(bytes(badges[i])) == keccak256(bytes(badge))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Calculate reputation level based on completed tasks
     */
    function _calculateLevel(uint256 completedTasks) internal view returns (ReputationLevel) {
        if (completedTasks >= levelThresholds[ReputationLevel.Legend]) {
            return ReputationLevel.Legend;
        } else if (completedTasks >= levelThresholds[ReputationLevel.Master]) {
            return ReputationLevel.Master;
        } else if (completedTasks >= levelThresholds[ReputationLevel.Expert]) {
            return ReputationLevel.Expert;
        } else if (completedTasks >= levelThresholds[ReputationLevel.Contributor]) {
            return ReputationLevel.Contributor;
        } else {
            return ReputationLevel.Newcomer;
        }
    }
    
    /**
     * @dev Update social links for a contributor
     * @param github GitHub username
     * @param twitter Twitter handle
     * @param discord Discord username
     * @param linkedin LinkedIn profile
     * @param website Personal website
     */
    function updateSocialLinks(
        string memory github,
        string memory twitter,
        string memory discord,
        string memory linkedin,
        string memory website
    ) external {
        socialLinks[msg.sender] = SocialLinks({
            github: github,
            twitter: twitter,
            discord: discord,
            linkedin: linkedin,
            website: website
        });
        
        emit SocialLinksUpdated(msg.sender);
    }
    
    /**
     * @dev Generate dynamic token URI with reputation data
     */
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        Reputation memory rep = reputations[tokenId];
        
        string memory skillName = _getSkillName(rep.skillType);
        string memory levelName = _getLevelName(rep.level);
        string memory badgesStr = _getBadgesString(tokenId);
        
        // Create JSON metadata
        string memory json = string(abi.encodePacked(
            '{"name": "ProofDAO Reputation #', tokenId.toString(),
            '", "description": "Reputation NFT for ', skillName, ' skills in ProofDAO",',
            '"attributes": [',
            '{"trait_type": "Skill Type", "value": "', skillName, '"},',
            '{"trait_type": "Level", "value": "', levelName, '"},',
            '{"trait_type": "Completed Tasks", "value": ', rep.completedTasks.toString(), '},',
            '{"trait_type": "Average Quality", "value": ', rep.averageQuality.toString(), '},',
            '{"trait_type": "Total Earnings", "value": "', (rep.totalEarnings / 1e18).toString(), ' ETH"},',
            '{"trait_type": "Badges", "value": "', badgesStr, '"}',
            ']}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }
    
    /**
     * @dev Get skill name from enum
     */
    function _getSkillName(SkillType skillType) internal pure returns (string memory) {
        if (skillType == SkillType.Design) return "Design";
        if (skillType == SkillType.Development) return "Development";
        if (skillType == SkillType.Marketing) return "Marketing";
        if (skillType == SkillType.Translation) return "Translation";
        if (skillType == SkillType.Writing) return "Writing";
        if (skillType == SkillType.Community) return "Community";
        if (skillType == SkillType.Research) return "Research";
        if (skillType == SkillType.Analysis) return "Analysis";
        return "Unknown";
    }
    
    /**
     * @dev Get level name from enum
     */
    function _getLevelName(ReputationLevel level) internal pure returns (string memory) {
        if (level == ReputationLevel.Newcomer) return "Newcomer";
        if (level == ReputationLevel.Contributor) return "Contributor";
        if (level == ReputationLevel.Expert) return "Expert";
        if (level == ReputationLevel.Master) return "Master";
        if (level == ReputationLevel.Legend) return "Legend";
        return "Unknown";
    }
    
    /**
     * @dev Get badges as comma-separated string
     */
    function _getBadgesString(uint256 tokenId) internal view returns (string memory) {
        string[] memory badges = reputations[tokenId].badges;
        if (badges.length == 0) return "None";
        
        string memory result = badges[0];
        for (uint256 i = 1; i < badges.length; i++) {
            result = string(abi.encodePacked(result, ", ", badges[i]));
        }
        return result;
    }
    
    /**
     * @dev Get reputation level for address and skill
     */
    function getReputationLevel(address contributor, SkillType skillType) external view returns (ReputationLevel) {
        uint256 tokenId = skillToTokenId[contributor][skillType];
        if (tokenId == 0) return ReputationLevel.Newcomer;
        return reputations[tokenId].level;
    }
    
    /**
     * @dev Get all reputation tokens for a user
     */
    function getUserReputations(address user) external view returns (uint256[] memory) {
        return userReputations[user];
    }
    
    /**
     * @dev Get reputation badges
     */
    function getReputationBadges(uint256 tokenId) external view validTokenId(tokenId) returns (string[] memory) {
        return reputations[tokenId].badges;
    }
    
    /**
     * @dev Set authorized updater
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit AuthorizedUpdaterSet(updater, authorized);
    }
    
    /**
     * @dev Update ProofDAO Core contract address
     */
    function updateProofDAOCore(address _proofDAOCore) external onlyOwner {
        proofDAOCore = _proofDAOCore;
    }
    
    /**
     * @dev Update level thresholds
     */
    function updateLevelThreshold(ReputationLevel level, uint256 threshold) external onlyOwner {
        levelThresholds[level] = threshold;
    }
    
    /**
     * @dev Disable/enable reputation NFT
     */
    function setReputationStatus(uint256 tokenId, bool isActive) external onlyOwner validTokenId(tokenId) {
        reputations[tokenId].isActive = isActive;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    //     super._burn(tokenId);
    // }
    
    // // Disable transfers (reputation is non-transferable)
    // function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
    //     require(from == address(0) || to == address(0), "Reputation NFTs are non-transferable");
    //     super._beforeTokenTransfer(from, to, tokenId, batchSize);
    // }
}