// ABI for the IdentityVerifier smart contract
export const IdentityVerifierABI = [
  // Events
  "event ProofStored(string proofId, address indexed user, bool isAdult, uint256 timestamp)",
  "event ProofVerified(string proofId, address indexed verifier, address indexed user, uint256 timestamp)",

  // Functions
  "function storeProof(string calldata proofId, string calldata commitment, bool isAdult, string calldata proofData) external",
  "function verifyProof(string calldata proofId, address user) external view returns (bool)",
  "function logVerification(string calldata proofId, address user) external",
  "function getUserIdentity(address user) external view returns (string memory proofId, string memory commitment, bool isAdult, uint256 timestamp)",
  "function getProofData(string calldata proofId) external view returns (string memory)",
]

