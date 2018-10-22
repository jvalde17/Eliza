/**
 * 
 * Nodejs Eliza program.
 * 
 * Note: This is a console only application
 * By Jess Valdez (ASURITE: jvalde17)
 *
 */
var readline = require('readline');
const fs = require('fs');
var fslog = require('fs');
var dictionary_obj;
var latest_dictionary_file = 'default.JSON';
var targetFile = "."; 
var flag_update = 0; 
var lost_user = 0;
var conversation_log = new Array;
var rn = require('random-number');
//initial options, max values will be updated 
//based on size of random selections
var options = {
  min:  0
, max: 2
}

var num_match=0;
var usernam = '';
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var relevant_words = new Array;
var elizas_answer = new Array;
var elizas_question = new Array;
var rand_ans=0;
var rand_ques=0;

var comment_on = 0;
//function that watches if a new file is loaded
fs.watch(targetFile, {persistent: true}, function(event, filename) {
        if (!flag_update) {
			 if (event === 'change') { 
				 flag_update = 1;
				 console.log('Loading ' + filename);
				 if (latest_dictionary_file != filename) {
					 //readfile here
					 latest_dictionary_file = filename;
					 LoadIntellectUpdate ();
				 }
				 flag_update = 0;
			 }
		}
})

//LoadIntellect will read the available dictionary file
function LoadIntellect () {
	readDictionary(function (err, content) {
	try {
	var j_obj = JSON.parse(content);
	
	} catch (e) {
		console.log("Invalid JSON file is detected in the directory.");
		return 0; //console.error(e);
	}
	dictionary_obj = j_obj;
});}

//A separate LoadIntellect function for updates
//due to touchy behavior of fs.watch
function LoadIntellectUpdate () {
	readDictionary(function (err, content) {
	try {
	var j_obj = JSON.parse(content);
	} catch (e) {
		console.log("Invalid JSON Input file is detected.\n");
		return 0; //console.error(e);
	}
	//now merge new object to current object
	update_dictionary (j_obj);

	console.log("Hey, I just got smarter with new intellect added to my brains.");
});}

function readDictionary(callback) {
    fs.readFile(latest_dictionary_file, function (err, content) {
        if (err) return callback(err)
        callback(null, content)
    })
}

//append new intellect to dictionary_obj 
function update_dictionary (j_obj) {
	var start = dictionary_obj.entries.length;
	//console.log("appending 2..." + j_obj.entries.length + " from " + start);
	
	for (var o=0; o<j_obj.entries.length; o++) {
		dictionary_obj.entries[start] = (j_obj.entries[o]);
		//console.log(dictionary_obj.entries[start]);
        start++;		
	}
	//dictionary_obj = Object.assign(dictionary_obj, obj);
}

//function to return response and next question from JSON obj
function findKeyGetResponse() {
	var arr_obj = new Array;
	var new_rand;
	
	var obj = dictionary_obj.entries;
	for (var i=0; i<obj.length; i++) {
			arr_obj.push(obj[i]); 
	}
	
	for (var k=0; k<relevant_words.length; k++) {
		for (var j=0; j<arr_obj.length; j++) {
			if (arr_obj[j].key.includes(relevant_words[k])) {

			//random but relevant answer
				options.max = arr_obj[j].answer.length;
				new_rand = Math.floor(rn(options));  //get a random respond
				while (new_rand == rand_ans) { 
						//console.log(" duplicate random ans:");
						new_rand = Math.floor(rn(options));  //again, get a random respond
				}
				rand_ans = new_rand;
				elizas_answer.push(arr_obj[j].answer[rand_ans]);

			//random but relevant next question
				options.max = arr_obj[j].question.length;
				new_rand = Math.floor(rn(options));  //get a random respond
				while (new_rand == rand_ques) { 
						//console.log(" duplicate random ques:");
						new_rand = Math.floor(rn(options));  //again get a random respond
				}
				rand_ques = new_rand;
				elizas_question.push(arr_obj[j].question[rand_ques]);
		}
	}
	}
}

/* function that returns the relevant word 
* from the user's sentence*
*/
function parse_sentence_get_relevant(string) {
	relevant_words.length = 0; //initianize to 0 relevant words
	res = string.split(" ");
	//console.log("user says " + string);
	for (var s=0; s<res.length; s++) {
		if (isRelevant(res[s])) {
			if (!relevant_words.includes(res[s])) //make sure to record only 1 occurrence of a relevant word
			relevant_words.push(res[s]);
		}
	}
	if (relevant_words.length == 0) relevant_words.push("other");
	//console.log("relevant words = " + relevant_words.length);
}

//search dictionary for a hit
function isRelevant(string) {
	var arr_obj = new Array;

	var obj = dictionary_obj.entries;
	for (var i=0; i<obj.length; i++) {
			arr_obj.push(obj[i]); 
	}
	
    for (var j=0; j<arr_obj.length; j++) {
	    if (arr_obj[j].key.includes(string)) {
            return true;
		}
	}
	return false;
}
//form the respond based on dictionary 
//loaded in memory 
function formResponse(start) {
	
	findKeyGetResponse();
	
	for (var n=0; n<elizas_answer.length; n++) {
		if (!start) {
		console.log(elizas_answer[n]);
		conversation_log.push("Eliza: " + elizas_answer[n]);
		}
		console.log(elizas_question[n] + "\n>");
		conversation_log.push("Eliza: " + elizas_question[n]);
	}
	//clear the arrays
	elizas_answer.length = 0;
	elizas_question.length = 0;
}

/**
* This is the conversation loop
* I need a timer to timeout and say goodbye when no response
* from user for some time.
*/
function talktoUser() {
	
	rl.question(""
        , function (user_says) {
			lost_user = 0;
			conversation_log.push("\n" + usernam + ": " + user_says + "\n");
            switch (user_says.toLowerCase()){
				case "quit":
                    rl.close();
					process.exit(0);
                    break;	
				case "log":
                    create_log_file();
                    break;	
                case "maybe":
                    if (comment_on) clearInterval(timerC);
                    parse_sentence_get_relevant(user_says.toLowerCase());
					formResponse(0);
					comment_on = 0;
					break;				
				default:
				    //parse user_says to look matches in the dictionary.
					parse_sentence_get_relevant(user_says.toLowerCase());
					formResponse(0);
					comment_on = 0;
					break;
            }
		clearInterval(timerB);
		timerB = setInterval(pingUser, 20000);
		talktoUser();
		});//, console.log('Hey, ' + usernam);}, 5000);
}

/*
* create a log file of the current conversation.
* triggered with a log command.
*/
function create_log_file() {
	var filenam = usernam + "_" + getDateTime() + ".txt";
	
	fslog.writeFile ( filenam, conversation_log, (err) => {
		if (err) return console.log(err);
		console.log("Log file " + filenam + " created!");
	})
}

/*
* getDateTime function used for logging.
*/
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    var min  = date.getMinutes();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day  = date.getDate();
    return year + "_" + month + day + "_" + hour + min;
}

function pingUser() {
	console.log('\nHello, I am still here ' + usernam );
	conversation_log.push("Eliza: " + '\nHello, I am still here ' + usernam + '\n');
}

//periodic comment just to keep things interesting
function periodicComment() {
	comment_on = 1;
	console.log("\nYou sure can talk. I need some coffee – join me at Starbucks, " + usernam + "?");
	conversation_log.push("\nEliza: You sure can talk. I need some coffee – join me at Starbucks, " + usernam + "?");
	console.log("Yes, I am a Starbucks person.");
	conversation_log.push("\nEliza: Yes, I am a Starbucks person.");
}
//recursively prompts user of JSON input
//an input of 0 or quit to exit program
function startPrompt  () {
	if (!lost_user) { 
		console.log('\nHello, I am Eliza? \nWhat is your name?');
		conversation_log.length = 0; //reset the log
		conversation_log.push("Eliza: Hello, I am Eliza?\nWhat is your name?\n");
	}
    else console.log('Hello, I am still here?');
	lost_user++;	
	
    rl.question("",
         function (line) {
            switch (line){
				case "quit":
                    rl.close();
					process.exit(0);
                    break;	
	
                default:
				    clearInterval(timerA);
					lost_user=0;
					usernam = line;
					console.log("Hi " + usernam);
					relevant_words.push('welcome'); //initial relevant word
					formResponse(1);
					talktoUser();
					break;
            } 
	});

};

var timerA = setInterval(startPrompt, 20000);
var timerB = setInterval(pingUser, 20000);
var timerC = setInterval(periodicComment, 20000);
LoadIntellect(); //read dictionary file
startPrompt();
