import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, MapPin, Check, ArrowLeft, Activity, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertAlert } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MEDICAL_QUESTIONS = [
  { id: "conscious", question: "Is the person conscious?", options: ["Yes", "No", "Unsure"] },
  { id: "breathing", question: "Is the person breathing normally?", options: ["Yes", "No", "Unsure"] },
  { id: "bleeding", question: "Is there severe bleeding?", options: ["Yes", "No", "Unsure"] },
];

const SECURITY_QUESTIONS = [
  { id: "threat", question: "Is there an immediate violence threat?", options: ["Yes", "No"] },
  { id: "safe", question: "Are you in a safe location?", options: ["Yes", "No"] },
  { id: "others", question: "Are others in danger?", options: ["Yes", "No", "Unsure"] },
];

export default function EmergencyAlert() {
  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState<"medical" | "security" | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ latitude: string; longitude: string; accuracy: string } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (step === 3 && !location) {
      captureLocation();
    }
  }, [step]);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            accuracy: position.coords.accuracy.toString(),
          });
          setLocationError("");
        },
        (error) => {
          setLocationError("Unable to capture location. Please ensure location services are enabled.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  };

  const createAlertMutation = useMutation({
    mutationFn: async (data: InsertAlert) => {
      return await apiRequest("POST", "/api/alerts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/my-alerts"] });
      toast({
        title: "Emergency Alert Sent",
        description: "Response team has been notified and will arrive shortly.",
      });
      navigate("/student");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Alert",
        description: error.message || "Please try again or call emergency services directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!department) return;

    const alertData: InsertAlert = {
      userId: "",
      department,
      status: "pending",
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationAccuracy: location?.accuracy,
      situationData: answers,
      responseNotes: null,
    };

    createAlertMutation.mutate(alertData);
  };

  const questions = department === "medical" ? MEDICAL_QUESTIONS : SECURITY_QUESTIONS;
  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : navigate("/student")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emergency rounded-md flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-emergency-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Emergency Alert</h1>
              <p className="text-muted-foreground">Step {step} of 4</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Department</CardTitle>
              <CardDescription>Which emergency service do you need?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover-elevate ${department === "medical" ? "border-emergency bg-emergency/5" : "border-border"}`}
                onClick={() => setDepartment("medical")}
                data-testid="option-medical"
              >
                <div className="flex items-start gap-4">
                  <Activity className="w-8 h-8 text-emergency flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold">Medical Emergency</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      For injuries, health emergencies, or medical assistance needed
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover-elevate ${department === "security" ? "border-emergency bg-emergency/5" : "border-border"}`}
                onClick={() => setDepartment("security")}
                data-testid="option-security"
              >
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-emergency flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold">Security Emergency</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      For security threats, suspicious activity, or immediate danger
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!department}
                onClick={() => setStep(2)}
                data-testid="button-next-step"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && department && (
          <Card>
            <CardHeader>
              <CardTitle>Situation Assessment</CardTitle>
              <CardDescription>Answer these quick questions to help responders prepare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <Label className="text-base font-medium">{q.question}</Label>
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                  >
                    {q.options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} data-testid={`radio-${q.id}-${option.toLowerCase()}`} />
                        <Label htmlFor={`${q.id}-${option}`} className="cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-previous">
                  Previous
                </Button>
                <Button
                  className="flex-1"
                  disabled={Object.keys(answers).length < questions.length}
                  onClick={() => setStep(3)}
                  data-testid="button-next-location"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Location Capture</CardTitle>
              <CardDescription>We need your location to dispatch help quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              ) : location ? (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Location captured successfully (Accuracy: ±{Math.round(parseFloat(location.accuracy))}m)
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3 animate-pulse" />
                  <p className="text-muted-foreground">Capturing your location...</p>
                </div>
              )}

              {locationError && (
                <Button onClick={captureLocation} variant="outline" className="w-full" data-testid="button-retry-location">
                  Retry Location Capture
                </Button>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-back-questions">
                  Previous
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(4)}
                  data-testid="button-review"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && department && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Emergency Alert</CardTitle>
              <CardDescription>Review your alert before sending to {department} department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Department</Label>
                  <p className="font-medium capitalize">{department}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Situation</Label>
                  <div className="space-y-1 mt-1">
                    {questions.map((q) => (
                      <p key={q.id} className="text-sm">
                        <strong>{q.question}</strong> {answers[q.id]}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p className="text-sm">
                    {location ? `Latitude: ${parseFloat(location.latitude).toFixed(6)}, Longitude: ${parseFloat(location.longitude).toFixed(6)}` : "Location not available"}
                  </p>
                </div>
              </div>

              <Alert className="bg-emergency/10 border-emergency">
                <AlertTriangle className="h-4 w-4 text-emergency" />
                <AlertDescription className="text-sm">
                  By confirming, you are sending an emergency alert. Response teams will be dispatched immediately.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1" data-testid="button-back-location">
                  Previous
                </Button>
                <Button
                  className="flex-1 bg-emergency hover:bg-emergency/90 text-emergency-foreground"
                  onClick={handleSubmit}
                  disabled={createAlertMutation.isPending}
                  data-testid="button-send-alert"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {createAlertMutation.isPending ? "Sending..." : "Send Emergency Alert"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
