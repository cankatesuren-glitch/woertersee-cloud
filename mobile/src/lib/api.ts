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

export type VocabularyCategory = {
  id: string;
  name: string;
  slug: string;
  wordCount: number;
};

export type VocabularyWord = {
  id: string;
  german: string;
  english: string;
  forms: string[];
};

export type DeckOptions = {
  wordIds: string[];
  categoryIds: string[];
  cardCount: number;
  direction: "DE_EN" | "EN_DE";
  ordering: "RANDOM" | "AZ";
  unseenOnly: boolean;
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

export async function getVocabulary(): Promise<{
  categories: VocabularyCategory[];
  words: VocabularyWord[];
}> {
  if (!apiUrl) throw new ApiError("EXPO_PUBLIC_API_URL is not configured.");

  const [categoriesResponse, wordsResponse] = await Promise.all([
    fetch(`${apiUrl}/api/v1/vocabulary/categories`),
    fetch(`${apiUrl}/api/v1/vocabulary/words`),
  ]);
  if (!categoriesResponse.ok || !wordsResponse.ok) {
    throw new ApiError("The vocabulary catalogue could not be loaded.");
  }
  return {
    categories: await categoriesResponse.json() as VocabularyCategory[],
    words: await wordsResponse.json() as VocabularyWord[],
  };
}

export function startPractice(accessToken: string, options: DeckOptions): Promise<GameSession> {
  return gameRequest(
    accessToken,
    "/api/v1/games",
    {
      method: "POST",
      body: JSON.stringify({ ...options, personalWordIds: [] }),
    },
    "A practice round could not be started.",
  );
}

export function reviewPractice(accessToken: string, sessionId: string): Promise<GameSession> {
  return gameRequest(
    accessToken,
    `/api/v1/games/${sessionId}/review`,
    { method: "POST" },
    "Your difficult words could not be loaded.",
  );
}

export function replayPractice(accessToken: string, sessionId: string): Promise<GameSession> {
  return gameRequest(
    accessToken,
    `/api/v1/games/${sessionId}/replay`,
    { method: "POST" },
    "The deck could not be replayed.",
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
