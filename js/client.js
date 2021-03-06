var connection = new WebSocket('ws://localhost:9090'); 

var name = "";

var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn'); 
var msgInput = document.querySelector('#msgInput'); 
var sendMsgBtn = document.querySelector('#sendMsgBtn'); 
//var addtextBtn = document.querySelector('#add-btn'); 
var clearBtn = document.querySelector('#clear-btn');
var outputBtn = document.querySelector('#output');

var connectedUser, myConnection, dataChannel;
  
//when a user clicks the login button 
loginBtn.addEventListener("click", function(event) { 
   //alert("hi");
   name = loginInput.value; 
   //addToOutput("testing " + name);
	
   if(name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   } 
}); 

function addToOutput(val) {
   var prev = document.getElementById("output").textContent;
   output.textContent = (prev + "\n" + val);
};

//when a user clicks the add button ----------------------------------------------------------------
/*
addtextBtn.addEventListener("click", function(event) { 
   //alert("hi-add");
   addToOutput("testing");
}); 
*/


//when a user clicks the clear button  -------------------------------------------------------------
clearBtn.addEventListener("click", function(event) { 
   output.textContent = "";
});  
 
//handle messages from the server 
connection.onmessage = function (message) { 
   console.log("Got message", message.data); 
   //addToOutput("Got message", message.data);    

   //alert("onmessage1 " + message.data);
   
   var data = JSON.parse(message.data);
   //alert("onmessage2 " + data + " " + data.type + " " + data.toString());

   //var data = JSON.parse(message.data);
   //alert("onmessage3 " + data.type + " " + data.type);

   //var data2 = JSON.parse(JSON.stringify(message.data));
   //alert("onmessage4 " + data2.type + " " + data2);
	
   switch(data.type) { 
      case "login": 
         onLogin(data.success);         
         break; 
      case "offer": 
         onOffer(data.offer, data.name); 
         break; 
      case "answer":
         onAnswer(data.answer); 
         break; 
      case "candidate": 
         onCandidate(data.candidate); 
         break; 
      case "undefined": 
         console.log("login empty");
         break; 
      default: 
         break; 
   } 
}; 
 
//when a user logs in 
function onLogin(success) { 
   //alert("in onLogin");

   if (success === false) { 
      alert("oops...try a different username"); 
   } else { 
      //creating our RTCPeerConnection object 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
      }; 
		
      myConnection = new webkitRTCPeerConnection(configuration, { 
         optional: [{RtpDataChannels: true}] 
      }); 
		
      console.log("RTCPeerConnection object was created"); 
      addToOutput("RTCPeerConnection object was created");
      console.log(myConnection); 
      //addToOutput(myConnection);
  
      //setup ice handling 
      //when the browser finds an ice candidate we send it to another peer 
      myConnection.onicecandidate = function (event) { 
		
         if (event.candidate) { 
            send({ 
               type: "candidate", 
               candidate: event.candidate 
            });
         } 
      }; 
		
      openDataChannel();
		
   } 
};
  
connection.onopen = function () { 
   console.log("Connected"); 
   //addToOutput("Connected");
}; 
 
connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
// Alias for sending messages in JSON format 
function send(message) { 
   if (connectedUser) { 
      message.name = connectedUser; 
   }
	
   connection.send(JSON.stringify(message)); 
};


//setup a peer connection with another user 
connectToOtherUsernameBtn.addEventListener("click", function () {
  
   var otherUsername = otherUsernameInput.value;
   connectedUser = otherUsername;
	
   if (otherUsername.length > 0) { 
      //make an offer 
      myConnection.createOffer(function (offer) { 
         console.log(); 
			
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         myConnection.setLocalDescription(offer); 
      }, function (error) { 
         alert("An error has occurred."); 
      }); 
   } 
});

  
//when somebody wants to call us 
function onOffer(offer, name) { 
   connectedUser = name; 
   myConnection.setRemoteDescription(new RTCSessionDescription(offer));
	
   myConnection.createAnswer(function (answer) { 
      myConnection.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("oops...error"); 
   }); 
}

//when another user answers to our offer 
function onAnswer(answer) { 
   myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
}
  
//when we got ice candidate from another user 
function onCandidate(candidate) { 
   myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
}


//creating data channel 
function openDataChannel() { 

   var dataChannelOptions = { 
      reliable:true 
   }; 
	
   dataChannel = myConnection.createDataChannel("myDataChannel", dataChannelOptions);
	
   dataChannel.onerror = function (error) { 
      console.log("Error:", error); 
   };
	
   dataChannel.onmessage = function (event) { 
      console.log("Received message:", event.data);  

      //var data = JSON.parse(event.data);
      //const stuff = event.data.toString();
      //alert(event.data);
      //alert(stuff);
      //alert("received  " + data + " " + data.type + " " + data.toString());

      addToOutput("Got message: " + event.data); 
      //addToOutput(myConnection);      
   };  
}

//when a user clicks the send message button 
sendMsgBtn.addEventListener("click", function (event) { 
   console.log("send message");
   var val = msgInput.value; 
   addToOutput("send message " + val);
   dataChannel.send(val); 
});

