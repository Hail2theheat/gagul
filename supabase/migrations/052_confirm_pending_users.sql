-- Confirm all users who haven't confirmed their email yet
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
