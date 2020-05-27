# CallerID.com Sample Application 
(written with ElectronJS - JavaScript, CSS, HTML)

![Screen Shot](/sample_app_screen_shot.png)

The executable emulates the look and feel of the Example Application shown on the website. The code contains nodeJS UDP functions for capturing Caller ID packets from the LAN. It includes methods for parsing data from call records, displaying Caller ID on multiple lines in a Window, and storing call data. Three small SQLite databases are created in order to show examples of database commands for customer pop-ups and call logging.

## Core Concepts
- UDP Reception
- CallerID.com format parsing of received data
- Logging new calls into Call Log
- Insertion of new Clients
  - Linking lookup number to client record ID
- Client lookup
  - Lookup record ID for captured Caller ID number
  - Using lookup record ID to look up client data
