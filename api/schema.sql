-- ==========================================================================
-- GxP Compliance Group — MySQL schema
-- Import this file in phpMyAdmin (Hostinger hPanel → Databases → phpMyAdmin)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS inquiries (
    custid           INT AUTO_INCREMENT PRIMARY KEY,
    full_name        VARCHAR(200)  NOT NULL,
    email            VARCHAR(200)  NOT NULL,
    contact_number   VARCHAR(30)   NOT NULL,
    organization     VARCHAR(200)  NOT NULL,
    area_of_interest VARCHAR(100)  NOT NULL,
    message          TEXT          NOT NULL,
    status           VARCHAR(50)   NOT NULL DEFAULT 'new',
    internal_notes   TEXT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- custid starts at 100000 to match the original numbering scheme
ALTER TABLE inquiries AUTO_INCREMENT = 100000;

CREATE INDEX idx_inquiries_email ON inquiries (email);

CREATE TABLE IF NOT EXISTS users (
    uid           INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin user, username: admin / password: admin
-- IMPORTANT: change this password after first login (or via the Admin panel).
-- Hash below is bcrypt for the plain text password "admin".
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = username;
