-- Link expenses and chrono/load records to matches and equipment.
ALTER TABLE "Expense" ADD COLUMN "gunId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "matchId" TEXT;
ALTER TABLE "ChronoEntry" ADD COLUMN "matchId" TEXT;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_gunId_fkey"
  FOREIGN KEY ("gunId") REFERENCES "Gun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChronoEntry"
  ADD CONSTRAINT "ChronoEntry_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
