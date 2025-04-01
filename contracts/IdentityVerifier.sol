// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract IdentityVerifier {
    struct Identity {
        string proofId;
        string commitment;
        bool isAdult;
        uint256 timestamp;
    }
    
    // Mapping from user address to their identity
    mapping(address => Identity) private userIdentities;
    
    // Mapping from proofId to proof data
    mapping(string => string) private proofData;
    
    // Events
    event ProofStored(string proofId, address indexed user, bool isAdult, uint256 timestamp);
    event ProofVerified(string proofId, address indexed verifier, address indexed user, uint256 timestamp);
    
    /**
     * @dev Store a new identity proof
     * @param proofId Unique identifier for the proof
     * @param commitment Cryptographic commitment to the identity data
     * @param isAdult Boolean indicating if the user is over 18
     * @param proofDataStr Stringified ZK proof data
     */
    function storeProof(
        string calldata proofId,
        string calldata commitment,
        bool isAdult,
        string calldata proofDataStr
    ) external {
        // Ensure the proof ID is not empty
        require(bytes(proofId).length > 0, "Proof ID cannot be empty");
        
        // Store the identity
        userIdentities[msg.sender] = Identity({
            proofId: proofId,
            commitment: commitment,
            isAdult: isAdult,
            timestamp: block.timestamp
        });
        
        // Store the proof data
        proofData[proofId] = proofDataStr;
        
        // Emit event
        emit ProofStored(proofId, msg.sender, isAdult, block.timestamp);
    }
    
    /**
     * @dev Verify an identity proof - READ ONLY function (no gas cost)
     * @param proofId The proof ID to verify
     * @param user The address of the user whose proof is being verified
     * @return bool True if the proof is valid
     */
    function verifyProof(string calldata proofId, address user) external view returns (bool) {
        // Get the user's identity
        Identity memory identity = userIdentities[user];
        
        // Check if the proof exists
        require(bytes(identity.proofId).length > 0, "No identity found for this user");
        
        // Check if the proof IDs match
        bool isValid = keccak256(bytes(identity.proofId)) == keccak256(bytes(proofId));
        
        // In a real implementation, we would verify the ZK proof here
        // For this demo, we just check if the proof IDs match
        
        return isValid;
    }
    
    /**
     * @dev Log verification event (optional, can be called after verification if event logging is needed)
     * @param proofId The proof ID that was verified
     * @param user The address of the user whose proof was verified
     */
    function logVerification(string calldata proofId, address user) external {
        // This function can be called optionally after verifyProof if event logging is needed
        emit ProofVerified(proofId, msg.sender, user, block.timestamp);
    }
    
    /**
     * @dev Get a user's identity
     * @param user The address of the user
     * @return Identity data
     */
    function getUserIdentity(address user) external view returns (
        string memory proofId,
        string memory commitment,
        bool isAdult,
        uint256 timestamp
    ) {
        Identity memory identity = userIdentities[user];
        return (
            identity.proofId,
            identity.commitment,
            identity.isAdult,
            identity.timestamp
        );
    }
    
    /**
     * @dev Get proof data for a specific proof ID
     * @param proofId The proof ID
     * @return string The proof data
     */
    function getProofData(string calldata proofId) external view returns (string memory) {
        return proofData[proofId];
    }
}

