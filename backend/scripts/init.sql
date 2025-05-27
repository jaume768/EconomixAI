-- Creación de la base de datos si no existe
CREATE DATABASE IF NOT EXISTS economix;
USE economix;

CREATE TABLE `roles` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` ENUM('normal','premium') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_users_username` (`username`),
  UNIQUE KEY `ux_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `idx_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `oauth_accounts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `provider` ENUM('google') NOT NULL,
  `provider_user_id` VARCHAR(255) NOT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT NULL,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_oauth_provider_user` (`provider`,`provider_user_id`),
  KEY `idx_oauth_user` (`user_id`),
  CONSTRAINT `fk_oauth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Planes de Uso y Asociaciones

CREATE TABLE `plans` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` ENUM('individual','familiar') NOT NULL,
  `description` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_plans_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_plans` (
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` TINYINT UNSIGNED NOT NULL,
  `activated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`plan_id`),
  CONSTRAINT `fk_user_plans_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_plans_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Familias y Miembros

CREATE TABLE `families` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_families_creator` (`created_by`),
  CONSTRAINT `fk_families_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `family_members` (
  `family_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('owner','member') NOT NULL DEFAULT 'member',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`family_id`,`user_id`),
  CONSTRAINT `fk_fm_family` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fm_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Cuentas (con ámbito individual o familiar)

CREATE TABLE `accounts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `family_id` INT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL,
  `bank_name` VARCHAR(100) NULL,
  `account_type` ENUM('ahorro','corriente','inversión') NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'EUR',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accounts_owner` (`user_id`,`family_id`),
  CONSTRAINT `fk_accounts_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_accounts_family` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Categorías y Transacciones

CREATE TABLE `categories` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `parent_id` SMALLINT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_parent` (`parent_id`),
  UNIQUE KEY `ux_categories_name` (`name`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('income','expense') NOT NULL,
  `category_id` SMALLINT UNSIGNED NULL,
  `description` VARCHAR(255) NULL,
  `transaction_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tx_user` (`user_id`),
  KEY `idx_tx_acc` (`account_id`),
  KEY `idx_tx_date` (`transaction_date`),
  CONSTRAINT `fk_tx_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_tx_account`  FOREIGN KEY (`account_id`)  REFERENCES `accounts`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_tx_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Deudas (Debts)

CREATE TABLE `debts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `creditor` VARCHAR(100) NOT NULL,
  `original_amount` DECIMAL(15,2) NOT NULL,
  `current_balance` DECIMAL(15,2) NOT NULL,
  `interest_rate` DECIMAL(5,4) NOT NULL,
  `installment_amount` DECIMAL(15,2) NULL,
  `installment_period` ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `status` ENUM('active','paid_off','defaulted') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_debts_user` (`user_id`),
  CONSTRAINT `fk_debts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Recurring Transactions (Gastos Fijos y Pagos de Deuda)

CREATE TABLE `recurring_transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `frequency` ENUM('daily','weekly','monthly') NOT NULL,
  `next_date` DATE NOT NULL,
  `category_id` SMALLINT UNSIGNED NULL,
  `kind` ENUM('expense','debt_payment') NOT NULL DEFAULT 'expense',
  `debt_id` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rt_user` (`user_id`),
  KEY `idx_rt_next` (`next_date`),
  CONSTRAINT `fk_rt_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_rt_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rt_debt`     FOREIGN KEY (`debt_id`)     REFERENCES `debts`(`id`)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Gamificación y Metas

CREATE TABLE `goals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `goal_type` ENUM('ahorro','compra','viaje','jubilacion') NOT NULL,
  `target_amount` DECIMAL(15,2) NOT NULL,
  `target_date` DATE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goals_user` (`user_id`),
  CONSTRAINT `fk_goals_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `achievements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `criteria` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_achievements_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_achievements` (
  `user_id` INT UNSIGNED NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `achieved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `progress` JSON NOT NULL,
  PRIMARY KEY (`user_id`,`achievement_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_ach`  FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `challenges` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `criteria` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_challenges_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_challenges` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `challenge_id` INT UNSIGNED NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `status` ENUM('pending','active','completed','failed') NOT NULL DEFAULT 'pending',
  `progress` JSON NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uc_user` (`user_id`),
  CONSTRAINT `fk_uc_user`      FOREIGN KEY (`user_id`)      REFERENCES `users`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_uc_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. IA, Recomendaciones y Notificaciones

CREATE TABLE `recommendations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('presupuesto','ahorro','inversion','rebalanceo','otro') NOT NULL,
  `params` JSON NOT NULL,
  `suggestion` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rec_user` (`user_id`),
  CONSTRAINT `fk_rec_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `simulations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `params` JSON NOT NULL,
  `result_data` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sim_user` (`user_id`),
  CONSTRAINT `fk_sim_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` ENUM('alerta','recordatorio') NOT NULL,
  `message` TEXT NOT NULL,
  `scheduled_at` DATETIME NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_not_user` (`user_id`),
  KEY `idx_not_sched` (`scheduled_at`),
  CONSTRAINT `fk_not_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Auditoría y Seguridad

CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `info` JSON NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_time` (`timestamp`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_pr_token` (`token`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_2fa` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `secret` VARCHAR(255) NOT NULL,
  `confirmed_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_2fa_user` (`user_id`),
  CONSTRAINT `fk_2fa_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Datos iniciales para tablas de referencia
INSERT INTO roles (name) VALUES ('normal'), ('premium');

INSERT INTO plans (name, description) VALUES 
('individual', 'Plan para gestión de finanzas personales'),
('familiar', 'Plan para gestión de finanzas compartidas en familia');

-- Categorías predefinidas para transacciones
INSERT INTO categories (name) VALUES 
('Vivienda'), ('Alimentación'), ('Transporte'), ('Ocio'), ('Salud'),
('Educación'), ('Tecnología'), ('Suscripciones'), ('Ingresos Laborales'), ('Inversiones');

-- Subcategorías
INSERT INTO categories (name, parent_id) VALUES 
('Alquiler', 1), ('Hipoteca', 1), ('Suministros', 1),
('Supermercado', 2), ('Restaurantes', 2),
('Transporte Público', 3), ('Gasolina', 3), ('Mantenimiento Vehículo', 3),
('Cine', 4), ('Conciertos', 4), ('Viajes', 4),
('Consultas Médicas', 5), ('Farmacia', 5),
('Cursos', 6), ('Libros', 6),
('Hardware', 7), ('Software', 7),
('Streaming', 8), ('Gimnasio', 8),
('Salario', 9), ('Freelance', 9),
('Dividendos', 10), ('Intereses', 10);

-- Usuario de ejemplo para pruebas
INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES
('admin', 'admin@gmail.com', '$2a$10$z.xh9hrsk5f/ZSRshe534u3AOQyGTlNWpAaErwjET71.OAMfQbFG.', 'Jaume', 'Fernandez');

-- Asignar rol y plan al usuario
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_plans (user_id, plan_id) VALUES (1, 1);

-- Cuenta bancaria de ejemplo
INSERT INTO accounts (user_id, name, bank_name, account_type, currency) VALUES
(1, 'Cuenta Principal', 'Mi Banco', 'corriente', 'EUR');

-- Algunas transacciones de ejemplo
INSERT INTO transactions (user_id, account_id, amount, type, category_id, description, transaction_date) VALUES
(1, 1, 1200.00, 'income', 20, 'Nómina Mayo', '2025-05-25'),
(1, 1, -650.00, 'expense', 11, 'Alquiler Mayo', '2025-05-02'),
(1, 1, -85.50, 'expense', 14, 'Compra Mercadona', '2025-05-10'),
(1, 1, -45.00, 'expense', 19, 'Cena con amigos', '2025-05-15'),
(1, 1, -29.99, 'expense', 21, 'Suscripción Netflix', '2025-05-05');
