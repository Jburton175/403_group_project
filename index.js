// Run this command in the reminal to commit to github
// git commit --allow-empty -m ""

let express = require("express");

let app = express();

let path = require("path");

let security = false;

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



app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        // Query the user table to find the record
        const user = knex('user')
            .select('*')
            .where({ username, password }) // Replace with hashed password comparison in production
            .first(); // Returns the first matching record
        if (user) {
            security = true;
        } else {
            security = false;
        }
    } catch (error) {
        res.status(500).send('Database query failed: ' + error.message);
    }
    res.redirect("/")
});


app.get("/", (req, res) =>
    {
        res.render('index', { security });
    });
    // .catch(error => {
    //   console.error('Error querying database:', error);
    //   res.status(500).send('Internal Server Error');
    // });
    


app.get("/home", (req, res) =>
    {
        res.render("home", { security });
        
    });

app.get("/budgets", (req, res) =>
    {
        res.render("budget", { security });
        
    });

app.get("/transactions", (req, res) =>
    {
        knex.select().from('transactions').orderBy('transaction_id').then( transactions => {
            res.render("transactions", { transaction: transactions, security });
        }).catch(err => {
            console.log(err);
            res.status(500).json({err});
        });
    });

    
app.listen(port, () => console.log('listening'));
