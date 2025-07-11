-- Drop googleId column now that Google OAuth is removed
ALTER TABLE "User" DROP COLUMN "googleId";
