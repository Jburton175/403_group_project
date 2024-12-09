-- create database budget_tracker


DROP TABLE IF EXISTS public.Users;
CREATE TABLE public.Users (
    user_id INT PRIMARY KEY NOT NULL,
    username CHAR(50) NOT NULL,
    userpass CHAR(50) NOT NULL
);

DROP TABLE IF EXISTS public.Accounts;
CREATE TABLE public.Accounts (
    account_id INT PRIMARY KEY NOT NULL,
    account_name CHAR(50) NOT NULL,
    account_type CHAR(20) NOT NULL
);


DROP TABLE IF EXISTS public.Transaction_Types;
CREATE TABLE public.Transaction_Types (
    transaction_type_id INT PRIMARY KEY NOT NULL,
    transaction_type CHAR(20) NOT NULL
);


DROP TABLE IF EXISTS public.Budget_Date_Types;
CREATE TABLE public.Budget_Date_Types (
    budget_date_type_id INT PRIMARY KEY NOT NULL,
    budget_date_type CHAR(20) NOT NULL
);


DROP TABLE IF EXISTS public.Transactions;
CREATE TABLE public.Transactions (
    transaction_id INT PRIMARY KEY NOT NULL,
    user_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_amount BIGINT NOT NULL,
    account_id INT,
    transaction_type_id INT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id),
    FOREIGN KEY (transaction_type_id) REFERENCES Transaction_Types(transaction_type_id)
);



DROP TABLE IF EXISTS public.Budgets;
CREATE TABLE public.Budgets (
    budget_id INT PRIMARY KEY NOT NULL,
    user_id INT NOT NULL,
    transaction_type_id INT NOT NULL,
    budget_date DATE NOT NULL,
    budget_date_type_id INT NOT NULL,
    budget_amount BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (transaction_type_id) REFERENCES Transaction_Types(transaction_type_id),
    FOREIGN KEY (budget_date_type_id) REFERENCES Budget_Date_Types(budget_date_type_id)
);