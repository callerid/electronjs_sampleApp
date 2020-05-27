# CallerID.com Sample Application 
(written with ElectronJS - JavaScript, CSS, HTML)

The executable emulates the look and feel of the Example Application shown on the website. The code contains nodeJS UDP functions for capturing Caller ID packets from the LAN. It includes methods for parsing data from call records, displaying Caller ID on multiple lines in a Window, and storing call data. Three small SQLite databases are created in order to show examples of database commands for customer pop-ups and call logging.

![Screen Shot](/sample_app_screen_shot.png)

## Core Concepts
### UDP Reception
During the VoIP SIP call flow or an analog Caller ID signal on the line, the CallerID.com Vertex or Whozz Calling unit, respectively, will generate the same Call Record sequence which is picked up in the on('message) event located in the 'bind' function [here](https://github.com/callerid/electronjs_sampleApp/blob/de0b25adf82e17dfd14de50511bd98cd33ad6b21/base.js#L33). It is important to remember you must be bound to UDP port 3520 to pick up CallerID.com hardware's ethernet output during a call cycle. The entire 'bind' function, linked above, shows how to do this.
  #### Caller ID Out Sequence
  - Ring (when Detailed mode is enabled): Beginning of the sequence
  - Start Record: Provides Caller ID information
  - Off-hook (when Detailed mode is enabled): Call has been answered
  - On-hook (when Detailed mode is enabled): Call has been completed
  - End Record: Provides Caller ID information along with duration of call

### CallerID.com format parsing of received data
### Logging new calls into Call Log
### Insertion of new Clients
  #### Linking lookup number to client record ID
### Client lookup
  #### Lookup record ID for captured Caller ID number
  #### Using lookup record ID to look up client data
