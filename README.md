# CallerID.com Sample Application 
(written with ElectronJS - NodeJS, JavaScript, CSS, HTML)

The executable emulates the look and feel of the Example Application shown on the website. The code contains NodeJS UDP functions for capturing Caller ID packets from the LAN. It includes methods for parsing data from call records, displaying Caller ID on multiple lines in a Window, and storing call data. Three small SQLite databases are created in order to show examples of database commands for customer information, number lookups and call logging.

![Screen Shot](/sample_app_screen_shot.png)

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
When linking/using Caller ID numbers to lookup a record it is best to use a separate SQLite table solely for lookups. This lookup table should contain a link/reference to a client record ID and the associated Caller ID number. This method is preferred as it allows you to store multiple Caller ID numbers for a single client which is important for clients that have more than one number they can call from.

In this Sample Application, the Rolodex icon, turns pink when a call comes in that has no entry in the lookups table for the current Caller ID number. When clicking the pink Rolodex, a new window appears which allows you to either create a new client or link to a previous client. Creating a new link inserts a row into the lookup table containing the client record ID and the Caller ID number (lookup number) and creating a new client creates an empty client in a separate table called the clients table. The record ID for the client just created is this used to add the link in the lookup's table.

When a call comes in that has already been linked, the Rolodex icon turns green and when clicked, simply pulls up the record linked to the Caller ID number. To do this lookup there are three steps:
  1. Check lookups database for Caller ID number and get the client record ID.
  2. Use the client record ID to pull up the client's information
  3. Present the information in the frmClientInfo.html window.
  
### Clients Database Table
The clients table is used to store any and all information you desire, example: Contact Name, Contact Email, Company Name, etc. This information is pulled when displaying the frmClientInfo.html window.

## Extending the Sample Application
One feature omitted from the example is the Popups feature. This feature would be to popup a new window when a call comes in and display it top-most on the screen, pulling the Company name or Contact name and displaying it with the Caller ID number instead of the Caller ID name. This allows you to rename something like "WIRELESS CALLER" to "John Smith" or "CallerID.com". This simplifies the presentation of Caller ID info.

Also, when using popups, one could add a button to the popup window which pulls up the client record and displays it for the user in the Client Information window. This makes it easy on the user: the call comes in and displays the Caller ID popup, with custom names, and the user only has to click the 'Lookup' button on the popup to see all the client's info. This is convenient for the user as they could be working on something else, see the popup and, without opening the full application, get to the clients information.

Other features could be added to the Call Log like: searching for numbers, names, displaying only calls within a date range, or displaying only inbound or outbound calls.
