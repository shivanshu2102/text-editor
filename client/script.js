

let optionsButtons = document.querySelectorAll(".option-button");
let advancedOptionButton = document.querySelectorAll(".adv-option-button");
let fontName = document.getElementById("fontName");
let fontSizeRef = document.getElementById("fontSize");
let writingArea = document.getElementById("text-input");
let linkButton = document.getElementById("createLink");
let alignButtons = document.querySelectorAll(".align");
let spacingButtons = document.querySelectorAll(".spacing");
let formatButtons = document.querySelectorAll(".format");
let scriptButtons = document.querySelectorAll(".script");
const userList = document.getElementById('user-list');
let socket = io.connect('http://localhost:5000');

socket.on('disconnect', () => {

    userList.removeChild(userList.lastChild);
});



   
writingArea.addEventListener('keyup', (e) => {
    let text = e.target.innerHTML;
    socket.emit('text-edited', text);
});

socket.on('user-typing', (userName) => {

     displayTypingIndicator(userName);
 });
 function displayTypingIndicator(userName) {
     const typingIndicator = document.getElementById('typing-indicator');
    
     
        const textContainer = document.createElement('div');
       
        textContainer.textContent = `${userName} is typing...`;
        textContainer.classList.add('text-container');
        
       typingIndicator.appendChild(textContainer);
    
        
    }
    
 
socket.on('receive-changes', (text) => {
    writingArea.innerHTML = text;
});


function updateUserList(users) {

    const userList = document.getElementById('user-list');


    userList.innerHTML = '';
    let userItem = "example";

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.style.marginBottom ="9px";
        userItem.textContent = user;
        userList.appendChild(userItem);
    });
}
writingArea.addEventListener('input', () => {
    const text = writingArea.innerHTML;
    socket.emit('text-edited', text);
});


socket.on('update-user-list', (users) => {


    updateUserList(users);
});

writingArea.addEventListener('input', () => {
    socket.emit('typing');
});


// Socket event listener for updating user list with active users
socket.on('update-user-list-with-indicator', (users) => {
    updateUserListWithIndicator(users);
});


// Clear typing indicator when user stops typing
writingArea.addEventListener('keyup', () => {
    clearTypingIndicator();
});

function clearTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.textContent = '';
}


// Function to display connection or disconnection message
function displayMessage(message, color , opacity) {
    const messageContainer = document.createElement('div');
 
    messageContainer.style.backgroundColor = `rgba(${color}, ${opacity})`;
   
    messageContainer.textContent = message;
    messageContainer.classList.add('message-container');
  
    const topMessageContainer = document.getElementById('note'); 
   
    topMessageContainer.appendChild(messageContainer);

    // Remove the message after 5 seconds
    setTimeout(() => {
        messageContainer.remove();
    }, 2000);
}

// Socket event listener for user connection
socket.on('user-connected', (user) => {
    displayMessage(`${user} connected`, '0,255,0' , '0.5');
});

// Socket event listener for user disconnection
socket.on('user-disconnected', (user) => {
    displayMessage(`${user} disconnected`, '255,0,0' , '0.5');
});

// Function to handle text highlighting and emit the selected text range
const handleTextHighlight = () => {
    let selection = window.getSelection();
    let selectedText = selection.toString();
    let selectionRange = selection.getRangeAt(0);
    
    let startIndex = selectionRange.startOffset;
    let endIndex = startIndex + selectedText.length;
    
    socket.emit('highlight-text', { startIndex, endIndex });
};

// Event listener for text highlighting and broadcasting to other users
writingArea.addEventListener('mouseup', () => {
    handleTextHighlight();
});

// Socket event listener to receive and apply text highlighting from other users
socket.on('highlight-text', (highlightData) => {
    const { startIndex, endIndex } = highlightData;
    
    const selection = window.getSelection();
    const range = document.createRange();
    
    range.setStart(writingArea.childNodes[0], startIndex);
    range.setEnd(writingArea.childNodes[0], endIndex);
    
    selection.removeAllRanges();
    selection.addRange(range);
});
//locking algo 
writingArea.addEventListener('focus', () => {
    socket.emit('request-lock', { userId: socket.id });
});

socket.on('lock-status', (data) => {
    if (data.locked && data.lockHolder !== socket.id) {
        alert('Another user is editing the document. Please wait...');
 
        writingArea.setAttribute('contenteditable', 'false');
    } else {
     
        writingArea.setAttribute('contenteditable', 'true');
    }
});
writingArea.addEventListener('blur', () => {
    socket.emit('release-lock', { userId: socket.id });
});


//cursor code------------------------------------------------- 
// Capture mouse movement events
document.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    // Emit mouse movement data to the server
    socket.emit('mouse-move', { clientX, clientY });
});

// Handle mouse movement data received from the server
socket.on('mouse-move', (data) => {
   
    updateCursorPosition(data.clientX, data.clientY);
});

// Function to update cursor position
function updateCursorPosition(clientX, clientY) {
   
    const cursorElement = document.getElementById('shared-cursor');
    cursorElement.style.left = clientX + 'px';
    cursorElement.style.top = clientY + 'px';
}


//-----------------------------------------------------------

//List of fontlist
let fontList = [
    "Arial",
    "Verdana",
    "Times New Roman",
    "Garamond",
    "Georgia",
    "Courier New",
    "cursive",
];

//Initial Settings
const initializer = () => {
    //function calls for highlighting buttons
    //No highlights for link, unlink,lists, undo,redo since they are one time operations
    highlighter(alignButtons, true);
    highlighter(spacingButtons, true);
    highlighter(formatButtons, false);
    highlighter(scriptButtons, true);

    //create options for font names
    fontList.map((value) => {
        let option = document.createElement("option");
        option.value = value;
        option.innerHTML = value;
        fontName.appendChild(option);
    });

    //fontSize allows only till 7
    for (let i = 1; i <= 7; i++) {
        let option = document.createElement("option");
        option.value = i;
        option.innerHTML = i;
        fontSizeRef.appendChild(option);
    }

    //default size
    fontSizeRef.value = 3;
};

//main logic
const modifyText = (command, defaultUi, value) => {
    //execCommand executes command on selected text
    document.execCommand(command, defaultUi, value);
};

//For basic operations which don't need value parameter
optionsButtons.forEach((button) => {
    button.addEventListener("click", () => {
        modifyText(button.id, false, null);
    });
});

//options that require value parameter (e.g colors, fonts)
advancedOptionButton.forEach((button) => {
    button.addEventListener("change", () => {
        modifyText(button.id, false, button.value);
    });
});

//link
linkButton.addEventListener("click", () => {
    let userLink = prompt("Enter a URL");
    //if link has http then pass directly else add https
    if (/http/i.test(userLink)) {
        modifyText(linkButton.id, false, userLink);
    } else {
        userLink = "http://" + userLink;
        modifyText(linkButton.id, false, userLink);
    }
});

//Highlight clicked button
const highlighter = (className, needsRemoval) => {
    className.forEach((button) => {
        button.addEventListener("click", () => {
            //needsRemoval = true means only one button should be highlight and other would be normal
            if (needsRemoval) {
                let alreadyActive = false;

                //If currently clicked button is already active
                if (button.classList.contains("active")) {
                    alreadyActive = true;
                }

                //Remove highlight from other buttons
                highlighterRemover(className);
                if (!alreadyActive) {
                    //highlight clicked button
                    button.classList.add("active");
                }
            } else {
                //if other buttons can be highlighted
                button.classList.toggle("active");
            }
        });
    });
};

const highlighterRemover = (className) => {
    className.forEach((button) => {
        button.classList.remove("active");
    });
};

window.onload = initializer();