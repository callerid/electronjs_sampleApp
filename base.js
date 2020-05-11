// -------------- 
// UDP
// --------------
const dgram = require('dgram');
const os = require('os');
const app = require('electron').remote.app;

var pjson = require('./package.json');
const app_version = pjson.version;

var server3520;

const HOST = '0.0.0.0';
var bound3520 = false;
var last_detailed_record_reception = "";
var last_call_record_reception = "";

var outputs = [
    ["imgLine1", "lbLine1", "lbTime1", "lbCallerIDNumber1", "lbCallerIDName1", "imgRolodex1", "panLine1"],
    ["imgLine2", "lbLine2", "lbTime2", "lbCallerIDNumber2", "lbCallerIDName2", "imgRolodex2", "panLine2"],
    ["imgLine3", "lbLine3", "lbTime3", "lbCallerIDNumber3", "lbCallerIDName3", "imgRolodex3", "panLine3"],
    ["imgLine4", "lbLine4", "lbTime4", "lbCallerIDNumber4", "lbCallerIDName4", "imgRolodex4", "panLine4"],
];

var o_img_line = 0;
var o_line = 1;
var o_time = 2;
var o_callerid_num = 3;
var o_callerid_name = 4;
var o_img_rolodex = 5;
var o_pan = 6;

function bind()
{
    
    if(!bound3520)
    {
        server3520 = dgram.createSocket({type:"udp4", reuseAddr:true});
        server3520.bind(3520, HOST);

        server3520.on('error', function(error){

            console.log('3520 failed to bind.');
            $("#lbBindStatus").text("UDP port 3520 bind FAILED. Close any programs using Caller ID.");
            $("#lbBindStatus").attr("style", "float:left;font-size:small;font-weight: bold;color:red;");
            bound3520 = false;
        
        });
        
        server3520.on('listening', function() {
        
            bound3520 = true;
            server3520.setBroadcast(true);
            var address = server3520.address();
            console.log('UDP Server listening on ' + address.address + ':' + address.port);
            $("#lbBindStatus").text("UDP port 3520 bind success.");
            $("#lbBindStatus").attr("style", "float:left;font-size:small;font-weight: bold;");
        
        });
        
        server3520.on('message', function(message, remote) {
        
            check_for_call_record(message);
        
        });

    }
    
}

function check_for_call_record(message)
{
    // Detailed call record
    if(message.length == 52 || message.length == 53)
    {
        var message_str = array_to_ascii(message);

        var pattern = /(\d{1,2}) V/;

        var results = pattern.exec(message_str);
        
        if(results != null) return;

        message_str = message_str.substr(21, message_str.length - 21);

        // Reset duplicate filtering after max wait time
        setTimeout(function(){
            last_detailed_record_reception = "";
        }, 500);

        // Ignore dups (always - for detailed)
        if(last_detailed_record_reception == message_str)
        {
            return;
        }

        last_detailed_record_reception = message_str;

        var pattern = /.*(\d\d) ([NFR]) {13}(\d\d\/\d\d) (\d\d:\d\d:\d\d)/;
        var groups = pattern.exec(message_str);

        if(groups == null) return;

        var ln = groups[1];
        var type = groups[2];
        var date = groups[3];
        var time = groups[4];

        var hours = time.substr(0, time.indexOf(":"));
        var hrs = parseInt(hours);
        var am_pm = "AM";
        if(hrs > 12) 
        {
            am_pm = "PM";
            hrs -= 12;
        }

        time = hrs + ":" + time.substr(time.indexOf(":") + 1) + " " + am_pm;

        var line = parseInt(ln) - 1;

        switch(type)
        {
            case "R":

                call_ring(line);

            break;

            case "F":

                call_off_hook(line, time + " " + date)

            break;

            case "N":

                call_on_hook(line, time + " " + date);

            break;
        }

    }
    
    // Full call record
    if(message.length == 83 || message.length == 84)
    {
        // UDP is a call record
        var message_str = array_to_ascii(message);
        message_str = message_str.substr(21, message_str.length - 21);

        // Reset duplicate filtering after max wait time
        setTimeout(function(){
            last_call_record_reception = "";
        }, 1100);
        
        // Do not process duplicates
        if(last_call_record_reception == message_str)
        {
            return;
        }
                
        last_call_record_reception = message_str;

        var pattern = /.*(\d\d) ([IO]) ([ESB]) (\d{4}) ([GB]) (.\d) (\d\d\/\d\d) (\d\d:\d\d [AP]M) (.{8,15})(.*)/;
        var groups = pattern.exec(message_str);

        if(groups == null) return;

        var ln = groups[1];
        var io = groups[2];
        var se = groups[3];
        var dur = groups[4];
        var cs = groups[5];
        var rings = groups[6];
        var date = groups[7];
        var time = groups[8];

        var hours = time.substr(0, time.indexOf(":"));
        var hrs = parseInt(hours);
        time = hrs + ":" + time.substr(time.indexOf(":") + 1);

        var num = groups[9].padEnd(14, "&nbsp;");
        var name = groups[10].padEnd(15, "&nbsp;");
        
        var line = parseInt(ln) - 1;

        if(se == "S")
        {
            call_start(line, time + "<br/>" + date, num, name, io);
        }
        else if(se == "E")
        {
            call_end(line, time + "<br/>" + date, num, name);
        }

    }
}

// Run Main
bind();

// ----------------------------------------------------------------
// Display functions
function call_ring(line, datetime)
{
    // Ring image
    var str_updater = outputs[line][o_img_line];
    $("#" + str_updater).removeClass();
    $("#" + str_updater).addClass("blink_image");

    // Panel
    str_updater = outputs[line][o_pan];
    $("#" + str_updater).removeClass();
    $("#" + str_updater).addClass("app_call_line_ring");

    str_updater = outputs[line][o_time];
    $("#" + str_updater).text(datetime);

}

function call_off_hook(line, datetime)
{
    // Stop blinking line image
    var str_updater = outputs[line][o_img_line];
    $("#" + str_updater).removeClass();

    str_updater = outputs[line][o_time];
    $("#" + str_updater).text(datetime);

}

function call_on_hook(line, datetime)
{
    // Stop blinking line image
    var str_updater = outputs[line][o_img_line];

    str_updater = outputs[line][o_time];
    $("#" + str_updater).text(datetime);

}

function call_start(line, datetime, number, name, io)
{
    // Keep ring image same
    // ---

    // Update panel
    var str_updater = outputs[line][o_pan];

    switch(io)
    {
        case "I":
            
            $("#" + str_updater).removeClass();
            $("#" + str_updater).addClass("app_call_line_inbound");

        break;

        case "O":

            $("#" + str_updater).removeClass();
            $("#" + str_updater).addClass("app_call_line_outbound");

        break;
    }

    number = number.padEnd(14, " ") 
    name = name.padEnd(15, " ");
    
    str_updater = outputs[line][o_callerid_num];
    $("#" + str_updater).text(number);

    str_updater = outputs[line][o_callerid_name];
    $("#" + str_updater).text(name);

    str_updater = outputs[line][o_time];
    $("#" + str_updater).html(datetime);

    $("#lbCallLine").text((line + 1).toString().padStart(2, "0"));
    $("#lbCallCallerID").text(number + " " + name);

}

function call_end(line, datetime, number, name)
{
    // Keep ring image same
    // ---

    // Update panel
    var str_updater = outputs[line][o_pan];

    $("#" + str_updater).removeClass();
    $("#" + str_updater).addClass("app_call_line_idle");

    str_updater = outputs[line][o_callerid_num];
    $("#" + str_updater).text(number);

    str_updater = outputs[line][o_callerid_name];
    $("#" + str_updater).text(name);

    str_updater = outputs[line][o_time];
    $("#" + str_updater).html(datetime);

    for(var i = 0; i < 4; i++)
    {
        if(line == i)
        {
            str_updater = outputs[i][o_line];
            $("#" + str_updater).html("Ln " + (i + 1).toString() + "<br/>Last");
        }
        else
        {
            str_updater = outputs[i][o_line];
            $("#" + str_updater).html("Ln " + (i + 1).toString());
        }
    }

}

// ----------------------------------------------------------------
// Needed functions
function array_to_ascii(array)
{
    var str = "";
    array.forEach(function(i){
        str += String.fromCharCode(i);
    });
    return str;
}