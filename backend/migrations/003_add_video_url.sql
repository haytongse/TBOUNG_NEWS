-- Migration 003: Add video_url to articles
ALTER TABLE articles ADD COLUMN video_url VARCHAR(500) NOT NULL DEFAULT '';
