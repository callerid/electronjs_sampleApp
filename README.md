# CallerID.com Sample Application 
(written with ElectronJS - JavaScript, CSS, HTML)

The executable emulates the look and feel of the Example Application shown on the website. The code contains nodeJS UDP functions for capturing Caller ID packets from the LAN. It includes methods for parsing data from call records, displaying Caller ID on multiple lines in a Window, and storing call data. Three small SQLite databases are created in order to show examples of database commands for customer pop-ups and call logging.

![Screen Shot](/sample_app_screen_shot.png)

## Core Concepts
### UDP Reception
During the VoIP SIP call flow or an analog Caller ID signal on the line, the CallerID.com Vertex or Whozz Calling unit, respectively, will generate the same Call Record sequence which is picked up in the on('message') event located in the 'bind' function [here](https://github.com/callerid/electronjs_sampleApp/blob/de0b25adf82e17dfd14de50511bd98cd33ad6b21/base.js#L33). It is important to remember you must be bound to UDP port 3520 to pick up the CallerID.com hardware's ethernet output during a call cycle. The entire 'bind' function, linked above, shows how to do this.
  #### Caller ID Output Sequence
  - Ring (when Detailed mode is enabled): Beginning of the sequence
  - Start Record: Provides Caller ID information
  - Off-hook (when Detailed mode is enabled): Call has been answered
  - On-hook (when Detailed mode is enabled): Call has been completed
  - End Record: Provides Caller ID information along with duration of call

### CallerID.com format parsing of received data
[Example of CallerID.com's Data Format](http://callerid.com/support/data-format-basic/)

Parsing the incoming data is easiest when using regular expressions. Below is an example how to do this, along with a needed function to convert the incoming data from bytes to a simple ASCII string (allowing one to use regular expressions).

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
Logging a call into a SQLite database (named, in this case, 'database.db3') takes three steps.
  1. Create Call Log table, if nonexistent
  2. Parse data into fields
  3. Insert into SQLite table
  
An example of how the Call Log could be presented is shown below.

![Screen Shot](/sample_app_screen_shot.png)
  
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
One feature omitted from the example is the Popups feature. This feature would be to popup a new window when a call comes in and display it top-most on the screen, pulling the Company name or Contact name and displaying it with the Caller ID number instead of the Caller ID name. This allows you to remain something like "WIRELESS CALLER" to "John Smith" or "CallerID.com". This simplifies the presentation of Caller ID info.

Also, when using popups, one could add a button to the popup window which pulls up the client record and displays it for the user in the Client Information window. This makes it easy on the user: the call comes in and displays the Caller ID popup, with custom names, and the user only has to click the 'Lookup' button on the popup to see all the client's info. This is convenient for the user as they could be working on something else, see the popup and, without opening the full application, get to the clients information.
