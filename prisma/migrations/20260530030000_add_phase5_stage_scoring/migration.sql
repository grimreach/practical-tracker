-- Phase 5 richer stage scoring fields
ALTER TABLE "StageScore" ADD COLUMN "points" DOUBLE PRECISION;
ALTER TABLE "StageScore" ADD COLUMN "hitFactor" DOUBLE PRECISION;
ALTER TABLE "StageScore" ADD COLUMN "stagePlacement" INTEGER;
ALTER TABLE "StageScore" ADD COLUMN "stageTotalCompetitors" INTEGER;
ALTER TABLE "StageScore" ADD COLUMN "classifier" BOOLEAN NOT NULL DEFAULT false;
