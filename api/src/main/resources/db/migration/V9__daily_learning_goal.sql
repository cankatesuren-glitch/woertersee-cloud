ALTER TABLE profiles
    ADD COLUMN daily_goal_games INTEGER NOT NULL DEFAULT 1,
    ADD CONSTRAINT chk_profiles_daily_goal_games
        CHECK (daily_goal_games BETWEEN 1 AND 10);
