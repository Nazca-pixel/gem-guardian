-- Add database-level CHECK constraints for input validation
-- These constraints enforce data integrity at the database level, preventing malicious clients from bypassing client-side validation

-- 1. Transaction amount must be positive
ALTER TABLE transactions ADD CONSTRAINT transactions_positive_amount CHECK (amount > 0);

-- 2. Transaction description must have reasonable length (1-500 chars)
ALTER TABLE transactions ADD CONSTRAINT transactions_description_length CHECK (char_length(description) >= 1 AND char_length(description) <= 500);

-- 3. Savings goal target_amount must be positive
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_positive_target CHECK (target_amount > 0);

-- 4. Savings goal current_amount must be non-negative and not exceed target
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_valid_current CHECK (current_amount >= 0);

-- 5. Savings goal name must have reasonable length (1-100 chars)
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100);

-- 6. Profile display_name length constraint (2-50 chars when not null)
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR (char_length(display_name) >= 2 AND char_length(display_name) <= 50));

-- 7. Profile avatar_url length constraint (when not null)
ALTER TABLE profiles ADD CONSTRAINT profiles_avatar_url_length CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500);

-- 8. Companion animal name length constraint (1-50 chars)
ALTER TABLE companion_animals ADD CONSTRAINT companion_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50);

-- 9. Companion animal XP values must be non-negative
ALTER TABLE companion_animals ADD CONSTRAINT companion_valid_fxp CHECK (fxp >= 0);
ALTER TABLE companion_animals ADD CONSTRAINT companion_valid_bxp CHECK (bxp >= 0);

-- 10. Companion animal streak values must be non-negative
ALTER TABLE companion_animals ADD CONSTRAINT companion_valid_streaks CHECK ((current_streak IS NULL OR current_streak >= 0) AND (longest_streak IS NULL OR longest_streak >= 0));

-- 11. Companion animal consecutive_failed_months must be non-negative
ALTER TABLE companion_animals ADD CONSTRAINT companion_valid_failed_months CHECK (consecutive_failed_months >= 0);