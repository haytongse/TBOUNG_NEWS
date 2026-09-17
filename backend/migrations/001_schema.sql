-- Migration 001: Initial schema (MySQL)

CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('superAdmin','admin','editor') NOT NULL DEFAULT 'editor',
  status        ENUM('active','inactive')           NOT NULL DEFAULT 'active',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  name_kh    VARCHAR(200) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
  id        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  name_kh   VARCHAR(200) NOT NULL,
  slug      VARCHAR(100) NOT NULL UNIQUE,
  order_num INT          NOT NULL DEFAULT 0,
  active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tags (
  id   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id           INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(500)  NOT NULL DEFAULT '',
  title_kh     VARCHAR(500)  NOT NULL,
  excerpt      TEXT,
  excerpt_kh   TEXT,
  content      LONGTEXT,
  content_kh   LONGTEXT,
  image        VARCHAR(500)  NOT NULL DEFAULT '',
  category_id  INT           DEFAULT NULL,
  menu_id      INT           DEFAULT NULL,
  author       VARCHAR(200)  NOT NULL DEFAULT 'Admin',
  status       ENUM('published','draft') NOT NULL DEFAULT 'draft',
  featured     TINYINT(1)    NOT NULL DEFAULT 0,
  breaking     TINYINT(1)    NOT NULL DEFAULT 0,
  show_video   TINYINT(1)    NOT NULL DEFAULT 0,
  views        INT           NOT NULL DEFAULT 0,
  published_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_articles_menu     FOREIGN KEY (menu_id)     REFERENCES menus(id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_articles_status       ON articles(status);
CREATE INDEX idx_articles_category_id  ON articles(category_id);
CREATE INDEX idx_articles_featured     ON articles(featured);
CREATE INDEX idx_articles_published_at ON articles(published_at);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  CONSTRAINT fk_at_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag     FOREIGN KEY (tag_id)     REFERENCES tags(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sliders (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(300) NOT NULL,
  title_kh   VARCHAR(300) NOT NULL DEFAULT '',
  image      VARCHAR(500) NOT NULL,
  link       VARCHAR(500) NOT NULL DEFAULT '/',
  order_num  INT          NOT NULL DEFAULT 0,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
