// 화면과 API가 함께 쓰는 공용 타입 정의

// 면담 유형. 두 면담은 순서가 아니라 서로 독립적이며, 같은 팀원에게 여러 번 진행할 수 있다.
// (저장된 기존 데이터와 호환을 위해 내부 키는 performance / development를 그대로 쓴다.)
export const INTERVIEW_TRACKS = ["performance", "development"] as const;
export type InterviewTrack = (typeof INTERVIEW_TRACKS)[number];

export const TRACK_LABELS: Record<InterviewTrack, string> = {
  performance: "성과면담",
  development: "성장·육성면담",
};

export const TRACK_DESCRIPTIONS: Record<InterviewTrack, string> = {
  performance:
    "목표와 결과를 함께 확인하고, 성과 Gap의 원인을 탐색하여 다음 기대수준과 Action을 합의합니다.",
  development:
    "강점, 업무역량, 동기, 새로운 역할, 커리어 등 직원의 성장 방향을 함께 탐색하고 필요한 지원방법을 찾습니다.",
};

// 성장·육성면담에서 이번에 다루고 싶은 주제 (복수 선택, 몰라도 시작할 수 있다)
export const GROWTH_TOPICS = [
  "업무역량",
  "강점 개발",
  "새 역할 적응",
  "동기·몰입",
  "커리어",
  "협업·관계",
  "리더십",
  "업무 부담",
  "아직 잘 모르겠음",
] as const;

export type PerformanceGoal = {
  objective: string;
  target: string;
  result: string;
  // 예전에 저장된 기록과의 호환용 (현재 화면에서는 입력받지 않는다)
  achievement?: string;
};

export const EVALUATION_GRADES = ["S", "A", "B", "C", "D"] as const;
export type EvaluationGrade = (typeof EVALUATION_GRADES)[number];

export const GRADE_DESCRIPTIONS: Record<EvaluationGrade, string> = {
  S: "기대를 크게 뛰어넘음",
  A: "기대를 상회함",
  B: "기대 수준을 충족함",
  C: "기대에 일부 미치지 못함",
  D: "기대에 크게 미치지 못함",
};

export type DevelopmentPlan = {
  strengths: string[];
  developmentAreas: string[];
  trainings: string[];
  directions: string[];
  leaderSupport: string[];
};

export const DURATION_OPTIONS = ["15", "30", "45", "60"] as const;
export type Duration = (typeof DURATION_OPTIONS)[number];

export type SmartContextField = {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

// 선택 입력. 면담 유형에 따라 필요한 것만 보여준다.
export const OPTIONAL_FIELDS: Record<InterviewTrack, SmartContextField[]> = {
  performance: [
    { key: "recentReview", label: "최근 평가 결과", placeholder: "예: 상반기 B" },
    { key: "gap", label: "기대 대비 Gap", placeholder: "예: 목표 대비 17일 초과" },
    {
      key: "observedCase",
      label: "리더가 관찰한 구체적 사례",
      placeholder: "예: 3월 A포지션 지연 사실을 마감 이후에 공유함",
      multiline: true,
    },
    {
      key: "selfAssessment",
      label: "직원 Self-assessment",
      placeholder: "예: 현업 요청 변경이 주된 원인이라고 설명함",
      multiline: true,
    },
  ],
  development: [
    {
      key: "recentWin",
      label: "최근 잘하고 있다고 생각하는 점",
      placeholder: "예: 긴급 채용 건을 빠르게 마감함",
      multiline: true,
    },
    {
      key: "recentChange",
      label: "최근 업무/역할에서 달라진 점",
      placeholder: "예: 채용 브랜딩 업무가 새로 추가됨",
      multiline: true,
    },
    {
      key: "observedBehavior",
      label: "리더가 관찰한 구체적인 모습이나 사례",
      placeholder: "예: 지난주 회의에서 채용 프로세스 개선안을 먼저 제안함",
      multiline: true,
    },
    {
      key: "growthWish",
      label: "앞으로 더 성장했으면 하는 부분",
      placeholder: "예: 데이터로 설득하는 역량",
      multiline: true,
    },
    {
      key: "currentWork",
      label: "현재 맡고 있는 주요 업무 또는 새로운 도전",
      placeholder: "예: 신규 채용 5건 + 온보딩 프로세스 개선",
      multiline: true,
    },
  ],
};

export type MeetingContext = {
  track: InterviewTrack;
  leaderName: string;
  memberName: string;
  role: string;
  recentIssue: string;
  duration: Duration;
  // 성과면담: 간단 입력 또는 자료 붙여넣기 (둘 다 선택 사항)
  goals: PerformanceGoal[];
  performanceNotes: string;
  // 성장·육성면담: 이번에 다루고 싶은 주제
  topics: string[];
  optionalContext: Record<string, string>;
  previousSession?: SessionRecord;
};

// 면담 중 리더가 취할 수 있는 대화 행동
export const MOVE_TYPES = [
  "Listen",
  "Explore",
  "Clarify",
  "Reflect",
  "Challenge",
  "Coach",
  "Feedback",
  "Advise",
  "Align Expectation",
  "Agree Action",
] as const;
export type MoveType = (typeof MOVE_TYPES)[number];

export const MOVE_LABELS: Record<MoveType, string> = {
  Listen: "경청하기",
  Explore: "더 탐색하기",
  Clarify: "명확히 하기",
  Reflect: "요약해 확인하기",
  Challenge: "다르게 짚어보기",
  Coach: "스스로 답을 찾게 하기",
  Feedback: "피드백 전달하기",
  Advise: "제안하기",
  "Align Expectation": "기대수준 맞추기",
  "Agree Action": "행동 합의하기",
};

export type FollowUpBranch = {
  employeeResponse: string;
  suggestedFollowUp: string;
};

export type GuideQuestion = {
  question: string;
  leaderTip: string;
  followUps: FollowUpBranch[];
  avoidResponse: string;
};

export type ConversationPhase = {
  timeRange: string;
  title: string;
  purpose: string;
  questions: GuideQuestion[];
};

export type LeaderBrief = {
  summary: string;
  confirmedFacts: string[];
  needsCheck: string[];
  watchOut: string[];
};

export type ActionDraft = {
  employeeActions: string[];
  leaderActions: string[];
  followUpTiming: string;
  metrics: string[];
};

// 면담 준비하기의 결과물 — 리더가 면담 중에 그대로 따라가는 대화 가이드
export type ConversationGuide = {
  brief: LeaderBrief;
  phases: ConversationPhase[];
  suggestedActions: ActionDraft;
};

export type RecommendedMove = {
  move: MoveType;
  reason: string;
};

export type ConversationTurn = {
  speaker: "employee" | "leader";
  text: string;
  at: string;
};

// 실시간 도움 모드에서 AI가 계속 갱신하는 대화 상태
export type ConversationState = {
  meetingContext: MeetingContext;
  confirmedFacts: string[];
  workingHypotheses: string[];
  conversationHistory: ConversationTurn[];
  currentFocus: string;
  currentStage: string;
  recommendedMove: RecommendedMove;
  employeeConcerns: string[];
  managerMessages: string[];
  potentialActions: string[];
  unresolvedQuestions: string[];
  suggestedQuestion: string;
  alternativeQuestions: string[];
  suggestedStatement: string;
  focusChangeNote: string;
};

export type LiveUpdate = Pick<
  ConversationState,
  | "confirmedFacts"
  | "workingHypotheses"
  | "currentFocus"
  | "currentStage"
  | "recommendedMove"
  | "employeeConcerns"
  | "managerMessages"
  | "potentialActions"
  | "unresolvedQuestions"
  | "suggestedQuestion"
  | "alternativeQuestions"
  | "suggestedStatement"
  | "focusChangeNote"
>;

export const QUICK_ACTIONS = [
  "다른 질문",
  "조금 더 깊게",
  "직원 말을 정리해줘",
  "피드백 전달",
  "기대수준 명확화",
  "Action으로 넘어가기",
] as const;
export type QuickAction = (typeof QUICK_ACTIONS)[number];

export type CloseSummary = {
  discussionSummary: string;
  confirmedIssues: string[];
  unresolved: string[];
  employeeActions: string[];
  managerActions: string[];
  followUpTiming: string;
  metrics: string[];
  gradeBasis: string[];
  developmentPlan: DevelopmentPlan | null;
};

// 다음 면담에서 이어받기 위한 기록 (리더가 저장을 선택했을 때만 보관)
export type SessionRecord = {
  id: string;
  track: InterviewTrack;
  memberName: string;
  role: string;
  closedAt: string;
  employeeActions: string[];
  managerActions: string[];
  followUpTiming: string;
  metrics: string[];
  unresolved: string[];
  goals: PerformanceGoal[];
  topics: string[];
  grade: EvaluationGrade | "";
  gradeReason: string;
  developmentPlan: DevelopmentPlan | null;
  // 예전 기록과의 호환용
  purpose?: string;
  dueDate?: string;
  nextCheckPoints?: string[];
};
