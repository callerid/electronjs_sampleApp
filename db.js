const sqlite3 = require('sqlite3').verbose();
const events = require('events');
const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;

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

function lookup(lookup_number, lookup_name, line_number)
{
    open_database();
    
    database.all("SELECT * FROM lookups WHERE lookup_number = ?;", [lookup_number], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Record ID from lookups...");

        if(rows.length < 1) {
            console.log("No lookups.");
            lookup_eventEmitter.emit('lookup_failed', lookup_number, lookup_name, line_number);
            return null;
        }
        
        console.log("Lookup number found; returning...");
        
        var record_id = Object.values(rows[0])[1];

        record_id = record_id;
        lookup_eventEmitter.emit('lookup_found', record_id, line_number);

    });

    close_database();
}

function lookup_number_in_lookup_table(lookup_number, line_number)
{

    if(!is_phone_number(lookup_number))
    {
        lookup_eventEmitter.emit('set_rolodex_idle', line_number);
        return;
    }

    open_database();
    
    database.all("SELECT * FROM lookups WHERE lookup_number = ?;", [lookup_number.trim()], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Record ID from lookups...");

        if(rows.length < 1) {
            console.log("No lookups.");
            lookup_eventEmitter.emit('set_rolodex_pink', line_number);
            return null;
        }
        
        console.log("Lookup number found; returning...");
        
        var record_id = Object.values(rows[0]);

        if(record_id.length < 1) 
        {
            lookup_eventEmitter.emit('set_rolodex_pink', line_number);
            return null;
        }

        record_id = record_id[1];
        lookup_eventEmitter.emit('set_rolodex_green', line_number);

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
            lookup_eventEmitter.emit('all_lookup_load', []);
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

    database.run("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY NOT NULL, lookup_number CHAR(20), company_name CHAR(200), " +
    "callerid_name CHAR(200), address CHAR(100), city CHAR(80), state CHAR(2), zip CHAR(20), email CHAR(140), first_name CHAR(100), last_name CHAR(100));",[], (err) =>{

        if(err) return console.error("SQL (create table) ERROR " + err.message);

        console.log("Created clients table in clients SQLite database.");

    });

    close_database();

}

function insert_client(company_name, lookup_number, callerid_name, address, city, state, zip, email, first_name, last_name, line_number)
{
    open_database();

    database.run("INSERT INTO clients (lookup_number, company_name, callerid_name, address, city, state, zip, email, first_name, last_name) VALUES (?, " +
    "?,?,?,?,?,?,?,?,?);", [lookup_number, company_name, callerid_name, address, city, state, zip, email, first_name, last_name], (err) => {

        if(err) return console.error("SQL (insertion) ERROR " + err.message);

        console.log("Inserted " + company_name + " into clients table.");
        console.log("Returning inserted ID.");

        database.all("SELECT * FROM clients ORDER BY id DESC;", [], (err, rows) => {
        
            if (err) {
              throw err;
            }
    
            console.log("Retrieving Data...");
    
            if(rows.length < 1) {
                console.log("Error, inserted row wasn't made.");
                return null;
            }
            
            var new_record_id = Object.values(rows[0])[0];
    
            client_eventEmitter.emit('inserted_new_client', new_record_id, lookup_number, line_number);
    
          });

    });

    close_database();
}

function update_client(client_record_id, company_name, lookup_number, callerid_name, address, city, state, zip, email, first_name, last_name)
{
    open_database();

    database.run("UPDATE clients SET lookup_number = ?, company_name = ?, callerid_name = ?, address = ?," +
                " city = ?, state = ?, zip = ?, email = ?, first_name = ?, last_name = ? WHERE id = ?;", 
                [lookup_number, company_name, callerid_name, address, city, state, 
                zip, email, first_name, last_name, client_record_id], (err) => {

        if(err) return console.error("SQL (update) ERROR " + err.message);

        console.log("Updated " + company_name + " in clients table.");

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
            temp.push(cols[2]); // Company Name
            temp.push(cols[9] + " " + cols[10]);
        }

        all_clients = temp;

        client_eventEmitter.emit('all_clients_loaded', all_clients);

    });

    close_database();
}

function get_company_name_from_client_record_id(client_record_id)
{
    // Example of getting one field from database

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
    // Example of getting one field from database

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
    // Example of getting one field from database

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

function get_address_from_client_record_id(client_record_id)
{
    // Example of getting multiple fields from database

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
        
        var address = Object.values(rows[0])[4];
        var city = Object.values(rows[0])[5];
        var state = Object.values(rows[0])[6];
        var zip = Object.values(rows[0])[7];
        var email = Object.values(rows[0])[8];

        var data = {

            'address' : address,
            'city' : city,
            'state' : state,
            'zip' : zip,
            'email' : email

        };

        client_eventEmitter.emit('client_address_loaded', data);

      });

      close_database();
}

function get_contact_from_client_record_id(client_record_id)
{
    // Example of getting multiple fields from database

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
        
        var first_name = Object.values(rows[0])[9];
        var last_name = Object.values(rows[0])[10];

        var data = {

            'first_name' : first_name,
            'last_name' : last_name

        };

        client_eventEmitter.emit('client_contact_loaded', data);

      });

      close_database();
}

function get_record_id_from_company_or_contact_name(company_or_contact, lookup_number, line_number)
{
    // Example of getting multiple fields from database

    open_database();

    database.all("SELECT * FROM clients WHERE company_name = ?;", [company_or_contact], (err, rows) => {
        
        if (err) {
          throw err;
        }

        console.log("Retrieving Data...");

        if(rows.length < 1) {

            console.log(company_or_contact + " - NOT found in Clients table as Company Name. Trying Contact.");

            // This is not the best way to lookup a record (using the contact name)
            // because two companies could have the same contact name. You would need
            // to code for that scenario. For this sample app, we are only coding some
            // example behavoirs. You should code your app to handle errors like this.

            var first_name = company_or_contact.substring(0, company_or_contact.indexOf(" "));
            var last_name = company_or_contact.substring(company_or_contact.indexOf(" ") + 1);

            database.all("SELECT * FROM clients WHERE first_name = ? AND last_name = ?;", [first_name, last_name], (err, rows) => {
        
                if (err) {
                  throw err;
                }
        
                console.log("Retrieving Data...");
        
                if(rows.length < 1) {
                    console.log(company_or_contact + " - NOT found in Clients table as Contact Names. Failed.");
                    alert("Company Name or Contact Name NOT found. Lookup failed.");
                    return null;
                }
                
                console.log(company_or_contact + " found in Clients table.");
                
                var rec_id = Object.values(rows[0])[0];
                client_eventEmitter.emit('client_record_id_loaded', rec_id, lookup_number, line_number);
        
              });

            return null;
        }
        
        console.log(company_or_contact + " found in Clients table.");
        
        var rec_id = Object.values(rows[0])[0];
        client_eventEmitter.emit('client_record_id_loaded', rec_id, lookup_number, line_number);

      });

      close_database();
}

create_log_table();
create_client_table();
create_lookup_table();

// Windows
function open_client_window(lookup_number, lookup_name, line_number)
{
    if(lookup_number.length < 1) return;
    lookup(lookup_number, lookup_name, line_number);
}

// Client Lookup Events
lookup_eventEmitter.on('set_rolodex_pink', (line_number) => {

    $("#imgRolodex" + (parseInt(line_number) + 1).toString()).attr("src", "rolodex_pink.png");

});

lookup_eventEmitter.on('set_rolodex_green', (line_number) => {
    
    $("#imgRolodex" + (parseInt(line_number) + 1).toString()).attr("src", "rolodex_green.png");

});

lookup_eventEmitter.on('set_rolodex_idle', (line_number) => {
    
    $("#imgRolodex" + (parseInt(line_number) + 1).toString()).attr("src", "rolodex.png");

});

lookup_eventEmitter.on('lookup_found', function(client_record_id, line_number){

    remote.getGlobal("sharedObj").frmMain.webContents.executeJavaScript(`open_client_info(${JSON.stringify(client_record_id)}, ${JSON.stringify(line_number)})`);

});

function open_client_info(client_record_id, line_number)
{
    if(remote.getGlobal("sharedObj").frmClientInfo != null)
    {
        // If window already open then close (wait till close) then re-open
        remote.getGlobal("sharedObj").frmClientInfo.close();
        setTimeout(open_client_info, 200, client_record_id, line_number);
        return;
    }

    remote.getGlobal("sharedObj").frmClientInfo = new BrowserWindow({
        width: 800,
        height: 335,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    remote.getGlobal("sharedObj").frmClientInfo.on("closed", () => {
        remote.getGlobal("sharedObj").frmClientInfo = null;
    });

    // and load the index.html of the app.
    remote.getGlobal("sharedObj").frmClientInfo.loadFile('frmClientInfo.html');
    remote.getGlobal("sharedObj").frmClientInfo.removeMenu();
    
    // Uncomment below for JS debugging
    //remote.getGlobal("sharedObj").frmClientInfo.webContents.openDevTools();

    // Send record ID to other window
    var id = client_record_id;
    remote.getGlobal("sharedObj").frmClientInfo.webContents.executeJavaScript(`insert_vars(${JSON.stringify(id)}, ${JSON.stringify(line_number)})`);
}

lookup_eventEmitter.on('lookup_failed', function(lookup_number, lookup_name, line_number){

    remote.getGlobal("sharedObj").frmMain.webContents.executeJavaScript(`open_add_link(${JSON.stringify(lookup_number)}, ${JSON.stringify(lookup_name)}, ${JSON.stringify(line_number)})`);

});

function open_add_link(lookup_number, lookup_name, line_number)
{
    if(remote.getGlobal("sharedObj").frmAddLink != null)
    {
        remote.getGlobal("sharedObj").frmAddLink.close();
        setTimeout(open_add_link, 200, lookup_number, lookup_name, line_number);
        return;
    }

    remote.getGlobal("sharedObj").frmAddLink = new BrowserWindow({
        width: 470,
        height: 280,
        webPreferences: {
            nodeIntegration: true
        }
    });

    remote.getGlobal("sharedObj").frmAddLink.on("close", () => {
        var windows = remote.getGlobal("sharedObj");
        windows.frmAddLink = null;
    });

    // and load the index.html of the app.
    remote.getGlobal("sharedObj").frmAddLink.loadFile('frmAddOrLink.html');
    remote.getGlobal("sharedObj").frmAddLink.removeMenu();
    
    // Uncomment below for JS debugging
    //remote.getGlobal("sharedObj").frmAddLink.webContents.openDevTools();

    // Add lookup number to new window
    remote.getGlobal("sharedObj").frmAddLink.webContents.executeJavaScript(`insert_vars(${JSON.stringify(lookup_number)}, ${JSON.stringify(lookup_name)}, ${JSON.stringify(line_number)})`);
}

client_eventEmitter.on('inserted_new_client', function(new_record_id, lookup_number, line_number){

    // Create lookup link for this new record
    insert_lookup(new_record_id, lookup_number);
    
    // Use lookup emitter which brings up the new client record
    lookup_eventEmitter.emit('lookup_found', new_record_id, line_number);

});

client_eventEmitter.on('client_record_id_loaded', function(record_id, lookup_number, line_number){

    // Use client emitter to insert link and popup client window
    client_eventEmitter.emit('inserted_new_client', record_id, lookup_number, line_number);

});