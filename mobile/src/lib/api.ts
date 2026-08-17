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
