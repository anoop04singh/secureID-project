"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { getUserIdentity } from "@/lib/contract-interactions"
import { generateQrCode } from "@/lib/qr-generator"
import { Loader2, RefreshCw, Shield, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"

export default function Dashboard() {
  const { toast } = useToast()
  const { isConnected, connect, address, signer } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [identityData, setIdentityData] = useState<any>(null)
  const [identityQr, setIdentityQr] = useState<string | null>(null)
  const [ageQr, setAgeQr] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && signer) {
      loadIdentityData()
    }
  }, [isConnected, signer])

  const loadIdentityData = async () => {
    if (!signer) return

    setIsLoading(true)
    try {
      const identity = await getUserIdentity(signer)
      setIdentityData(identity)

      if (identity) {
        // Generate QR codes
        const identityQrCode = await generateQrCode({
          type: "identity",
          proofId: identity.proofId,
          address: address,
        })

        const ageQrCode = await generateQrCode({
          type: "age",
          proofId: identity.proofId,
          address: address,
        })

        setIdentityQr(identityQrCode)
        setAgeQr(ageQrCode)
      }
    } catch (error) {
      console.error("Error loading identity data:", error)
      toast({
        title: "Error Loading Identity",
        description: "There was an error loading your identity data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>Connect your wallet to access your identity</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>Wallet not connected</AlertTitle>
              <AlertDescription>You need to connect your wallet to access your identity dashboard.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={connect} className="w-full">
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>Loading your identity data...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!identityData) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>User Dashboard</CardTitle>
            <CardDescription>No identity found</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>No Identity Found</AlertTitle>
              <AlertDescription>
                You don't have a decentralized identity yet. Create one to get started.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => (window.location.href = "/create")} className="w-full">
              Create Identity
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Dashboard</CardTitle>
              <CardDescription>Manage your decentralized identity</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={loadIdentityData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Identity verification status */}
          <div className="mb-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center">
              {identityData.livenessVerified ? (
                <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <Shield className="h-5 w-5 text-amber-500 mr-2" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {identityData.livenessVerified ? "Liveness Verified" : "Basic Identity"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {identityData.livenessVerified
                    ? "Your identity has enhanced security with liveness verification"
                    : "Your identity does not include liveness verification"}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="identity">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="identity">Identity QR</TabsTrigger>
              <TabsTrigger value="age">Age Verification</TabsTrigger>
            </TabsList>
            <TabsContent value="identity" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Use this QR code to verify your identity</p>

                  {identityQr ? (
                    <div className="flex justify-center">
                      <div className="border p-4 rounded-lg bg-white">
                        <Image src={identityQr || "/placeholder.svg"} alt="Identity QR Code" width={200} height={200} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    This QR code contains a zero-knowledge proof of your identity. When scanned, it will verify your
                    identity without revealing your personal information.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            <TabsContent value="age" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Use this QR code to verify your age</p>

                  {ageQr ? (
                    <div className="flex justify-center">
                      <div className="border p-4 rounded-lg bg-white">
                        <Image
                          src={ageQr || "/placeholder.svg"}
                          alt="Age Verification QR Code"
                          width={200}
                          height={200}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    This QR code contains a zero-knowledge proof that you are {identityData.isAdult ? "over" : "under"}{" "}
                    18 years old. It does not reveal your actual age or any other personal information.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.navigator.clipboard.writeText(address || "")}
          >
            Copy Wallet Address
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

