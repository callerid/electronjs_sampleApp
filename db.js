const sqlite3 = require('sqlite3').verbose();
const events = require('events');

var eventEmitter = new events.EventEmitter();
var call_log_entries = [];

var lookup_eventEmitter = new events.EventEmitter();
var all_lookups = [];

var client_eventEmitter = new events.EventEmitter();
var all_clients = [];

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
    open_database();

    database.run("CREATE TABLE IF NOT EXISTS call_log (id INTEGER PRIMARY KEY NOT NULL, " + 
    "line CHAR(2), io CHAR(1), se CHAR(1), dur CHAR(4), cs CHAR(1), rings CHAR(3), call_date CHAR(30), " +
    "call_time CHAR(30), number CHAR(15), name CHAR(15));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created call log table in SQLite database.");

    });

    close_database();

}

function insert_call(ln, io, se, dur, cs, rings, date, time, number, name)
{
    open_database();

    database.run("INSERT INTO call_log (line, io, se, dur, cs, rings, call_date, call_time, number, name) " +
    " VALUES (?,?,?,?,?,?,?,?,?,?);", [ln, io, se, dur, cs, rings, date, time, number, name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + name + " into call log table.");

    });

    close_database();
}

function get_full_call_log()
{
    open_database();
    
    database.all("SELECT * FROM call_log ORDER BY id DESC;", [], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Full Call Log...");

        if(rows.length < 1) {
            console.log("Call Log empty.");
            return null;
        }
        
        console.log("Call Log found and populated; returning...");
        
        call_log_entries = [];
        for(var i = 0; i < rows.length; i++)
        {
            call_log_entries.push(rows[i]);
        }

        var temp = [];

        for(var i = 0; i < call_log_entries.length; i++)
        {
            temp.push(Object.values(call_log_entries[i]));
        }

        call_log_entries = temp;

        eventEmitter.emit('call_log_load', call_log_entries);

    });

    close_database();
}

// --------------------------------------------------------------
// Lookup Table
// --------------------------------------------------------------
function create_lookup_table()
{
    open_database();

    database.run("CREATE TABLE IF NOT EXISTS lookups (id INTEGER PRIMARY KEY NOT NULL, " + 
    "client_record_id INTEGER(10), lookup_number CHAR(20));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created lookup table in SQLite database.");

    });

    close_database();

}

function insert_lookup(record_id, lookup_number)
{
    open_database();

    database.run("INSERT INTO lookups (client_record_id, lookup_number) VALUES (?, " +
    "?);", [record_id, lookup_number], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + lookup_number + " into lookups table.");

    });

    close_database();
}

function remove_lookup(record_id, lookup_number)
{
    open_database();

    database.run("DELETE FROM lookups WHERE client_record_id = ? AND lookup_number = ?;)",
                    [record_id, lookup_number], (err) => {

        if(err) return console.error("SQL (deletion) ERROR " + err.message);

        console.log("Deleted " + lookup_number + " from lookups table.");

        get_all_lookups_for_client_record_id(record_id);

    });

    close_database();
}

function lookup(lookup_number)
{
    open_database();
    
    database.all("SELECT * FROM lookups WHERE lookup_number = ?;", [lookup_number], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Record ID from lookups...");

        if(rows.length < 1) {
            console.log("No lookups.");
            lookup_eventEmitter.emit('lookup_failed', lookup_number);
            return null;
        }
        
        console.log("Lookup number found; returning...");
        
        var record_id = Object.values(rows[0]);

        if(record_id.length < 1) 
        {
            lookup_eventEmitter.emit('lookup_failed', lookup_number);
            return null;
        }

        record_id = record_id[1];
        lookup_eventEmitter.emit('lookup_found', [record_id]);

    });

    close_database();
}

function get_all_lookups_for_client_record_id(client_record_id)
{
    open_database();
    
    database.all("SELECT * FROM lookups WHERE client_record_id = ?;", [client_record_id], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving all lookups...");

        if(rows.length < 1) {
            console.log("No Lookups.");
            return null;
        }
        
        console.log("Lookups found and populated; returning...");
        
        all_lookups = [];
        for(var i = 0; i < rows.length; i++)
        {
            all_lookups.push(rows[i]);
        }

        var temp = [];

        for(var i = 0; i < all_lookups.length; i++)
        {
            var cols = Object.values(all_lookups[i]);
            temp.push(cols[2]);
        }

        all_lookups = temp;

        lookup_eventEmitter.emit('all_lookup_load', all_lookups);

    });

    close_database();
}

// --------------------------------------------------------------
// Clients Database
// --------------------------------------------------------------
function create_client_table()
{
    open_database();

    database.run("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY NOT NULL, lookup_number CHAR(20), company_name CHAR(200), callerid_name CHAR(200));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created clients table in clients SQLite database.");

    });

    close_database();

}

function insert_client(company_name, lookup_number, callerid_name)
{
    open_database();

    database.run("INSERT INTO clients (lookup_number, company_name, callerid_name) VALUES (?, " +
    "?,?);", [lookup_number, company_name, callerid_name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + company_name + " into clients table.");

    });

    close_database();
}

function get_all_clients()
{
    open_database();
    
    database.all("SELECT * FROM clients;", [], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Full Client table...");

        if(rows.length < 1) {
            console.log("Client table empty.");
            return null;
        }
        
        console.log("Client table found and populated; returning...");
        
        all_clients = [];
        for(var i = 0; i < rows.length; i++)
        {
            all_clients.push(rows[i]);
        }

        var temp = [];

        for(var i = 0; i < all_clients.length; i++)
        {
            var cols = Object.values(all_clients[i]);
            temp.push(cols[2]);
        }

        all_clients = temp;

        client_eventEmitter.emit('all_clients_loaded', all_clients);

    });

    close_database();
}

function get_company_name_from_client_record_id(client_record_id)
{
    open_database();

    database.all("SELECT * FROM clients WHERE id = ?;", [client_record_id], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Data...");

        if(rows.length < 1) {
            console.log(client_record_id + " - ID NOT found in clients database.");
            return null;
        }
        
        console.log("Data retrieved for client ID: " + client_record_id);
        var company_name = Object.values(rows[0])[2];

        client_eventEmitter.emit('company_name_loaded', company_name);

      });

      close_database();
}

function get_callerid_number_from_client_record_id(client_record_id)
{
    open_database();

    database.all("SELECT * FROM clients WHERE id = ?;", [client_record_id], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Data...");

        if(rows.length < 1) {
            console.log(client_record_id + " - ID NOT found in clients database.");
            return null;
        }
        
        console.log("Data retrieved for client ID: " + client_record_id);
        var number = Object.values(rows[0])[1];

        client_eventEmitter.emit('client_callerid_number_loaded', number);

      });

      close_database();
}

function get_callerid_name_from_client_record_id(client_record_id)
{
    open_database();

    database.all("SELECT * FROM clients WHERE id = ?;", [client_record_id], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Data...");

        if(rows.length < 1) {
            console.log(client_record_id + " - ID NOT found in clients database.");
            return null;
        }
        
        console.log("Data retrieved for client ID: " + client_record_id);
        var name = Object.values(rows[0])[3];

        client_eventEmitter.emit('client_callerid_name_loaded', name);

      });

      close_database();
}

create_log_table();
create_client_table();
create_lookup_table();

// Windows
var win_client_info;
var win_add_or_link;
function open_client_window(lookup_number)
{

    if(lookup_number.length < 1) return;

    lookup_eventEmitter.on('lookup_found', function(client_record_id){

        if(client_record_id.length < 1) return;

        const electron = require('electron');
        const BrowserWindow = electron.remote.BrowserWindow;

        if(win_client_info != null)
        {
            win_client_info.close();
        }

        win_client_info = new BrowserWindow({
            width: 800,
            height: 465,
            webPreferences: {
                nodeIntegration: true
            }
        });

        win_client_info.on("close", () => {
            win_client_info = null;
        });

        // and load the index.html of the app.
        win_client_info.loadFile('frmClientInfo.html');
        win_client_info.removeMenu();
        
        // Uncomment below for JS debugging
        //win_client_info.webContents.openDevTools();

        // Send record ID to other window
        var id = client_record_id[0];
        win_client_info.webContents.executeJavaScript("set_client_record_id('" + id + "')");

    });

    lookup_eventEmitter.on('lookup_failed', function(lookup_number){

        const electron = require('electron');
        const BrowserWindow = electron.remote.BrowserWindow;

        if(win_add_or_link != null)
        {
            win_add_or_link.close();
        }

        win_add_or_link = new BrowserWindow({
            width: 800,
            height: 235,
            webPreferences: {
                nodeIntegration: true
            }
        });

        win_add_or_link.on("close", () => {
            win_add_or_link = null;
        });

        // and load the index.html of the app.
        win_add_or_link.loadFile('frmAddOrLink.html');
        win_add_or_link.removeMenu();
        
        // Uncomment below for JS debugging
        //win_add_or_link.webContents.openDevTools();

        // Add lookup number to new window
        win_add_or_link.webContents.executeJavaScript("insert_lookup_number('" + lookup_number + "')");

    });

    lookup(lookup_number);

}