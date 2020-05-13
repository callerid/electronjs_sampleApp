const sqlite3 = require('sqlite3').verbose();

var clients_db;

function open_clients_database()
{
    clients_db = new sqlite3.Database("./clients.db", (err) => {
    
        if (err) 
        {
          return console.error("SQL (connect) ERROR: " + err.message);
        }
    
        console.log('Connected to the Clients SQlite database.');
      
    });
}

function close_clients_database()
{
    clients_db.close((err) => {

        if (err) 
        {
            return console.error("SQL (disconnect) ERROR: " + err.message);
        }

        console.log('Close the database connection.');

    });
}

function create_client_table()
{
    clients_db.run("CREATE TABLE clients (id int PRIMARY KEY NOT NULL AUTO_INCREMENT, lookup_number varchar(20), company_name varchar(200));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created clients table in clients SQLite database.");

    });

}

function insert_client(company_name, lookup_number)
{
    clients_db.run("INSERT INTO clients (lookup_number, company_name) VALUES ('?', " +
    "'?');", [lookup_number, company_name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + company_name + " into clients table.");

    });
}

function get_client_from_number(lookup_number)
{
    clients_db.all("SELECT * FROM clients WHERE lookup_number = '?';", [lookup_number], (err, rows) => {
        
        if (err) {
          throw err;
        }

        if(rows.length < 1) return null;

        return rows[0];

      });
}

// Establish connection to SQLite database
open_clients_database();