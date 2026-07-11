CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE characters
  ADD COLUMN owner_user_id INT UNSIGNED NULL AFTER id,
  ADD KEY idx_characters_owner (owner_user_id),
  ADD CONSTRAINT fk_characters_owner FOREIGN KEY (owner_user_id) REFERENCES users(id);

ALTER TABLE adventure_modules
  ADD COLUMN owner_user_id INT UNSIGNED NULL AFTER id,
  ADD KEY idx_modules_owner (owner_user_id),
  ADD CONSTRAINT fk_modules_owner FOREIGN KEY (owner_user_id) REFERENCES users(id);
