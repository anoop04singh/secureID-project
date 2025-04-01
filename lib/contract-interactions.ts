import { ethers } from "ethers"
import { IdentityVerifierABI } from "./contract-abi"

// Contract address on Sepolia testnet
const CONTRACT_ADDRESS = "0xD0Dd817CC1638d6b30fAc077cB4028B382650E19" // Replace with actual contract address
// Function to verify identity proof

// Function to store identity proof on the blockchain
export async function storeIdentityProof(
  signer: ethers.JsonRpcSigner,
  proof: any,
): Promise<ethers.TransactionResponse> {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, IdentityVerifierABI, signer)

    // Include liveness verification status in the proof data
    const proofData = {
      ...proof.proof,
      livenessVerified: proof.publicSignals.livenessVerified || false,
    }

    // Store the proof on-chain
    const tx = await contract.storeProof(
      proof.proofId,
      proof.commitment,
      proof.publicSignals.isAdult,
      JSON.stringify(proofData),
    )

    return tx
  } catch (error) {
    console.error("Error storing proof on chain:", error)
    throw new Error("Failed to store proof on blockchain")
  }
}

// Function to get user identity from the blockchain
export async function getUserIdentity(signer: ethers.JsonRpcSigner): Promise<any> {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, IdentityVerifierABI, signer)

    const address = await signer.getAddress()

    // Get the user's identity from the contract
    const identity = await contract.getUserIdentity(address)

    // If the user has no identity, return null
    if (identity.proofId === "") {
      return null
    }

    // Try to parse the proof data to get liveness verification status
    let livenessVerified = false
    try {
      const proofData = await contract.getProofData(identity.proofId)
      const parsedProofData = JSON.parse(proofData)
      livenessVerified = parsedProofData.livenessVerified || false
    } catch (e) {
      console.error("Error parsing proof data:", e)
    }

    return {
      proofId: identity.proofId,
      commitment: identity.commitment,
      isAdult: identity.isAdult,
      livenessVerified: livenessVerified,
      timestamp: new Date(Number(identity.timestamp) * 1000),
    }
  } catch (error) {
    console.error("Error getting user identity:", error)
    throw new Error("Failed to get user identity from blockchain")
  }
}

export async function verifyIdentityProof(
  signer: ethers.JsonRpcSigner,
  proofId: string,
  userAddress: string,
  verificationType: string,
): Promise<{ verified: boolean; type: string; message: string }> {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, IdentityVerifierABI, signer)

    // Verify the proof on-chain (now a read-only function)
    const isValid = await contract.verifyProof(proofId, userAddress)

    if (!isValid) {
      return {
        verified: false,
        type: verificationType,
        message: "The proof could not be verified. It may be invalid or expired.",
      }
    }

    // Get additional information about the identity
    const identity = await contract.getUserIdentity(userAddress)

    // Try to parse the proof data to get liveness verification status
    let livenessVerified = false
    try {
      const proofData = await contract.getProofData(proofId)
      const parsedProofData = JSON.parse(proofData)
      livenessVerified = parsedProofData.livenessVerified || false
    } catch (e) {
      console.error("Error parsing proof data:", e)
    }

    // If verifying age, check the isAdult flag
    if (verificationType === "age") {
      return {
        verified: true,
        type: "age",
        message: `The person is verified to be ${identity.isAdult ? "over" : "under"} 18 years old.${
          livenessVerified ? " (Liveness Verified)" : ""
        }`,
      }
    }

    // For identity verification
    return {
      verified: true,
      type: "identity",
      message: `The identity has been successfully verified.${
        livenessVerified ? " This identity includes liveness verification." : ""
      }`,
    }
  } catch (error) {
    console.error("Error verifying proof:", error)
    throw new Error("Failed to verify proof on blockchain")
  }
}

