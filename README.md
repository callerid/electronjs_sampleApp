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
  
All database commands can be found in the [db.js](https://github.com/callerid/electronjs_sampleApp/blob/master/db.js) file located in project root.

### Insertion of new Clients
  #### Linking lookup number to client record ID
  
### Client lookup
  #### Lookup record ID for captured Caller ID number
  #### Using lookup record ID to look up client data
