-- Add unique constraints for upsert operations in DevMode
ALTER TABLE public.user_accessories ADD CONSTRAINT user_accessories_user_accessory_unique UNIQUE (user_id, accessory_id);

ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id);