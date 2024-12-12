let express = require('express');
let app = express();
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 3000;

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS for templating
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Initialize session middleware
app.use(session({
    secret: 'intex2346235346', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Use `true` for HTTPS
}));

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/views'));

app.use(express.urlencoded({extended: true}));


// const knex = require("knex")({
//     client: "pg",
//     connection: {
//         host: process.env.RDS_HOSTNAME || "localhost",
//         user: process.env.RDS_USERNAME || "postgres",
//         password: process.env.RDS_PASSWORD || "admin",
//         database: process.env.RDS_DB_NAME || "budget_tracker",
//         port: process.env.RDS_PORT || 5432,
//         ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
//     }
// });

const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "leomessi",
        database: process.env.RDS_DB_NAME || "project3",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});


// Excluded routes that don't require login
const excludedRoutes = [
    '/login',
    '/createaccount'
];

// Middleware to enforce login check
app.use((req, res, next) => {
    // console.log(req.session.user);
    // console.log(excludedRoutes);
    // console.log(req.path);

    // Skip excluded routes and favicon.ico
    if (
        excludedRoutes.includes(req.path) ||
        req.path === '/favicon.ico'
        
    ) {
        return next();
    }

    // Redirect to login if no session exists
    if (!req.session.user) {
        console.log('Access denied. Redirecting to login.');
        return res.redirect('/login');
    }
    next(); // Allow access if logged in
});

app.get('/login', (req, res) => {
    res.render('login');

});


app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // console.log(req.body.username);
    // console.log(req.body.password);

    knex('users')
        .select('user_id')
        .where("username", username)
        .where("userpass", password)
        .first() // Returns the first matching record
        .then(user => {
            if (user) {
                req.session.user = user; // Save volunteer to session
                // console.log('User logged in:', req.session.user);
                res.redirect('/');
            } else {
                console.log('Invalid username or password');
                res.status(401).send("Invalid username or password");
                res.render("login") 
            }
        })
        .catch(error => {
            console.error('Error during database query:', error.stack);
            res.status(500).send('Database query failed: ' + error.message);
        });
});



app.get("/createaccount", (req, res) =>
    {
        res.render('createaccount');
    });



app.post('/createaccount', (req, res) => {  
    const username = req.body.username;  
    const password = req.body.password;  

    console.log('Request body:', req.body);

    knex('users')
        .insert({
            username: username,
            userpass: password, 
        }) 
        .then(() => {
            console.log('Form submitted successfully!');
            console.log('Request body:', req.body);
            res.redirect('/login'); 
        })

        .catch(error => {
            console.error('Error adding a user:', error);
            console.log('Request body:', req.body);
            res.status(500).send('Internal Server Error');

    });
});

app.get('/', (req, res) => {

    res.render('index');

});

app.get("/home", (req, res) =>
    {
        res.render("home");
        
    });

// render the budget creation page
app.get("/createBudget/:user_id", (req, res) =>
    {
        const user_id = req.params.user_id

        knex('transaction_types')
        .select()
        .then(trantypes => {

            knex('budget_date_types')
            .select()
            .then(datetypes => {

                res.render("createBudget", { trantypes, datetypes, user_id});

            })
        })
        
});

app.post('/createBudget', (req, res) => {



    const user_id = req.body.user_id
    const transaction_type_id = req.body.transaction_type_id; // Access each value directly from req.body
    const budget_date = req.body.budget_date;
    const budget_date_type_id = req.body.budget_date_type_id;
    const budget_amount = req.body.budget_amount;


    knex('budgets').insert({
        user_id: user_id,
        transaction_type_id: transaction_type_id,
        budget_date: budget_date,
        budget_date_type_id: budget_date_type_id,
        budget_amount: budget_amount,
    }).then(budget => {
        res.redirect("/budgets");
    }).catch( err => {
        console.log(err);
        res.status(500).json({err});
    });
});

app.get('/editBudget/:id', (req, res) => {
    let id = req.params.id
    
    knex('budgets')
    .where('budget_id', id)
    .first()
    .then(budget => {
        if (!budget) {
            return res.status(404).send('Budget not found');
        }

        if (budget.budget_date) {
            budget.budget_date = new Date(budget.budget_date).toISOString().split('T')[0];
        }
  
        // query for sewing proficiency dropdown
        knex('transaction_types')
        .select('transaction_type_id', 'transaction_type') 
        .then(trantypes => {
                knex('budget_date_types')
                .select('budget_date_type_id', 'budget_date_type')
                .then(datetypes => {
                    res.render('editBudget', { budget, trantypes, datetypes});
                })
                .catch(error => {
                    console.error('Error fetching budget date types: ', error);
                    res.status(500).send('Internal Server Error');
                });
            })
            .catch(error => {
                console.error('Error fetching transaction types: ', error);
                res.status(500).send('Internal Server Error');
            });
    })
    .catch(error => {
        console.error('Error fetching budget: ', error);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/editBudget/:id', (req, res) => {
    const id = req.params.id;
  
    const transaction_type_id = req.body.transaction_type_id; // Access each value directly from req.body
    const budget_date = req.body.budget_date;
    const budget_date_type_id = req.body.budget_date_type_id;
    const budget_amount = req.body.budget_amount; 
    // const formData = req.body;
    // console.log(formData);
    // console.log(formData);       // For demonstration, log the submitted data
    console.log('Request body:', req.body);
  
    knex('budgets')
        .where('budget_id', id)
        .update({
            transaction_type_id: transaction_type_id,
            budget_date: budget_date, 
            budget_date_type_id: budget_date_type_id,
            budget_amount: budget_amount
        })
        .then(() => {
            console.log('Form submitted successfully!');
            console.log('Request body:', req.body);
            res.redirect('/budgets'); 
        })
  
        .catch(error => {
            console.error('Error adding a volunteer:', error);
            console.log('Request body:', req.body);
            res.status(500).send('Internal Server Error');
  
        });
});

app.get("/budgets", (req, res) =>
        {
            knex('budgets')
            .join('transaction_types', 'transaction_types.transaction_type_id', '=', 'budgets.transaction_type_id')
            .join('budget_date_types', 'budget_date_types.budget_date_type_id', '=', 'budgets.budget_date_type_id')
            .select('budgets.budget_id', 
                    'budgets.user_id', 
                    'transaction_types.transaction_type',
                    'budgets.budget_date',
                    'budget_date_types.budget_date_type',
                    'budgets.budget_amount'
            )
            .where({'user_id': req.session.user.user_id})
            .orderBy('budgets.budget_date', 'desc')
            .then( budgets => {
                res.render("budgets", {budgets: budgets, user: req.session.user});
                // console.log(budgets);
            }).catch(err => {
                console.log(err);
                res.status(500).json({err});
            });
        });
    

app.get("/transactions", (req, res) => {
    knex('transactions')
            .join('transaction_types', 'transaction_types.transaction_type_id', '=', 'transactions.transaction_type_id')
            .join('accounts', 'accounts.account_id', '=', 'transactions.account_id')
            .select(
                    'transactions.transaction_id',
                    'transactions.user_id',
                    'transactions.transaction_date',
                    'transactions.transaction_amount',
                    'accounts.account_name',
                    'transaction_types.transaction_type'
                )
    .where({'user_id': req.session.user.user_id})
    .orderBy('transaction_date', 'desc')
    .then(transaction => {
        res.render("transactions", { transaction: transaction, user: req.session.user });
    }).catch(err => {
        console.log(err);
        res.status(500).json({ err });
    });
});



app.get('/addTransaction/:user_id', (req, res) => {
        const user_id = req.params.user_id; // Fetch user_id from URL parameters
       
        // Fetch all necessary data in parallel using Promise.all
        Promise.all([
            knex('transactions')
                .select(
                    'transaction_id',
                    'user_id',
                    'transaction_date',
                    'transaction_amount',
                    'account_id',
                    'transaction_type_id'
                )
                .where('user_id', user_id),
            knex('accounts')
                .select('account_id', 'account_name', 'account_type'),
            knex('transaction_types')
                .select('transaction_type_id', 'transaction_type')
        ])
            .then(([transactions, accounts, transaction_types]) => {
                // Render the view with all the fetched data
                res.render('addTransaction', { transactions, accounts, transaction_types, user_id });
            })
            .catch(err => {
                console.error('Error fetching data:', err.message);
                res.status(500).send('Failed to load data for the transaction form.');
            });
    });
    


app.post('/addTransaction', (req, res) => {
    // Access form data sent via POST
    const date = req.body.transaction_date;  // Date of the transaction
    const amount = parseInt(req.body.amount);  // Amount of the transaction
    const account = parseInt(req.body.account);  // Account ID selected in the form
    const transaction_type = parseInt(req.body.transaction_type);  // Transaction Type ID selected in the form
    const user_id = parseInt(req.body.user_id);  // User ID (hidden field)

    console.log('Request body:', req.body);  // To check if the IDs are coming through correctly
    
    // Insert the data into the 'transactions' table
    knex('transactions')
        .insert({
            transaction_date: date,
            transaction_amount: amount, 
            account_id: account,  // Insert the account ID
            transaction_type_id: transaction_type,  // Insert the transaction type ID
            user_id: user_id  // Insert the user ID
        })
        .then(() => {
            console.log('Form submitted successfully!');
            res.redirect('/transactions'); 
        })
        .catch(error => {
            console.error('Error adding the transaction:', error);
            res.status(500).send('Internal Server Error');
        });
});
   
app.get('/editTransaction/:id', (req, res) => {
    const transaction_id = req.params.id;

    Promise.all([
        knex('transactions')
            .select(
                'transaction_id',
                'user_id',
                'transaction_date',
                'transaction_amount',
                'account_id',
                'transaction_type_id'
            )
            .where('transaction_id', transaction_id)
            .first(),
        knex('accounts')
            .select('account_id', 'account_name', 'account_type'),
        knex('transaction_types')
            .select('transaction_type_id', 'transaction_type')
    ])
        .then(([transactions, accounts, transaction_types]) => {
            // Render the view with all the fetched data
            res.render('editTransaction', { transactions, accounts, transaction_types, transaction_id });
        })
        .catch(err => {
            console.error('Error fetching data:', err.message);
            res.status(500).send('Failed to load data for the edit transaction form.');
        });
});

app.post('/editTransaction/:id', (req, res) => {
    const transaction_id = req.params.id; // Get the transaction ID from the URL parameter
    const {
        transaction_date,
        transaction_amount,
        account_id,
        transaction_type_id
    } = req.body; // Extract updated values from the form submission

    // Validate and parse inputs
    const updatedTransaction = {
        transaction_date: transaction_date,
        transaction_amount: isNaN(parseFloat(transaction_amount)) ? null : parseFloat(transaction_amount),
        account_id: isNaN(parseInt(account_id)) ? null : parseInt(account_id),
        transaction_type_id: isNaN(parseInt(transaction_type_id)) ? null : parseInt(transaction_type_id)
    };


    // Check if any required fields are null (optional validation)
    if (!updatedTransaction.transaction_date || !updatedTransaction.transaction_amount || !updatedTransaction.account_id || !updatedTransaction.transaction_type_id) {
        return res.status(400).send('Invalid input. Please ensure all fields are filled correctly.');
    }

    // Update the database
    knex('transactions')
        .where('transaction_id', transaction_id) // Match the record by transaction_id
        .update(updatedTransaction)
        .then(() => {
            console.log('Transaction updated successfully');
            res.redirect('/transactions'); // Redirect back to the transactions page
        })
        .catch((err) => {
            console.error('Error updating transaction:', err.message);
            res.status(500).send('Failed to update the transaction. Please try again.');
        });
});


app.get('/viewBudget/:budget_id', (req, res) => {
    const budget_id = req.params.budget_id; // Fetch user_id from URL parameters
//    console.log(budget_id);
    // Fetch all necessary data in parallel using Promise.all
    Promise.all([
        knex('budgets')
        .join('transaction_types', 'transaction_types.transaction_type_id', '=', 'budgets.transaction_type_id')
        .join('budget_date_types', 'budget_date_types.budget_date_type_id', '=', 'budgets.budget_date_type_id')

            .select(
                'budgets.budget_id',
                'budgets.user_id',
                'transaction_types.transaction_type',
                'budgets.budget_date',
                'budget_date_types.budget_date_type',
                'budgets.budget_amount'
            )
            .where({'budget_id': budget_id}),
    ])
        .then(budgets => {
            // Render the view with all the fetched data
            res.render('viewBudget', { budgets: budgets });
            console.log(budgets);
        })
        .catch(err => {
            console.error('Error fetching data:', err.message);
            res.status(500).send('Failed to load data for the budget form.');
        });
});


app.post('/deleteTransaction/:transaction_id', (req, res) => {
    const transaction_id = req.params.transaction_id;

    knex('transactions')
        .where("transaction_id", transaction_id)
        .del()
        .then(() => {
            console.log(`Transaction: ${transaction_id} removed`);
            res.redirect('/transactions'); // Redirect back to the dashboard after deletion
        })
        .catch(err => {
            console.error('Error deleting transaction:', err);
            res.status(500).send('Error deleting transaction');
        });
}); 

app.post('/deleteBudget/:budget_id', (req, res) => {
    const budget_id = req.params.budget_id;

    knex('budgets')
        .where("budget_id", budget_id)
        .del()
        .then(() => {
            console.log(`Budget: ${budget_id} removed`);
            res.redirect('/budgets'); // Redirect back to the dashboard after deletion
        })
        .catch(err => {
            console.error('Error deleting budget:', err);
            res.status(500).send('Error deleting budget');
        });
}); 

    
app.listen(port, () => console.log('listening'));
