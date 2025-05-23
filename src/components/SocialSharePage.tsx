import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./SocialSharePage.css"; // We'll create this CSS file later
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTwitter,
  faFacebook,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

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
  const [shareText, setShareText] = useState<string>("");
  const [isMilestoneShare, setIsMilestoneShare] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>("Share Your Progress");
  const [shareType, setShareType] = useState<"progress" | "coachInvitation">(
    "progress"
  );

  // State to hold the full URL for sharing if needed, e.g. for a direct link to the app/goal
  // For now, we primarily share text, but this could be useful for 'Copy Link' functionality
  const [shareUrl, setShareUrl] = useState<string>(window.location.origin);
  const [goalDescription, setGoalDescription] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const incomingText = searchParams.get("text");
    const goalId = searchParams.get("goalId");
    const milestone = searchParams.get("milestone");
    let constructedShareUrl = window.location.origin;

    if (goalId) {
      constructedShareUrl = `${window.location.origin}/shared-goal/${goalId}`; // Link to a potential shared goal view page
      setShareUrl(constructedShareUrl);
      // Fetch goal description for context, if not already in incomingText
      if (
        auth.currentUser &&
        (!incomingText || !incomingText.includes("goal:"))
      ) {
        const fetchGoal = async () => {
          try {
            const goalRef = doc(
              db,
              `users/${auth.currentUser!.uid}/goals`,
              goalId
            );
            const goalSnap = await getDoc(goalRef);
            if (goalSnap.exists()) {
              const goalData = goalSnap.data();
              setGoalDescription(goalData.description);
              if (!incomingText) {
                // Only set if no specific text was passed
                setShareText(
                  `Check out my progress on my goal: "${goalData.description}"! See it here: ${constructedShareUrl}`
                );
              }
            } else {
              console.log("No such goal to share details for!");
              if (!incomingText)
                setShareText(
                  "I'm making great progress on my goals! #GoalMomentum"
                );
            }
          } catch (error) {
            console.error("Error fetching goal for sharing: ", error);
            if (!incomingText)
              setShareText(
                "I'm making great progress on my goals! #GoalMomentum"
              );
          }
        };
        fetchGoal();
      }
    } else {
      setShareUrl(window.location.origin); // Default site URL if no specific goal
    }

    if (incomingText) {
      setShareText(incomingText);
      setPageTitle("Share Your Milestone!");
    } else if (milestone === "goalComplete") {
      // This case is largely superseded if 'text' is provided by Dashboard, but kept as fallback
      setPageTitle("Share Your Achievement!");
      // A generic message if goalDescription isn't fetched/available yet, or no goalId was passed
      setShareText(
        "🏆 I just achieved one of my SMART goals! Feeling accomplished! #GoalAchieved #Productivity"
      );
    } else if (!goalId && !incomingText) {
      // Default if no params
      setShareText(
        "I'm working on my goals with GoalMomentum! Join me! #GoalSetting #Motivation"
      );
    }
    // If only goalId is present and incomingText is not, the useEffect for fetchGoal will set the text.
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
      if (isMilestoneShare) return shareText; // Use the pre-formatted milestone message
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
    setShareText(generateShareMessage(goal, "progress"));
  };

  const handleSetShareType = (type: "progress" | "coachInvitation") => {
    if (selectedGoal) {
      setShareType(type);
      setShareText(generateShareMessage(selectedGoal, type));
    }
  };

  const recordShareActivity = async () => {
    if (!auth.currentUser) return;
    const userStatsRef = doc(
      db,
      `users/${auth.currentUser.uid}/userStats`,
      "sharing"
    );
    try {
      await setDoc(
        userStatsRef,
        {
          count: increment(1),
          lastSharedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("Share activity recorded.");
    } catch (error) {
      console.error("Error recording share activity:", error);
    }
  };

  const handleShare = (
    platform: "linkedin" | "twitter" | "facebook" | "copy"
  ) => {
    if (!shareText.trim()) return;

    let url = "";
    const encodedMessage = encodeURIComponent(shareText.trim());
    const encodedPageUrl = encodeURIComponent(shareUrl);

    let sharedSuccessfully = false;

    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedMessage}`;
        window.open(url, "_blank", "noopener,noreferrer");
        sharedSuccessfully = true;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        window.open(url, "_blank", "noopener,noreferrer");
        sharedSuccessfully = true;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedPageUrl}&quote=${encodedMessage}`;
        window.open(url, "_blank", "noopener,noreferrer");
        sharedSuccessfully = true;
        break;
      case "copy":
        navigator.clipboard
          .writeText(shareText.trim())
          .then(() => {
            alert("Message copied to clipboard!");
            recordShareActivity(); // Record copy as a share action
          })
          .catch((err) => {
            console.error("Failed to copy message: ", err);
            alert("Failed to copy message.");
          });
        return; // Return early as window.open is not used here
      default:
        console.warn("Unsupported share platform:", platform);
        return;
    }

    if (sharedSuccessfully) {
      recordShareActivity();
    }

    if (isMilestoneShare) {
      navigate("/"); // Navigate to dashboard after sharing a milestone
    } else {
      // Reset selection for non-milestone shares to allow sharing another goal
      // This block is reached if platform was LinkedIn, Twitter, or Facebook.
      setSelectedGoal(null);
      setShareText("");
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
          <textarea readOnly value={shareText} rows={6}></textarea>
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
