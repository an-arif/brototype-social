import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import Cookies from "js-cookie";

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: "left" | "right" | "top" | "bottom";
}

const tutorialSteps: TutorialStep[] = [
  {
    target: '[href="/"]',
    title: "Home Feed",
    description: "Your main feed where you can see posts from the Brototype community and share your own thoughts.",
    position: "right"
  },
  {
    target: '[href="/notifications"]',
    title: "Notifications",
    description: "Stay updated with all your notifications including likes, comments, and mentions.",
    position: "right"
  },
  {
    target: '[href="/messages"]',
    title: "Direct Messages",
    description: "Send private messages to other members of the community.",
    position: "right"
  },
  {
    target: '[href="/public-chat"]',
    title: "Public Chat",
    description: "Join public channels and chat with the entire community in real-time.",
    position: "right"
  },
  {
    target: '[href="/ai-chat"]',
    title: "AI Assistant",
    description: "Chat with AI assistant and generate images using advanced AI tools.",
    position: "right"
  },
  {
    target: '[href="/complaints"]',
    title: "Complaints",
    description: "Report issues or concerns and track their resolution status.",
    position: "right"
  },
  {
    target: '[href="/events"]',
    title: "Events",
    description: "Discover and RSVP to upcoming community events and activities.",
    position: "right"
  },
  {
    target: '[href="/feedback"]',
    title: "Feedback",
    description: "Share your suggestions and feedback to help improve the platform.",
    position: "right"
  },
  {
    target: '[href="/profile"]',
    title: "Your Profile",
    description: "Manage your profile, view your posts, and customize your account settings.",
    position: "right"
  }
];

export function OnboardingTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenTutorial = Cookies.get("brototype_tutorial_completed");
    console.log("Tutorial cookie check:", hasSeenTutorial);
    if (!hasSeenTutorial) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsVisible(true), 500);
    }
  }, []);

  useEffect(() => {
    if (isVisible && currentStep < tutorialSteps.length) {
      const step = tutorialSteps[currentStep];
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        setSpotlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    Cookies.set("brototype_tutorial_completed", "true", { expires: 365, sameSite: 'strict' });
    console.log("Tutorial completed, cookie set:", Cookies.get("brototype_tutorial_completed"));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const currentStepData = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <>
      {/* Light overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-300"
        onClick={handleSkip}
      />
      
      {/* Spotlight effect */}
      <div
        className="fixed z-[51] pointer-events-none transition-all duration-500 ease-out"
        style={{
          top: `${spotlightPosition.top - 8}px`,
          left: `${spotlightPosition.left - 8}px`,
          width: `${spotlightPosition.width + 16}px`,
          height: `${spotlightPosition.height + 16}px`,
          boxShadow: '0 0 0 4px hsl(var(--primary) / 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: '0.5rem'
        }}
      />

      {/* Tutorial card */}
      <div
        className="fixed z-[52] animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: currentStepData.position === "bottom" 
            ? `${spotlightPosition.top + spotlightPosition.height + 20}px`
            : currentStepData.position === "top"
            ? `${spotlightPosition.top - 200}px`
            : `${spotlightPosition.top}px`,
          left: currentStepData.position === "right"
            ? `${spotlightPosition.left + spotlightPosition.width + 20}px`
            : currentStepData.position === "left"
            ? `${spotlightPosition.left - 420}px`
            : `${spotlightPosition.left}px`,
          maxWidth: '400px'
        }}
      >
        <div className="glass-card border-2 border-primary/50 p-6 rounded-xl shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep 
                        ? 'w-8 bg-primary' 
                        : index < currentStep 
                        ? 'w-1.5 bg-primary/50' 
                        : 'w-1.5 bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {currentStep + 1} of {tutorialSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="text-xl font-semibold mb-2 text-foreground">
            {currentStepData.title}
          </h3>
          <p className="text-muted-foreground mb-6">
            {currentStepData.description}
          </p>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip Tutorial
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {isLastStep ? "Get Started" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
