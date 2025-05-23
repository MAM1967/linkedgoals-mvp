import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./SocialSharePage.css"; // We'll create this CSS file later

// Interface for SMART Goals (same as in Dashboard and GoalInputPage)
interface SmartGoal {
  id: string;
  description: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  dueDate: string;
  createdAt: Timestamp;
  status: string;
  completed: boolean;
}

// Type for the data part of the goal, excluding the ID (which comes from doc.id)
type SmartGoalData = Omit<SmartGoal, "id">;

const SocialSharePage: React.FC = () => {
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [errorGoals, setErrorGoals] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SmartGoal | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [isMilestoneShare, setIsMilestoneShare] = useState(false);
  const [pageTitle, setPageTitle] = useState("Share Your Goals on LinkedIn");
  const [shareType, setShareType] = useState<"progress" | "coachInvitation">(
    "progress"
  );

  // State to hold the full URL for sharing if needed, e.g. for a direct link to the app/goal
  // For now, we primarily share text, but this could be useful for 'Copy Link' functionality
  const [shareUrl, setShareUrl] = useState<string>("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Set the share URL once, e.g., to the current page or a specific goal page if applicable
    setShareUrl(window.location.href); // Example: current page URL

    const milestoneType = searchParams.get("milestone");
    const textParam = searchParams.get("text");

    if (milestoneType === "goalComplete" && textParam) {
      setShareMessage(textParam);
      setIsMilestoneShare(true);
      setShareType("progress");
      setPageTitle("Share Your Achievement!");
      setLoadingGoals(false);
    } else {
      setIsMilestoneShare(false);
      setPageTitle("Share Your Goals on LinkedIn");
      const user = auth.currentUser;
      if (!user) {
        setLoadingGoals(false);
        setErrorGoals("You need to be logged in to see your goals.");
        return;
      }
      setLoadingGoals(true);
      setErrorGoals(null);
      const goalsCollectionRef = collection(db, `users/${user.uid}/goals`);
      const goalsQuery = query(
        goalsCollectionRef,
        orderBy("createdAt", "desc")
      );
      const unsubscribeGoals: Unsubscribe = onSnapshot(
        goalsQuery,
        (querySnapshot) => {
          const fetchedGoals: SmartGoal[] = [];
          querySnapshot.forEach((doc) => {
            const goalData = doc.data() as SmartGoalData;
            if (goalData.status === "active" && !goalData.completed) {
              fetchedGoals.push({ ...goalData, id: doc.id });
            }
          });
          setSmartGoals(fetchedGoals);
          setLoadingGoals(false);
        },
        (error) => {
          console.error("Error fetching SMART goals for sharing:", error);
          setErrorGoals("Failed to load goals. Please try again later.");
          setLoadingGoals(false);
        }
      );
      return () => {
        unsubscribeGoals();
      };
    }
  }, [searchParams]);

  const generateShareMessage = (
    goal: SmartGoal,
    type: "progress" | "coachInvitation"
  ) => {
    const appBaseUrl = window.location.origin; // Gets https://linkedgoals-d7053.web.app
    const inviterName = auth.currentUser?.displayName || "Someone";
    const inviterId = auth.currentUser?.uid;

    if (type === "coachInvitation") {
      if (!inviterId) {
        // Fallback if user somehow isn't available, though UI should prevent this path
        return "I'm looking for an accountability coach for my goal. #GoalPulse";
      }
      const coachOnboardingLink = `${appBaseUrl}/coach-onboarding?inviterId=${inviterId}&goalId=${
        goal.id
      }&inviterName=${encodeURIComponent(inviterName)}`;
      return (
        `Hi! I'm working on my goal: "${goal.description}" using the LinkedGoals app and looking for an accountability coach ` +
        `to help me stay on track. Would you be interested in coaching me? \n\n` +
        `Accept the invitation here: ${coachOnboardingLink} \n\n` +
        `#GoalPulse #AccountabilityCoach #Mentorship`
      );
    } else {
      if (isMilestoneShare) return shareMessage; // Use the pre-formatted milestone message
      return (
        `Working on my goal: "${goal.description}"! ` +
        `Aiming to complete it by ${new Date(
          goal.dueDate
        ).toLocaleDateString()}. ` +
        `Cheer me on! #GoalPulse #LinkedGoals #Productivity`
      );
    }
  };

  const handleSelectGoal = (goal: SmartGoal) => {
    setSelectedGoal(goal);
    setIsMilestoneShare(false);
    setShareType("progress");
    setPageTitle(`Share: ${goal.description}`);
    setShareMessage(generateShareMessage(goal, "progress"));
  };

  const handleSetShareType = (type: "progress" | "coachInvitation") => {
    if (selectedGoal) {
      setShareType(type);
      setShareMessage(generateShareMessage(selectedGoal, type));
    }
  };

  const handleShare = (
    platform: "linkedin" | "twitter" | "facebook" | "copy"
  ) => {
    if (!shareMessage.trim()) return;

    let url = "";
    const encodedMessage = encodeURIComponent(shareMessage.trim());
    // The shareUrl state currently holds the page's own URL. For some platforms,
    // you might want to share a link TO the content, not just the text.
    // For this iteration, we focus on text sharing where supported, or a general link.
    const encodedPageUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedMessage}`;
        break;
      case "twitter":
        // Twitter (X) uses 'text' or 'url' and 'via' (your app's twitter handle)
        url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        // If you want to share a URL with the tweet: url = `https://twitter.com/intent/tweet?url=${encodedPageUrl}&text=${encodedMessage}`;
        break;
      case "facebook":
        // Facebook requires a URL to share. We use the current page URL as an example.
        // For best results, ensure the shared URL has appropriate Open Graph meta tags.
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedPageUrl}&quote=${encodedMessage}`;
        break;
      case "copy":
        navigator.clipboard
          .writeText(shareMessage.trim())
          .then(() => {
            alert("Message copied to clipboard!");
          })
          .catch((err) => {
            console.error("Failed to copy message: ", err);
            alert("Failed to copy message.");
          });
        return; // No need to open a window for copy
      default:
        console.warn("Unsupported share platform:", platform);
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");

    if (isMilestoneShare) {
      navigate("/"); // Navigate to dashboard after sharing a milestone
    } else {
      // Reset selection for non-milestone shares to allow sharing another goal
      // This block is reached if platform was LinkedIn, Twitter, or Facebook.
      setSelectedGoal(null);
      setShareMessage("");
      setShareType("progress");
      setPageTitle("Share Your Goals on LinkedIn"); // Reset title or make it more generic
    }
  };

  return (
    <div className="social-share-page">
      <h2>{pageTitle}</h2>

      {loadingGoals && <p>Loading...</p>}
      {errorGoals && <p className="error-message">{errorGoals}</p>}

      {!isMilestoneShare &&
        !selectedGoal &&
        !loadingGoals &&
        smartGoals.length > 0 && (
          <div className="goal-selection-list">
            <h3>Select an Active Goal:</h3>
            <ul>
              {smartGoals.map((goal) => (
                <li key={goal.id}>
                  <span>
                    {goal.description} (Due:{" "}
                    {new Date(goal.dueDate).toLocaleDateString()})
                  </span>
                  <button
                    onClick={() => handleSelectGoal(goal)}
                    className="btn btn-secondary btn-small"
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

      {!isMilestoneShare &&
        !selectedGoal &&
        !loadingGoals &&
        smartGoals.length === 0 &&
        !errorGoals && (
          <p>
            You have no active SMART goals to share. Go to "Add Goal" to create
            one or complete an existing one to share an achievement.
          </p>
        )}

      {(selectedGoal || isMilestoneShare) && (
        <div className="share-preview-area">
          <h4>Share this message:</h4>
          <textarea readOnly value={shareMessage} rows={6}></textarea>
          {selectedGoal && !isMilestoneShare && (
            <div className="share-type-selector">
              <button
                onClick={() => handleSetShareType("progress")}
                className={shareType === "progress" ? "active" : ""}
              >
                Share Progress
              </button>
              <button
                onClick={() => handleSetShareType("coachInvitation")}
                className={shareType === "coachInvitation" ? "active" : ""}
              >
                Invite Coach
              </button>
            </div>
          )}
          <div className="share-buttons">
            <button
              onClick={() => handleShare("linkedin")}
              className="btn-linkedin"
            >
              <i className="fab fa-linkedin"></i> Share on LinkedIn
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="btn-twitter"
            >
              <i className="fab fa-twitter"></i> Share on X (Twitter)
            </button>
            <button
              onClick={() => handleShare("facebook")}
              className="btn-facebook"
            >
              <i className="fab fa-facebook"></i> Share on Facebook
            </button>
            <button onClick={() => handleShare("copy")} className="btn-copy">
              <i className="fas fa-copy"></i> Copy Message
            </button>
          </div>
          {isMilestoneShare && (
            <button
              onClick={() => navigate("/")}
              className="btn btn-secondary mt-3"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialSharePage;
