const sqlite3 = require('sqlite3').verbose();

// --------------------------------------------------------------
// Database creation/closure
// --------------------------------------------------------------
var database;
function open_database()
{
    database = new sqlite3.Database("./database.db3", (err) => {
    
        if (err) 
        {
          return console.error("SQL (connect) ERROR: " + err.message);
        }
    
        console.log('Connected to the SQlite database.');
      
    });
}

function close_database()
{
    database.close((err) => {

        if (err) 
        {
            return console.error("SQL (disconnect) ERROR: " + err.message);
        }

        console.log('Close the database connection.');

    });
}

// --------------------------------------------------------------
// Call Log Table
// --------------------------------------------------------------
function create_log_table()
{
    database.run("CREATE TABLE IF NOT EXISTS call_log (id INTEGER PRIMARY KEY NOT NULL, " + 
    "line CHAR(2), io CHAR(1), se CHAR(1), dur CHAR(4), cs CHAR(1), rings CHAR(3), call_date CHAR(30), " +
    "call_time CHAR(30), number CHAR(15), name CHAR(15));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created call log table in SQLite database.");

    });

}

function insert_call(ln, io, se, dur, cs, rings, date, time, number, name)
{
    database.run("INSERT INTO call_log (ln, io, se, dur, cs, rings, call_date, call_time, number, name) " +
    " VALUES (?,?,?,?,?,?,?,?,?,?);", [ln, io, se, dur, cs, rings, date, time, number, name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + name + " into call log table.");

    });
}

function get_full_call_log()
{
    database.all("SELECT * FROM call_log;", [], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Full Call Log...");

        if(rows.length < 1) {
            console.log("Call Log empty.");
            return null;
        }
        
        console.log("Call Log found and populated; returning...");
        return rows;

      });
}

// --------------------------------------------------------------
// Clients Database
// --------------------------------------------------------------
function create_client_table()
{
    database.run("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY NOT NULL, lookup_number CHAR(20), company_name CHAR(200), callerid_name CHAR(200));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created clients table in clients SQLite database.");

    });

}

function insert_client(company_name, lookup_number, callerid_name)
{
    database.run("INSERT INTO clients (lookup_number, company_name, callerid_name) VALUES (?, " +
    "?,?);", [lookup_number, company_name, callerid_name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + company_name + " into clients table.");

    });
}

function get_client_from_number(lookup_number)
{
    database.all("SELECT * FROM clients WHERE lookup_number = ?;", [lookup_number], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Data...");

        if(rows.length < 1) {
            console.log(lookup_number + " NOT found in clients database.");
            return null;
        }
        
        console.log("Data retrieved for : " + lookup_number);
        return rows[0];

      });
}

// Establish connection to SQLite database
open_database();

create_log_table();
create_client_table();

insert_client("CallerID Company", "770-263-7111", "CallerID.com");
get_client_from_number("770-263-7111");