# CallerID.com Sample Application 
(written with ElectronJS - NodeJS, JavaScript, CSS, HTML)

The executable emulates the look and feel of the Example Application shown on the website. The code contains NodeJS UDP functions for capturing Caller ID packets from the LAN. It includes methods for parsing data from call records, displaying Caller ID on multiple lines in a Window, and storing call data. Three small SQLite databases are created in order to show examples of database commands for customer information, number lookups and call logging.

![Screen Shot](/sample_app_screen_shot.png)

## Overview
This Sample application performs the following:

  - Receives and parses data arriving from CallerID.com hardware
  - Displays call records with the associated phone line number
  - Logs call records into a SQLite databse table called 'call_log'
  - Searches for matching Caller ID phone numbers in a Caller ID Lookup table
  - If a match is found, an indication is presented which allows users to “popup” the customer record
  - If no match, an indication is presented which allows users to match an existing customer record or add a new customer
  - Allows users to delete matches within the Caller ID Lookup table.

The application can handle both Inbound and Outbound Calls call records as well as detailed records that can be sent from **Deluxe** and **Vertex** type units. **Basic** units only send Inbound call records. Use of our **Ethernet Emulator** test tool will allow development without requiring hardware.

## Core Concepts
### UDP Reception
You must be bound to UDP port 3520 to capture call records from CallerID.com hardware. Call Records arriving from CallerID.com hardware are captured with the .on(‘message’) event shown below.

The ‘bind’ function attempts to bind to UDP port 3520 and listen for data by setting three events:

  - .on(‘error’) - An error was thrown
  - .on(‘listening’) - Bound correctly and is now listening to incoming UDP packets
  - .on(‘message’) - UDP packet has been received
  
[Click Here to view Bind Function](https://github.com/callerid/electronjs_sampleApp/blob/de0b25adf82e17dfd14de50511bd98cd33ad6b21/base.js#L33)

### CallerID.com format parsing of received data
#### Caller ID Output Sequence
The code allows for all possible call records that can be generated from Whozz Calling? Deluxe units and Vertex units with Detailed mode set on.  Whozz Calling? Basic units only send Inbound Start Records.

  ##### Inbound Call Record Sequence
  - **Ring** - (Detailed mode enabled on Deluxe or Vertex units)
  - **Start of Call** - Line Number, Caller ID Time & Date, Number, and Name
  - **Off-hook** - Call answered (Detailed mode enabled)
  - **On-hook** - Call completed (Detailed mode enabled)
  - **End of Call** -  All “Start of Call” information plus duration of call
 
  ##### Outbound Call Record Sequence (Whozz Calling? Deluxe and Vertex units)

  - **Off-hook** - (Detailed mode enabled)  
  - **Start of Call** - Line Number, Time & Date, and number dialed
  - **On-hook** - Call completed (Detailed mode enabled)
  - **End of Call** -  All “Start of Call” information plus duration of call

#### Sample Application Presentation
When detailed mode is enabled on Deluxe and Vertex hardware, the Sample App presents the full call sequence below. If Whozz Calling? Basic units are deployed, only the Start of Call record will be shown.: 

   - **Ring:** changes appropriate row to pink and starts blinking the Phone icon
   - **Start of Call:** changes row to green for an inbound call or blue for an outbound call 
   - **Off-hook:** Stop blinking Phone icon for inbound call (call has been answered)
   - **On-hook:** return row to idle color
   - **End of Call:** populate the duration of the call in call log

[Example of CallerID.com's Data Format](http://callerid.com/support/data-format-basic/)

Parsing the incoming data is done using regular expressions. A function is used to convert the incoming data from bytes to a simple ASCII string to allow for regular expression parsing. Refer to the example code below.

```
function parse(data_from_message_event)
{
    var message_str = array_to_ascii(data_from_message_event);
    
    var pattern = /.*(\d\d) ([IO]) ([ESB]) (\d{4}) ([GB]) (.\d) (\d\d\/\d\d) (\d\d:\d\d [AP]M) (.{8,15})(.*)/;
    var groups = pattern.exec(message_str);

    if(groups == null) return;

    var line_number = groups[1];
    var inbound_or_output = groups[2];
    var start_or_end = groups[3];
    var duration = groups[4];
    var checksum = groups[5];
    var rings = groups[6];
    var date = groups[7];
    var time = groups[8];
    
    // All data has been easily parsed from CallerID.com's output and put into the variables above
    
}

function array_to_ascii(array)
{
    var str = "";
    array.forEach(function(i){
        str += String.fromCharCode(i);
    });
    return str;
}
```

### Logging new calls into Call Log database
Logging a call into a SQLite database (named 'database.db3') involves creating a Call Log table (if nonexistent), parsing data into fields, and inserting them into the table.
  
An example of a Call Log layout is shown below.

![Screen Shot](/call_log_screen_shot.png)
  
All database commands can be found in the [db.js](https://github.com/callerid/electronjs_sampleApp/blob/master/db.js) file located in project root.

### CallerID.com Lookup Table
When using Caller ID numbers to lookup a record, it is best practice to incorporate a separate SQLite table. Only two fields are required in this lookup table: the Caller ID number and the associated client record ID.  This method allows you to store unlimited Caller ID numbers for a single client without having to add all lookup numbers to the actual customer record.

In the Sample Application, the Rolodex icon turns pink when the Caller ID number does not match an entry in the lookup table. Clicking the pink icon launches a window allowing the user to either create a new customer record, or link to an existing customer. 

If linking, a new entry is added to the lookup table with the 10 digit Caller ID number and the record ID.  When creating a new customer, an empty record is added to the “client” table.  The clients table is used to store all information needed, such as Contact Name, Company Name, Contact Email, etc. (This information is pulled when displaying the frmClientInfo.html window). The record ID and phone number for the customer just created is then added to the lookup table.

When a call arrives with a Caller ID number previously linked to a customer record ID, the Rolodex icon turns green.  Clicking the icon simply pulls up the customer record based on the record ID.

  #### Notes on Caller ID lookup table linking
  - Links in the Lookup table must be unique. Before adding a linking entry row, search the table for an existing occurrence of the Caller ID number.
  - In cases of erroneous links or outdated matches, a mechanism must be incorporated to “unlink” the Caller ID number with the customer ID and “re-link” to the correct customer ID.  This is as easy as removing the incorrect table row and adding a new row. 
  
### Clients Database Table
The clients table is used to store any and all information you desire, example: Contact Name, Contact Email, Company Name, etc. This information is pulled when displaying the frmClientInfo.html window.

## Extending the Sample Application
If a match on the Caller ID number is found in the lookup table, an easily added feature would substitute the Company name (or Customer Name, if no company)  for the Caller ID name. This would help users identify frequent customers quicker, and perhaps, a customer calling back immediately.

Other features could be added to the Call Log like: searching for numbers, names, displaying only calls within a date range, or displaying only inbound or outbound calls.
