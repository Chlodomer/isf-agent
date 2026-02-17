import { create } from "zustand";
import type {
  Session,
  Requirements,
  ResearcherInfo,
  ProjectInfo,
  Resources,
  TrackRecord,
  ProposalSections,
  InterviewState,
  ValidationState,
  Learnings,
  UIState,
  ChatMessage,
  Phase,
  ContextTab,
  SectionName,
  ReferenceSource,
} from "./types";

interface ProposalStore {
  // Domain state (maps to state-template.yaml)
  session: Session;
  requirements: Requirements;
  researcherInfo: ResearcherInfo;
  projectInfo: ProjectInfo;
  resources: Resources;
  trackRecord: TrackRecord;
  referenceSources: ReferenceSource[];
  proposalSections: ProposalSections;
  interview: InterviewState;
  validation: ValidationState;
  learnings: Learnings;

  // Chat state
  messages: ChatMessage[];

  // UI state
  ui: UIState;

  // Actions
  setPhase: (phase: Phase) => void;
  setResearcherInfo: (info: Partial<ResearcherInfo>) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  toggleContextPanel: () => void;
  setContextTab: (tab: ContextTab) => void;
  openContextPanel: (tab: ContextTab) => void;
  setLeftRailCollapsed: (collapsed: boolean) => void;
  approveSection: (section: SectionName) => void;
  updateInterviewProgress: (section: number, question: number) => void;
  completeInterviewSection: (section: number) => void;
  skipQuestion: (section: number, question: number) => void;
  setValidation: (validation: Partial<ValidationState>) => void;
  addLearningPattern: (pattern: Learnings["successfulPatterns"][0]) => void;
  addWeakness: (weakness: Learnings["weaknesses"][0]) => void;
  addReviewerConcern: (concern: Learnings["reviewerConcerns"][0]) => void;
  addReferenceSources: (sources: ReferenceSource[]) => void;
}

const initialSession: Session = {
  id: null,
  started: null,
  lastUpdated: null,
  currentPhase: 1,
};

const initialRequirements: Requirements = {
  fetched: false,
  sourceUrl: null,
  fetchDate: null,
  eligibility: {
    positionRequirement: null,
    yearsSinceAppointment: null,
    institutionRequirement: null,
    priorFundingRestriction: null,
  },
  budget: { annualMaximum: null, totalMaximum: null, currency: "NIS" },
  duration: null,
  deadline: null,
  pageLimits: { total: null, background: null, methods: null, cv: null },
  requiredSections: [],
  formatting: { language: null, font: null, margins: null, fileFormat: null },
};

const initialResearcherInfo: ResearcherInfo = {
  name: null,
  institution: null,
  department: null,
  position: null,
  appointmentDate: null,
  priorPositions: [],
  priorIsfFunding: null,
  email: null,
};

const initialProjectInfo: ProjectInfo = {
  title: null,
  centralQuestion: null,
  aims: [
    { number: 1, title: null, hypothesis: null, approach: null },
    { number: 2, title: null, hypothesis: null, approach: null },
  ],
  innovation: null,
  preliminaryData: null,
  methodology: null,
  expectedOutcomes: null,
  risks: [],
  duration: null,
  milestones: { year1: [], year2: [], year3: [], year4: [] },
};

const initialResources: Resources = {
  personnel: [],
  equipment: [],
  consumables: [],
  travel: [],
  other: [],
  budgetTotals: {
    year1: null,
    year2: null,
    year3: null,
    year4: null,
    total: null,
  },
};

const initialTrackRecord: TrackRecord = {
  publications: [],
  relevantPublications: [],
  priorGrants: [],
  collaborators: [],
};

const emptySection = { draft: null, approved: false };

const initialProposalSections: ProposalSections = {
  abstract: { ...emptySection, wordCount: null },
  background: { ...emptySection, pageCount: null },
  aims: { ...emptySection },
  methods: { ...emptySection, pageCount: null },
  innovation: { ...emptySection },
  budget: { ...emptySection },
  risks: { ...emptySection },
  bibliography: { entries: [] },
};

const initialInterview: InterviewState = {
  currentSection: null,
  currentQuestion: null,
  completedSections: [],
  skippedQuestions: [],
};

const initialValidation: ValidationState = {
  lastRun: null,
  passed: [],
  failed: [],
  warnings: [],
  manualReview: [],
  readyForSubmission: false,
};

const initialLearnings: Learnings = {
  successfulPatterns: [],
  weaknesses: [],
  reviewerConcerns: [],
  redFlags: [],
};

const initialUI: UIState = {
  contextPanelOpen: false,
  activeContextTab: "operations",
  leftRailCollapsed: false,
};

export const useProposalStore = create<ProposalStore>((set) => ({
  session: initialSession,
  requirements: initialRequirements,
  researcherInfo: initialResearcherInfo,
  projectInfo: initialProjectInfo,
  resources: initialResources,
  trackRecord: initialTrackRecord,
  referenceSources: [],
  proposalSections: initialProposalSections,
  interview: initialInterview,
  validation: initialValidation,
  learnings: initialLearnings,
  messages: [],
  ui: initialUI,

  setPhase: (phase) =>
    set((state) => ({
      session: {
        ...state.session,
        currentPhase: phase,
        lastUpdated: new Date().toISOString(),
      },
    })),

  setResearcherInfo: (info) =>
    set((state) => ({
      researcherInfo: {
        ...state.researcherInfo,
        ...info,
      },
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) =>
    set(() => ({
      messages,
    })),

  toggleContextPanel: () =>
    set((state) => ({
      ui: { ...state.ui, contextPanelOpen: !state.ui.contextPanelOpen },
    })),

  setContextTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, activeContextTab: tab },
    })),

  openContextPanel: (tab) =>
    set((state) => ({
      ui: { ...state.ui, contextPanelOpen: true, activeContextTab: tab },
    })),

  setLeftRailCollapsed: (collapsed) =>
    set((state) => ({
      ui: { ...state.ui, leftRailCollapsed: collapsed },
    })),

  approveSection: (section) =>
    set((state) => ({
      proposalSections: {
        ...state.proposalSections,
        [section]: { ...state.proposalSections[section], approved: true },
      },
    })),

  updateInterviewProgress: (section, question) =>
    set((state) => ({
      interview: {
        ...state.interview,
        currentSection: section,
        currentQuestion: question,
      },
    })),

  completeInterviewSection: (section) =>
    set((state) => ({
      interview: {
        ...state.interview,
        completedSections: state.interview.completedSections.includes(section)
          ? state.interview.completedSections
          : [...state.interview.completedSections, section],
      },
    })),

  skipQuestion: (section, question) =>
    set((state) => ({
      interview: {
        ...state.interview,
        skippedQuestions: [
          ...state.interview.skippedQuestions,
          { section, question },
        ],
      },
    })),

  setValidation: (validation) =>
    set((state) => ({
      validation: { ...state.validation, ...validation },
    })),

  addLearningPattern: (pattern) =>
    set((state) => ({
      learnings: {
        ...state.learnings,
        successfulPatterns: [...state.learnings.successfulPatterns, pattern],
      },
    })),

  addWeakness: (weakness) =>
    set((state) => ({
      learnings: {
        ...state.learnings,
        weaknesses: [...state.learnings.weaknesses, weakness],
      },
    })),

  addReviewerConcern: (concern) =>
    set((state) => ({
      learnings: {
        ...state.learnings,
        reviewerConcerns: [...state.learnings.reviewerConcerns, concern],
      },
    })),

  addReferenceSources: (sources) =>
    set((state) => {
      const existingIds = new Set(state.referenceSources.map((source) => source.id));
      const uniqueSources = sources.filter((source) => !existingIds.has(source.id));
      if (uniqueSources.length === 0) {
        return {};
      }
      return {
        referenceSources: [...state.referenceSources, ...uniqueSources],
      };
    }),
}));
