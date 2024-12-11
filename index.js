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
        database: process.env.RDS_DB_NAME || "budget_tracker",
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
app.get("/budgets", (req, res) =>
    {
        knex('transaction_types')
        .select()
        .then(trantypes => {

            knex('budget_date_types')
            .select()
            .then(datetypes => {

                res.render("budget", { security, trantypes, datetypes });

            })
        })
        
    });

app.get("/transactions", (req, res) =>
    {
        knex.select()
        .from('transactions')
        .where('user_id' === req.session.user.user_id)
        .orderBy('transaction_id')
        .then( transactions => {
            res.render("transactions", {transaction: transactions });
        }).catch(err => {
            console.log(err);
            res.status(500).json({err});
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



    
app.listen(port, () => console.log('listening'));
