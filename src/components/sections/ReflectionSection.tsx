// src/components/sections/ReflectionSection.tsx
import React, { useState, useCallback } from "react";
import type {
  ReflectionSection as ReflectionSectionData,
  ReflectionSubmission,
  ReflectionResponse,
  ReflectionHistoryEntry,
  SavedReflectionState,
  AssessmentLevel,
} from "../../types/data";
import styles from "./Section.module.css";
import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";

// --- Simulated API Call ---
async function getSimulatedFeedback(
  submission: ReflectionSubmission,
  rubric?: ReflectionSectionData["rubric"]
): Promise<ReflectionResponse> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 100)
  );

  let assessment: AssessmentLevel = "developing";
  let feedback = "";
  const codeLower = submission.code.toLowerCase();
  const explanationLower = submission.explanation.toLowerCase();

  const topicKeywords: { [key: string]: string[] } = {
    variables: ["variable", "type", "assign", "integer", "string", "boolean"],
    functions: ["def", "return", "parameter", "argument", "call"],
    loops: ["for", "while", "iterate", "loop", "range"],
    conditions: ["if", "else", "elif", "condition", "boolean"],
    datastructures: [
      "list",
      "dictionary",
      "set",
      "tuple",
      "append",
      "key",
      "value",
    ],
    turtle: ["turtle", "forward", "left", "right", "penup", "pendown"],
    testing: ["test", "assert", "unittest", "pytest"],
    prediction: ["predict", "output", "input", "trace"],
  };
  const relevantKeywords = topicKeywords[submission.topic.toLowerCase()] || [];
  const keywordMatch = relevantKeywords.some(
    (kw) => codeLower.includes(kw) || explanationLower.includes(kw)
  );

  if (submission.code.length < 20 || submission.explanation.length < 40) {
    assessment = "developing";
    feedback =
      rubric?.developing ||
      "Your code example or explanation seems a bit brief. Try elaborating more on the concept and how your code demonstrates it.";
  } else if (
    submission.explanation.length > 100 &&
    keywordMatch &&
    submission.code.length > 30
  ) {
    assessment = "exceeds";
    feedback =
      rubric?.exceeds ||
      "Excellent! Your code is clear, and your explanation thoroughly demonstrates a strong understanding of the topic. You've connected the code well to the concept.";
  } else {
    assessment = "meets";
    feedback =
      rubric?.meets ||
      "Good job! Your code example works and your explanation covers the main points of the topic.";
  }
  return { feedback, assessment, timestamp: Date.now() };
}
// --- End Simulated API Call ---

interface ReflectionSectionProps {
  section: ReflectionSectionData;
  lessonId: string;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const [topic, setTopic] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `reflectState_${lessonId}_${section.id}`;
  const initialState: SavedReflectionState = { history: [] };

  const checkReflectionCompletion = useCallback(
    (currentHookState: SavedReflectionState): boolean => {
      return currentHookState.history.some(
        (entry) =>
          entry.submission.submitted === true &&
          entry.response?.assessment &&
          ["meets", "exceeds"].includes(entry.response.assessment)
      );
    },
    []
  ); // No dependencies, relies only on the state passed to it

  const [reflectionState, setReflectionState, isSectionComplete] =
    useSectionProgress<SavedReflectionState>(
      lessonId,
      section.id,
      storageKey,
      initialState,
      checkReflectionCompletion
    );

  const history = reflectionState.history;

  const handleSubmit = useCallback(
    async (isFormalSubmission: boolean) => {
      if (!topic || !code.trim() || !explanation.trim()) {
        alert(
          "Please select a topic, write some code, and provide an explanation."
        );
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const submission: ReflectionSubmission = {
        topic,
        code,
        explanation,
        timestamp: Date.now(),
        submitted: isFormalSubmission,
      };

      try {
        const response = await getSimulatedFeedback(submission, section.rubric);
        const newHistoryEntry: ReflectionHistoryEntry = {
          submission,
          response,
        };

        setReflectionState((prevState) => ({
          history: [newHistoryEntry, ...prevState.history],
        }));

        if (isFormalSubmission) {
          setCode("");
          setExplanation("");
          alert("Your entry has been submitted and saved to your journal!");
        } else {
          alert(
            "Feedback received! You can revise your work or submit it to your journal."
          );
        }
      } catch (err) {
        console.error("Feedback submission error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to get feedback. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [topic, code, explanation, section.rubric, setReflectionState]
  );

  const getTopicName = (topicValue: string): string => {
    const topicMap: { [key: string]: string } = {
      variables: "Variables and Data Types",
      functions: "Functions",
      loops: "Loops and Iteration",
      conditions: "Conditional Statements",
      datastructures: "Data Structures",
      turtle: "Turtle Graphics",
      testing: "Testing",
      prediction: "Prediction",
    };
    return (
      topicMap[topicValue] ||
      topicValue.charAt(0).toUpperCase() + topicValue.slice(1)
    );
  };

  const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleString();

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      <div className={styles.reflectionContainer}>
        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-topic`}
            className={styles.reflectionLabel}
          >
            {section.prompts.topic || "Choose a topic:"}
          </label>
          <select
            id={`${section.id}-topic`}
            className={styles.topicSelector}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a topic...</option>
            <option value="variables">Variables and Data Types</option>
            <option value="functions">Functions</option>
            <option value="loops">Loops and Iteration</option>
            <option value="conditions">Conditional Statements</option>
            <option value="datastructures">Data Structures</option>
            <option value="turtle">Turtle Graphics</option>
            <option value="testing">Testing</option>
            <option value="prediction">Prediction</option>
          </select>
        </div>

        <div className={styles.reflectionInputGroup}>
          <label className={styles.reflectionLabel}>
            {section.prompts.code || "Code Example:"}
          </label>
          <div className={styles.reflectionCodeEditorWrapper}>
            <CodeEditor
              value={code}
              onChange={setCode}
              readOnly={isSubmitting}
              minHeight="150px"
            />
          </div>
        </div>

        <div className={styles.reflectionInputGroup}>
          <label
            htmlFor={`${section.id}-explanation`}
            className={styles.reflectionLabel}
          >
            {section.prompts.explanation || "Explanation:"}
          </label>
          <textarea
            id={`${section.id}-explanation`}
            className={styles.reflectionExplanation}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            disabled={isSubmitting}
            placeholder="Explain your code example here (3-4 sentences)..."
          />
        </div>

        <div className={styles.reflectionButtons}>
          <button
            onClick={() => handleSubmit(false)} // Get Feedback - isFormalSubmission is false
            disabled={
              isSubmitting || !topic || !code.trim() || !explanation.trim()
            }
            className={styles.reflectionFeedbackBtn}
          >
            {isSubmitting ? "Processing..." : "Get Feedback"}
          </button>
          <button
            onClick={() => handleSubmit(true)} // Submit Entry - isFormalSubmission is true
            disabled={
              isSubmitting || !topic || !code.trim() || !explanation.trim()
            }
            className={styles.reflectionSubmitBtn}
          >
            {isSubmitting ? "Processing..." : "Submit Entry to Journal"}
          </button>
        </div>

        {error && <p className={styles.apiError}>Error: {error}</p>}

        <div className={styles.reflectionHistory}>
          <h4>
            Submission History {isSectionComplete ? "(Section Complete ✓)" : ""}
          </h4>
          {history.length === 0 ? (
            <p className={styles.noHistory}>No submissions yet.</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={entry.submission.timestamp + "-" + index}
                className={`${styles.reflectionCard} ${
                  entry.response?.assessment
                    ? styles[
                        `cardAssessment${
                          entry.response.assessment.charAt(0).toUpperCase() +
                          entry.response.assessment.slice(1)
                        }`
                      ]
                    : ""
                }`}
              >
                <div className={styles.reflectionSubmission}>
                  <div className={styles.reflectionHeader}>
                    <span className={styles.reflectionDate}>
                      {formatDate(entry.submission.timestamp)}
                    </span>
                    {/* Display distinct visual cue for "Get Feedback" vs "Submitted to Journal" */}
                    {entry.submission.submitted ? (
                      <span className={styles.submissionBadge}>
                        Submitted to Journal
                      </span>
                    ) : (
                      <span
                        className={`${styles.submissionBadge} ${styles.feedbackOnlyBadge}`}
                      >
                        Feedback Cycle
                      </span>
                    )}
                  </div>
                  <h5>Topic: {getTopicName(entry.submission.topic)}</h5>
                  <details>
                    <summary style={{ cursor: "pointer", fontWeight: "500" }}>
                      Show Code & Explanation
                    </summary>
                    <div className={styles.reflectionCodeDisplay}>
                      <pre>
                        <code>{entry.submission.code}</code>
                      </pre>
                    </div>
                    <div className={styles.reflectionExplanationDisplay}>
                      <p>{entry.submission.explanation}</p>
                    </div>
                  </details>
                </div>
                {entry.response && (
                  <div className={styles.reflectionResponse}>
                    <h5>Feedback ({formatDate(entry.response.timestamp)}):</h5>
                    {entry.response.assessment && (
                      <div
                        className={`${styles.assessmentBadge} ${
                          styles[
                            `assessmentBadge${
                              entry.response.assessment
                                .charAt(0)
                                .toUpperCase() +
                              entry.response.assessment.slice(1)
                            }`
                          ] || ""
                        }`}
                      >
                        {entry.response.assessment}
                      </div>
                    )}
                    <p>{entry.response.feedback}</p>
                  </div>
                )}
                {!entry.response &&
                  isSubmitting &&
                  // Check if this history entry is the one currently being submitted
                  entry.submission.timestamp ===
                    Math.max(...history.map((h) => h.submission.timestamp)) && (
                    <div className={styles.reflectionResponse}>
                      <p>
                        <i>Getting feedback...</i>
                      </p>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ReflectionSection;
