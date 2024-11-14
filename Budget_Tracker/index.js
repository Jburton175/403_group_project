// Run this command in the reminal to commit to github
// git commit --allow-empty -m ""

let express = require("express");

let app = express();

let path = require("path");

const port = 3000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/views'));

app.use(express.urlencoded({extended: true}));

// connect to pg 
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "admin",
        database : "budget_tracker",
        port : 5432
    }
});

app.get("/", (req, res) =>
    {
        res.render("index");
        // console.log(err);
        //     res.status(500).json({err});
    }
);

app.get("/transactions", (req, res) =>
    {
        knex.select().from('transactions').orderBy('transaction_id').then( transactions => {
            res.render("home", { transaction: transactions });
        }).catch(err => {
            console.log(err);
            res.status(500).json({err});
        });
    });

    
app.listen(port, () => console.log('listening'));
