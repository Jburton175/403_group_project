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


const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "admin",
        database: process.env.RDS_DB_NAME || "TurtleShelter",
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
    console.log(req.session.user);
    console.log(excludedRoutes);
    console.log(req.path);

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

    console.log(req.body.username);
    console.log(req.body.password);

    knex('users')
        .select('user_id')
        .where("username", username)
        .where("userpass", password)
        .first() // Returns the first matching record
        .then(user => {
            if (user) {
                req.session.user = user; // Save volunteer to session
                console.log('User logged in:', req.session.user);
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
app.get("/createBudget", (req, res) =>
    {
        knex('transaction_types')
        .select()
        .then(trantypes => {

            knex('budget_date_types')
            .select()
            .then(datetypes => {

                res.render("createBudget", { security, trantypes, datetypes });

            })
        })
        
});

app.post('/createBudget', (req, res) => {
    
    const transaction_type_id = req.body.transaction_type_id; // Access each value directly from req.body
    const budget_date = req.body.budget_date;
    const budget_date_type_id = req.body.budget_date_type_id;
    const budget_amount = req.body.budget_amount;


    knex('budgets').insert({
        transaction_type_id: transaction_type_id,
        budget_date: budget_date,
        budget_date_type_id: budget_date_type_id,
        budget_amount: budget_amount,
    }).then(budget => {
        res.redirect("/home");
    }).catch( err => {
        console.log(err);
        res.status(500).json({err});
    });
});

app.get('/editBudget/:id', (req, res) => {
    let id = req.params.budget_id
    
    knex('budgets')
    .where('budget_id', id)
    .first()
    .then(budget => {
        if (!budget) {
            return res.status(404).send('Volunteer not found');
        }
  
        // query for sewing proficiency dropdown
        knex('transaction_types')
        .select('transaction_type_id', 'transaction_type') 
        .then(trantypes => {
                            // Render the EJS template with all data
                            res.render('editBudget', { budget, trantypes});
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
            res.redirect('/home'); 
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
            .where('budgets.user_id' === req.session.user.user_id)
            .orderBy('budgets.budget_date', desc)
            .then( transactions => {
                res.render("budget", {transaction: transactions });
            }).catch(err => {
                console.log(err);
                res.status(500).json({err});
            });
        });
    

app.get("/transactions", (req, res) =>
    {
        knex.select('transaction_id',
            	'user_id',
            	'transaction_date',
            	'transaction_amount',	
                'account_id',
                'transaction_type_id'
        )
        .from('transactions')
        .where({'user_id': req.session.user.user_id})
        .orderBy('transaction_id')
        .then( transactions => {
            res.render("transactions", {transaction: transactions });
        }).catch(err => {
            console.log(err);
            res.status(500).json({err});
        });
    });


app.get('/addTransaction/:user_id', (req, res) => {
    const user_id = req.params.user_id
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
    const date = req.body.transaction_date;  // Access form data sent via POST
    const amount = parseInt(req.body.amount);  
    const account = parseInt(req.body.account);  
    const transaction_type = parseInt(req.body.transaction_type);  
    const user_id = parseInt(req.body.user_id);

    console.log('Request body:', req.body);
  
    knex('transactions')
        .insert({
            transaction_date: date,
            transaction_amount: amount, 
            account_id: account,
            transaction_type_id: transaction_type,
            user_id: user_id
            
        })
        .then(() => {
            console.log('Form submitted successfully!');
            console.log('Request body:', req.body);
            res.redirect('/transactions'); 
        })
  
        .catch(error => {
            console.error('Error adding the transaction:', error);
            console.log('Request body:', req.body);
            res.status(500).send('Internal Server Error');

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
            res.redirect('/budget'); // Redirect back to the dashboard after deletion
        })
        .catch(err => {
            console.error('Error deleting budget:', err);
            res.status(500).send('Error deleting budget');
        });
}); 

    
app.listen(port, () => console.log('listening'));
