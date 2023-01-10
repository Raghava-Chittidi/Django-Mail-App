document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


// Shows the views required and hides the rest
function show(type) {
  document.querySelectorAll('.views').forEach(div => {
    div.style.display = 'none'
  });

  document.querySelector(`#${type}-view`).style.display = 'block';
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#title').style.display = 'none';
  show('compose');

  // Clear out composition fields
  recipients = document.querySelector('#compose-recipients');
  recipients.value = '';

  subject = document.querySelector('#compose-subject');
  subject.value = '';

  body = document.querySelector('#compose-body');
  body.value = '';

  // Submit the mail details as a POST request
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients.value,
        subject: subject.value,
        body: body.value
      })
    })

    .then(setTimeout(function(){load_mailbox('sent')}, 100))

    // Prevent form from submitting
    return false;
  }
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#title').style.display = 'block';
  show('emails');

  // Show the mailbox name
  document.querySelector('#title').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Function that shows the contents of the email when clicked
  function show_email(data) {
    mail = document.querySelector('#emails-id-view');
    mail.style.display = 'block';
    mail.innerHTML = '';

    const elem = document.createElement('div');
    elem.innerHTML = `<div><h5>From: </h5>${data.sender}</div> 
    <div><h5>To: </h5>${data.recipients}</div> 
    <div><h5>Subject: </h5>${data.subject}</div> 
    <div><h5>Timestamp: </h5>${data.timestamp}</div>
    <input type="submit" value="Archive" id="archive-btn" class="btn btn-sm btn-outline-primary">
    <input type="submit" value="Reply" id="reply-btn" class="btn btn-sm btn-outline-primary">
    <hr>
    <div><p>${data.body}</p></div>`;

    mail.append(elem);
  }

  if (mailbox == "sent") {

    // Show sent mails only
    show('sent');
    document.querySelector('#sent-view').innerHTML = '';

    fetch('/emails/sent')
    .then(response => response.json())

    // Shows sent mails in divs
    .then(results => {
      results.forEach(function(result) {
        const element = document.createElement('div');
        element.innerHTML = `<span class="recipients">${result.recipients}</span> 
        <span class="subject">${result.subject}</span> <span class="timestamp">${result.timestamp}</span>`;
        document.querySelector('#sent-view').append(element);

        // Show content of mail when the email is clicked
        element.addEventListener('click', function() {
          document.querySelector('#sent-view').style.display = 'none'

          fetch(`/emails/${result.id}`)
          .then(response => response.json())
          .then(data => {
            show_email(data);

            // Hide the archive and reply button
            document.querySelector('#archive-btn').style.display = 'none'
            document.querySelector('#reply-btn').style.display = 'none'
          })
        })
      })
    })
  }

  else if (mailbox == "inbox") {

    // Show inbox mails only
    show('emails');
    document.querySelector('#emails-view').innerHTML = '';
    
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(results => {
      results.forEach(function(result) {

        // Change color of div based on whether the mail has been read or not
        let color = '';
        if (result.read) {
          color = "lightgray";
        }
        else {
          color = "white";
        }

        // Show inbox mails as divs
        const element = document.createElement('div');
        element.style.backgroundColor = color;
        element.innerHTML = `<span class="recipients">${result.recipients}</span> 
        <span class="subject">${result.subject}</span> 
        <span class="timestamp">${result.timestamp}</span>`;
        document.querySelector('#emails-view').append(element);
        
        // Show email content when the email is clicked
        element.addEventListener('click', function() {

          // Hide inbox
          document.querySelector('#emails-view').style.display = 'none';

          fetch(`/emails/${result.id}`)
          .then(response => response.json())
          .then(data => {
            show_email(data)

            // Set the email as read
            fetch(`/emails/${data.id}`, {
              method:"PUT",
              body: JSON.stringify({
                read: true
              })
            })

            // When archive button is clicked
            document.querySelector('#archive-btn').addEventListener('click', function() {

              // Set the email as archived
              fetch(`/emails/${data.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  archived: true
                })
              })

              // Load inbox
              .then(setTimeout(function(){load_mailbox('inbox')}, 100))
            })
            
            // When reply button is clicked
            document.querySelector('#reply-btn').addEventListener('click', function() {

              // Hide mail content and load compose view
              document.querySelector('#emails-id-view').style.display = 'none';
              compose_email();

              // Set the initial values in the compose view
              document.querySelector('#compose-recipients').value = data.sender;
              document.querySelector('#compose-subject').value = "Re: " + data.subject;
              document.querySelector('#compose-body').value = `"On ${data.timestamp} ${data.sender} wrote: ${data.body}"`;
            })
          })
        })
      })
    })
  }

  else if (mailbox == "archive") {

    // Show archived mails only
    show('archive');
    document.querySelector('#archive-view').innerHTML = '';

    fetch('/emails/archive')
    .then(response => response.json())
    .then(results => {
      results.forEach(function(result) {
        const element = document.createElement('div');
        element.innerHTML = `<span class="recipients">${result.recipients}</span> 
        <span class="subject">${result.subject}</span> <span class="timestamp">${result.timestamp}</span>`;
        document.querySelector('#archive-view').append(element);

        // When an archived mail is clicked, show the contents of the email
        element.addEventListener('click', function() {
          document.querySelector('#archive-view').style.display = 'none'

          fetch(`/emails/${result.id}`)
          .then(response => response.json())
          .then(data => {
            show_email(data);

            // Set name of the button to unarchive
            document.querySelector('#archive-btn').value = "Unarchive";
            document.querySelector('#archive-btn').addEventListener('click', function() {

              // When the unarchive button is clicked
              fetch(`/emails/${data.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  archived: false
                })
              })
              
              // Load inbox
              .then(setTimeout(function(){load_mailbox('inbox')}, 100))
            })
          })
        })
      })
    })
  }
}
