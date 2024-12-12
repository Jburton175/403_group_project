-- create database budget_tracker


-- Create database budget_tracker (if necessary)
-- DROP TABLE IF EXISTS budgets CASCADE;
-- DROP TABLE IF EXISTS transactions CASCADE;
-- DROP TABLE IF EXISTS transaction_types CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS budget_date_types CASCADE;
-- Create the users table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  username CHAR(50) NOT NULL,
  userpass CHAR(50) NOT NULL
);
-- Create the accounts table
CREATE TABLE accounts (
  account_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  account_name CHAR(50) NOT NULL,
  account_type CHAR(20) NOT NULL
);
-- Create the transaction_types table
CREATE TABLE transaction_types (
  transaction_type_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  transaction_type CHAR(20) NOT NULL
);
-- Create the budget_date_types table
CREATE TABLE budget_date_types (
  budget_date_type_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  budget_date_type CHAR(20) NOT NULL
);
-- Create the transactions table
CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  user_id INT NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_amount BIGINT NOT NULL,
  account_id INT,
  transaction_type_id INT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (account_id) REFERENCES accounts(account_id),
  FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(transaction_type_id)
);
-- Create the budgets table
CREATE TABLE budgets (
  budget_id SERIAL PRIMARY KEY, -- Auto-incrementing ID
  user_id INT NOT NULL,
  transaction_type_id INT NOT NULL,
  budget_date DATE NOT NULL,
  budget_date_type_id INT NOT NULL,
  budget_amount BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(transaction_type_id),
  FOREIGN KEY (budget_date_type_id) REFERENCES budget_date_types(budget_date_type_id)
);