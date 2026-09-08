CREATE TABLE admins (
  id INTEGER NOT NULL AUTO_INCREMENT, name VARCHAR(120) NOT NULL, email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, role ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN NOT NULL DEFAULT true, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL, UNIQUE INDEX admins_email_key(email),
  INDEX admins_is_active_idx(is_active), PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE subjects (
  id INTEGER NOT NULL AUTO_INCREMENT, name VARCHAR(120) NOT NULL, slug VARCHAR(160) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL, UNIQUE INDEX subjects_slug_key(slug),
  INDEX subjects_is_active_idx(is_active), PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE drive_links (
  id INTEGER NOT NULL AUTO_INCREMENT, title VARCHAR(160) NOT NULL, description TEXT NULL,
  subject_id INTEGER NOT NULL, drive_url VARCHAR(2048) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  INDEX drive_links_subject_id_is_active_sort_order_idx(subject_id, is_active, sort_order), PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE drive_links ADD CONSTRAINT drive_links_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT ON UPDATE CASCADE;
