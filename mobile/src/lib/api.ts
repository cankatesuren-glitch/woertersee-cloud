const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

export type TodayPractice = {
  dueWords: number;
  newWords: number;
  nextReviewAt: string | null;
  recommendedCards: number;
};

export type DailyLearningGoal = {
  achieved: boolean;
  completedGames: number;
  percentage: number;
  targetGames: number;
};

type ProgressDashboard = {
  today: TodayPractice;
  dailyGoal: DailyLearningGoal;
};

export type GameResult = "KNOWN" | "DIFFICULT";

export type GameCard = {
  id: string;
  wordId: string;
  source: string;
  front: string;
  back: string;
  forms: string[];
  result: GameResult | null;
  nextReviewAt: string | null;
};

export type GameSession = {
  id: string;
  status: string;
  direction: "DE_EN" | "EN_DE";
  cards: GameCard[];
  answered: number;
  known: number;
  difficult: number;
  accuracy: number | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getProgressDashboard(accessToken: string): Promise<ProgressDashboard> {
  if (!apiUrl) {
    throw new ApiError("EXPO_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}/api/v1/progress`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new ApiError("Your practice plan could not be loaded.", response.status);
  }

  return response.json() as Promise<ProgressDashboard>;
}

async function gameRequest(
  accessToken: string,
  path: string,
  options: RequestInit,
  message: string,
): Promise<GameSession> {
  if (!apiUrl) {
    throw new ApiError("EXPO_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<GameSession>;
}

export function startPractice(accessToken: string): Promise<GameSession> {
  return gameRequest(
    accessToken,
    "/api/v1/games",
    {
      method: "POST",
      body: JSON.stringify({
        wordIds: [],
        personalWordIds: [],
        categoryIds: [],
        cardCount: 10,
        direction: "DE_EN",
        ordering: "RANDOM",
        unseenOnly: false,
      }),
    },
    "A practice round could not be started.",
  );
}

export function answerPracticeCard(
  accessToken: string,
  sessionId: string,
  cardId: string,
  result: GameResult,
): Promise<GameSession> {
  return gameRequest(
    accessToken,
    `/api/v1/games/${sessionId}/cards/${cardId}/answer`,
    {
      method: "PUT",
      headers: { "Idempotency-Key": `${sessionId}-${cardId}-${result}` },
      body: JSON.stringify({ result }),
    },
    "Your answer could not be saved.",
  );
}

export function finishPractice(accessToken: string, sessionId: string): Promise<GameSession> {
  return gameRequest(
    accessToken,
    `/api/v1/games/${sessionId}/finish`,
    { method: "POST" },
    "The practice round could not be finished.",
  );
}
