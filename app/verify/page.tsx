"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { VerificationQrScanner } from "@/components/verification-qr-scanner"
import { verifyIdentityProof } from "@/lib/contract-interactions"
import { CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function VerifyIdentity() {
  const { toast } = useToast()
  const { isConnected, connect, signer } = useWallet()
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    type: string
    message: string
  } | null>(null)

  const handleQrCodeScanned = async (data: string) => {
    if (!signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to verify identities.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      console.log("Processing verification QR data:", data)

      // Parse QR data - this should be JSON data from our generated QR codes
      let qrData
      try {
        qrData = JSON.parse(data)
      } catch (error) {
        console.error("Error parsing QR data:", error)
        throw new Error("Invalid QR code format. Please scan a valid identity verification QR code.")
      }

      // Validate the QR data structure
      if (!qrData.proofId || !qrData.address || !qrData.type) {
        throw new Error("Invalid QR code data. Missing required verification information.")
      }

      console.log("Verifying proof on-chain:", qrData)

      // Verify the proof on-chain
      const result = await verifyIdentityProof(signer, qrData.proofId, qrData.address, qrData.type)

      if (result.verified) {
        toast({
          title: "Verification Successful",
          description: `The ${qrData.type} has been verified successfully.`,
        })
      } else {
        toast({
          title: "Verification Failed",
          description: "The proof could not be verified.",
          variant: "destructive",
        })
      }

      setVerificationResult(result)
    } catch (error: any) {
      console.error("Error verifying proof:", error)
      toast({
        title: "Error Verifying Proof",
        description: error.message || "There was an error verifying the proof. Please try again.",
        variant: "destructive",
      })

      setVerificationResult({
        verified: false,
        type: "unknown",
        message: error.message || "Invalid QR code or proof data.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetVerification = () => {
    setVerificationResult(null)
  }

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Verify Identity</CardTitle>
          <CardDescription>Scan a QR code to verify someone's identity</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Connect your wallet</AlertTitle>
                <AlertDescription>You need to connect your wallet to verify identities.</AlertDescription>
              </Alert>
              <Button onClick={connect} className="w-full">
                Connect Wallet
              </Button>
            </div>
          ) : verificationResult ? (
            <div className="space-y-4">
              <div className="flex justify-center py-4">
                {verificationResult.verified ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>

              <Alert
                className={verificationResult.verified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}
              >
                <AlertTitle>
                  {verificationResult.verified ? "Verification Successful" : "Verification Failed"}
                </AlertTitle>
                <AlertDescription>{verificationResult.message}</AlertDescription>
              </Alert>

              {verificationResult.verified && verificationResult.type === "identity" && (
                <div className="text-sm text-center text-muted-foreground">
                  The identity has been verified without revealing any personal information.
                </div>
              )}

              {verificationResult.verified && verificationResult.type === "age" && (
                <div className="text-sm text-center text-muted-foreground">
                  The person is verified to be over 18 years old without revealing their actual age.
                </div>
              )}
            </div>
          ) : (
            <VerificationQrScanner onScan={handleQrCodeScanned} isProcessing={isProcessing} />
          )}
        </CardContent>
        <CardFooter>
          {verificationResult && (
            <Button onClick={resetVerification} className="w-full">
              Verify Another
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

