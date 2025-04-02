"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { QrScanner } from "@/components/qr-scanner"
import { ClientOnlyLiveness } from "@/components/client-only-liveness"
import { generateZkProof } from "@/lib/zk-proofs"
import { storeIdentityProof } from "@/lib/contract-interactions"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CreateIdentity() {
  // Rest of the component remains the same
  const { toast } = useToast()
  const { isConnected, connect, address, signer } = useWallet()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [lastFourDigits, setLastFourDigits] = useState("")
  const [identityData, setIdentityData] = useState<any>(null)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [zkProof, setZkProof] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [livenessVerified, setLivenessVerified] = useState(false)

  // All the handler functions remain the same
  const handleQrCodeScanned = async (data: any) => {
    // Same implementation
    setIsProcessing(true)
    setError(null)
    try {
      console.log("QR code scanned successfully:", data)
      // The data is already processed by the SecureQRDecoder
      setQrData(data)
      setStep(2)
      toast({
        title: "ID Card Processed Successfully",
        description: "Please enter the last four digits of your ID to continue.",
      })
    } catch (error: any) {
      console.error("Error processing QR code:", error)
      setError(error.message || "The ID card could not be processed. Please try again with a clearer image.")
      toast({
        title: "Error Processing ID Card",
        description: "The ID card could not be processed. Please try again with a clearer image.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const verifyLastFourDigits = () => {
    // Same implementation
    setError(null)
    if (!qrData || !qrData.referenceId) {
      setError("No identity data found. Please scan your ID again.")
      toast({
        title: "Error",
        description: "No identity data found. Please scan your ID again.",
        variant: "destructive",
      })
      return
    }

    // Get the first 4 digits of the reference ID from QR data
    const firstFourDigits = qrData.referenceId.toString().substring(0, 4)
    console.log("Verifying digits:", { entered: lastFourDigits, expected: firstFourDigits })

    if (lastFourDigits === firstFourDigits) {
      // Identity data is already processed by the SecureQRDecoder
      setIdentityData(qrData)
      // Move to liveness detection step
      setStep(2.5)
    } else {
      setError("The digits you entered do not match our records.")
      toast({
        title: "Verification Failed",
        description: "The digits you entered do not match our records.",
        variant: "destructive",
      })
    }
  }

  const handleLivenessComplete = (success: boolean) => {
    // Same implementation
    if (success) {
      setLivenessVerified(true)
      toast({
        title: "Liveness Check Passed",
        description: "Your identity has been verified successfully.",
      })
    } else {
      // Allow proceeding even if liveness check is skipped
      toast({
        title: "Liveness Check Skipped",
        description: "You can still proceed, but your identity will have a lower trust score.",
      })
    }
    // Move to the next step
    setStep(3)
  }

  const generateProof = async () => {
    // Same implementation
    if (!identityData) return

    setIsProcessing(true)
    setError(null)
    try {
      console.log("Generating proof for identity data:", identityData)
      // Generate zero-knowledge proof
      const proof = await generateZkProof(identityData)
      console.log("Proof generated successfully:", proof)

      // Add liveness verification status to the proof
      proof.publicSignals.livenessVerified = livenessVerified

      setZkProof(proof)
      setProofGenerated(true)

      toast({
        title: "Proof Generated",
        description: "Your identity proof has been generated successfully.",
      })

      setStep(4)
    } catch (error: any) {
      console.error("Error generating proof:", error)
      setError(error.message || "There was an error generating your identity proof. Please try again.")
      toast({
        title: "Error Generating Proof",
        description: "There was an error generating your identity proof. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const storeProofOnChain = async () => {
    // Same implementation
    if (!zkProof || !signer) return

    setIsProcessing(true)
    setError(null)
    try {
      console.log("Storing proof on blockchain:", zkProof)
      // Store proof on blockchain
      const tx = await storeIdentityProof(signer, zkProof)
      console.log("Proof stored successfully:", tx)

      toast({
        title: "Proof Stored On-Chain",
        description: "Your identity proof has been stored on the blockchain successfully.",
      })

      setStep(5)
    } catch (error: any) {
      console.error("Error storing proof on chain:", error)
      setError(error.message || "There was an error storing your proof on the blockchain. Please try again.")
      toast({
        title: "Error Storing Proof",
        description: "There was an error storing your proof on the blockchain. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Decentralized Identity</CardTitle>
          <CardDescription>Follow the steps to create your secure decentralized identity</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Step 1: Upload your ID card with QR code</p>
              </div>

              {!isConnected ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertTitle>Connect your wallet</AlertTitle>
                    <AlertDescription>
                      You need to connect your wallet to create a decentralized identity.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={connect} className="w-full">
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <QrScanner onScan={handleQrCodeScanned} isProcessing={isProcessing} />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Step 2: Verify your identity</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-four">Enter the first four digits of your ID</Label>
                <Input
                  id="last-four"
                  value={lastFourDigits}
                  onChange={(e) => setLastFourDigits(e.target.value)}
                  maxLength={4}
                  placeholder="First 4 digits"
                />
                <p className="text-xs text-muted-foreground">
                  This helps verify that you are the owner of this ID card.
                </p>
              </div>

              <Button onClick={verifyLastFourDigits} className="w-full" disabled={lastFourDigits.length !== 4}>
                Verify
              </Button>
            </div>
          )}

          {step === 2.5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Step 3: Liveness Detection</p>
              </div>

              <ClientOnlyLiveness onComplete={handleLivenessComplete} isProcessing={isProcessing} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Step 4: Generate zero-knowledge proof</p>
              </div>

              <div className="space-y-2 border rounded-lg p-4">
                <p className="text-sm font-medium">Identity Information</p>
                <p className="text-sm">Name: {identityData?.name}</p>
                <p className="text-sm">Age: {identityData?.age}</p>
                <p className="text-sm">Adult Status: {identityData?.isAdult ? "Yes" : "No"}</p>
                {livenessVerified && <p className="text-sm text-green-600">✓ Liveness Verified</p>}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>A zero-knowledge proof will be generated to verify:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Your identity is valid</li>
                  <li>Your age status (over/under 18) without revealing your actual age</li>
                  {livenessVerified && <li>You have passed a liveness check</li>}
                </ul>
              </div>

              <Button onClick={generateProof} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  "Generate Proof"
                )}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Step 5: Store proof on blockchain</p>
              </div>

              <Alert>
                <AlertTitle>Proof Generated Successfully</AlertTitle>
                <AlertDescription>
                  Your zero-knowledge proof has been generated. Now you need to store it on the blockchain.
                </AlertDescription>
              </Alert>

              <Button onClick={storeProofOnChain} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Storing Proof...
                  </>
                ) : (
                  "Store Proof On-Chain"
                )}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Identity Created Successfully</p>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your decentralized identity has been created and stored on the blockchain. You can now use it for
                  verification.
                  {livenessVerified && (
                    <p className="mt-2 font-medium text-green-600">
                      Your identity includes liveness verification for enhanced security.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 && step < 5 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isProcessing}>
              Back
            </Button>
          )}
          {step === 5 && (
            <Button className="w-full" onClick={() => (window.location.href = "/dashboard")}>
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

