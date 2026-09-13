ALTER TABLE `subjects`
  ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0 AFTER `grade_id`;

UPDATE `subjects`
SET `sort_order` = `id`;

CREATE INDEX `subjects_grade_id_is_active_sort_order_idx`
  ON `subjects`(`grade_id`, `is_active`, `sort_order`);
DROP INDEX `subjects_grade_id_is_active_idx` ON `subjects`;
