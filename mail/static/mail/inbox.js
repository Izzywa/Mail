
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
    load_mailbox('inbox');
  });
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
  document.querySelector('#alert-box').style.display = 'none';

  //Send Mail
  document.querySelector('#compose-form').onsubmit = function() {
    if (document.querySelector('#compose-subject').value.trim() === '') {
      show_alert_box('warning', 'Subject field must not be empty.')
    } else {
      compose();
    }

    return false;
  }


});



function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#alert-box').style.display = 'none';
  document.querySelector('#emails-list').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  const emails_list = document.querySelector('#emails-list');
  emails_list.innerHTML = '';

  document.querySelector('#alert-box').style.display = 'none';
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  emails_list.style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  show_mailbox(mailbox)

  document.querySelectorAll('.read-false').forEach(element => {
    element.style.background = 'gray';
  });
  document.querySelectorAll('.read-true').forEach(element => {
    element.style.background = 'white';
  });
}

//Compose the email
function compose() {

  const alert_box = document.querySelector('#alert-box');
  const alert_message = document.querySelector('#alert-message');

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        if (result.message === undefined ) {
          show_alert_box('warning', result.error)
        } else {
          // Once the email has been sent, load the user’s sent mailbox.
          load_mailbox('sent')
          show_alert_box('success', result.message)
        }
    })
    .catch(error => {
      alert(error);
    })

}

//Show the content of the email
function email_content(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#alert-box').style.display = 'none';
  document.querySelector('#emails-list').style.display = 'none';
  document.querySelector('#email-content').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(result => {
    document.querySelector('#email-content-sender').innerHTML = 'From: ' + result.sender;
    document.querySelector('#email-content-recipients').innerHTML = 'To: ' + result.recipients.join(', ');
    document.querySelector('#email-content-subject').innerHTML = result.subject;

    const body = document.querySelector('#email-content-body');
    body.innerHTML = '';
    result['body'].split('\n').forEach(paragraph => {
      if (paragraph.length === 0) {
        body.innerHTML += '<br>';
      } else {
        body.innerHTML += `<p>${paragraph}</p>`;
      }
    });
    document.querySelector('#email-content-timestamp').innerHTML = result.timestamp;
    document.querySelector('#email-reply').onclick = () => {
      reply(result.id);
    }

    // Update email as read
    if (!result.read) {
      fetch(`emails/${result.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
      .catch(error => {
        alert(error);
      });
    } 
  });
}

//Toggle Archive status
function toggle_archive(email_id, status) {
  fetch(`emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: status
    })
  })
  .then(() => load_mailbox('inbox'))
  .catch(error => {
    alert(error);
  });


}

//Fetch mailbox
function show_mailbox(mailbox) {
  const emails_list = document.querySelector('#emails-list');
  emails_list.innerHTML = '';

  const str_mailbox = `emails/${mailbox}`;
  //fetch the mailbox
  fetch(str_mailbox)
  .then(response => response.json())
  .then(result => {
    result.forEach(element => {
      let email_box = document.createElement('div');
      email_box.classList.add('card','my-2',`read-${element.read}`);

      let email_header = document.createElement('div');
      email_header.classList.add('card-header');
      email_header.innerHTML = `From: ${element.sender}`;
      let email_body = document.createElement('div');
      email_body.classList.add('card-body', 'email-click');
      email_body.innerHTML = 
      `<blockquote class="blockquote mb-0">
          <p>${element.subject}</p>
          <footer class="blockquote-footer text-info"><small>${element.timestamp}</small></footer>
        </blockquote>`
      email_body.addEventListener('click', () => {
        email_content(element.id)
      });

      email_box.append(email_header, email_body);

      if (mailbox != 'sent') {
        let archive_button_div = document.createElement('div');
        archive_button_div.classList.add('card-body');
        let archive_btn = document.createElement('button');
        archive_btn.classList.add('btn','btn-info','archive-btn');
        if(element.archived === true) {
          archive_btn.innerHTML = 'Unarchive';
          archive_btn.addEventListener('click', () => {
            toggle_archive(element.id, false)
          });
        } else {
          archive_btn.innerHTML = 'Archive';
          archive_btn.addEventListener('click', () => {
            toggle_archive(element.id, true)
          });
        }
        archive_button_div.append(archive_btn);

        email_box.append(archive_button_div);
      }

      emails_list.append(email_box);
    });
  })
  .catch(error => {
    alert(error);
  });
}

//Reply
function reply(email_id) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#alert-box').style.display = 'none';
    document.querySelector('#emails-list').style.display = 'none';
    document.querySelector('#email-content').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  
    fetch(`emails/${email_id}`)
    .then(response => response.json())
    .then(result => {
      document.querySelector('#compose-recipients').value = result.sender;
      document.querySelector('#compose-subject').value = (result['subject'].startsWith('Re: ')? result.subject:`Re: ${result.subject}`);
      document.querySelector('#compose-body').value = 
      `On ${result.timestamp} ${result.sender} wrote:
       ${result.body}
       <hr>
       `;
    })
    .catch(error => {
      alert(error);
    })
    // Pre-fill composition fields

}

function show_alert_box(status, message) {
  const alert_box = document.querySelector('#alert-box');
  const alert_message = document.querySelector('#alert-message');

  if(status === 'success') {

    if (alert_box.classList.contains('alert-warning')) {
      alert_box.classList.remove('alert-warning');
      alert_box.classList.add('alert-success');
    } else if (!alert_box.classList.contains('alert-success')) {
      alert_box.classList.add('alert-success');
    }
    alert_box.style.display = 'block';
    alert_message.innerHTML = message;

  } else {

    if (alert_box.classList.contains('alert-success')) {
      alert_box.classList.remove('alert-success');
      alert_box.classList.add('alert-warning');
    } else if (!alert_box.classList.contains('alert-warning')) {
      alert_box.classList.add('alert-warning');
    }
    alert_box.style.display = 'block';
    alert_message.innerHTML = message;

  }
}