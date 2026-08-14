"use client";

import { Check, Minus, ArrowRight } from "lucide-react";
import { useProposalStore } from "@/lib/store";
import { INTERVIEW_SECTIONS, TOTAL_INTERVIEW_QUESTIONS } from "@/lib/types";
import { deriveInterviewAnsweredCount } from "@/lib/workflow-sync";

export default function InterviewTrackerPanel() {
  const interview = useProposalStore((s) => s.interview);
  const totalAnswered = deriveInterviewAnsweredCount(interview);

  const hasStarted = interview.currentSection !== null || interview.completedSections.length > 0;

  if (!hasStarted) {
    return (
      <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm leading-relaxed text-muted">
          The interview will gather information about your research project
          across 4 sections: eligibility, research core, resources, and track
          record. This helps draft accurate, personalized proposal sections.
        </p>
      </div>
    );
  }

  const skippedCount = interview.skippedQuestions.length;

  return (
    <div className="flex flex-col">
      <div className="border-b border-hairline pb-3">
        <h3 className="ui-label text-muted">Interview Progress</h3>
        <p className="mt-1 text-xs text-faint">
          {totalAnswered}/{TOTAL_INTERVIEW_QUESTIONS} questions answered
        </p>
      </div>

      <div className="flex-1 space-y-4 py-4">
        {INTERVIEW_SECTIONS.map((section) => {
          const isCompleted = interview.completedSections.includes(section.id);
          const isCurrent = interview.currentSection === section.id;
          const currentQ = isCurrent ? (interview.currentQuestion ?? 0) : 0;
          const answeredCount = isCompleted
            ? section.totalQuestions
            : isCurrent
            ? currentQ - 1
            : 0;
          const progress =
            section.totalQuestions > 0
              ? (answeredCount / section.totalQuestions) * 100
              : 0;

          const skippedInSection = interview.skippedQuestions.filter(
            (sq) => sq.section === section.id
          );

          return (
            <div key={section.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    isCurrent
                      ? "font-medium text-ink"
                      : isCompleted
                      ? "text-muted"
                      : "text-faint"
                  }`}
                >
                  {section.label}
                </span>
                <span className="text-xs text-faint">
                  {answeredCount}/{section.totalQuestions}
                  {isCompleted && " done"}
                </span>
              </div>

              <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <div
                  className="h-full rounded-full bg-ink transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {isCurrent && (
                <div className="ms-1 space-y-1">
                  {Array.from({ length: section.totalQuestions }, (_, i) => {
                    const qNum = i + 1;
                    const isAnswered = qNum < currentQ;
                    const isCurrentQ = qNum === currentQ;
                    const isSkipped = skippedInSection.some(
                      (sq) => sq.question === qNum
                    );

                    return (
                      <div
                        key={qNum}
                        className="flex items-center gap-2 text-xs"
                      >
                        {isAnswered ? (
                          <Check size={10} className="text-learning" />
                        ) : isCurrentQ ? (
                          <ArrowRight size={10} className="text-ink" />
                        ) : isSkipped ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-challenge" />
                        ) : (
                          <Minus size={10} className="text-faint" />
                        )}
                        <span
                          className={
                            isCurrentQ
                              ? "font-medium text-ink"
                              : isAnswered
                              ? "text-muted"
                              : isSkipped
                              ? "text-challenge"
                              : "text-faint"
                          }
                        >
                          Question {qNum}
                          {isSkipped && " (skipped)"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {skippedCount > 0 && (
        <div className="border-t border-hairline pt-3">
          <p className="text-xs text-challenge">
            {skippedCount} question{skippedCount > 1 ? "s" : ""} skipped — click
            to return
          </p>
        </div>
      )}
    </div>
  );
}
