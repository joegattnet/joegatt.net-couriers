// https://slack.dev/node-slack-sdk/web-api

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const CREDENTIALS_PATH = path.resolve(__dirname, '../../googledocs.credentials.json'); 
const TOKEN_PATH = path.resolve(__dirname, '../../googledocs.token.json');

// Load client secrets from a local file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Docs API.
  authorize(JSON.parse(content), printDocTitle);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

const formatFootnote = (footnoteId, footnotes) => {
  // REVIEW: Can we refactor this?
  const textArray = footnotes[footnoteId].content.map(chunk => {
    if (!chunk.paragraph) return null;
    return chunk.paragraph.elements.map(element => {
      if (element.textRun && element.textRun.textStyle.link) {
        return `<a href="${element.textRun.textStyle.link.url}">${element.textRun.content.trim()}</a>`;
      }
      if (element.textRun) return element.textRun.content.trim();
      if (element.footnoteReference) return formatFootnote(element.footnoteReference, data.footnotes);      
      return null;
    }).join(' ');
  });
  const textString = textArray.join('');
  textString.replace(/ +/gm, ' ');
  return `[${textString}]`;
}

const formatBody = data => {
  const textArray = data.body.content.map(chunk => {
    if (!chunk.paragraph) return null;
    if (chunk.paragraph.paragraphStyle.namedStyleType === 'TITLE') return null;
    if (chunk.paragraph.paragraphStyle.namedStyleType === 'HEADING_4') {
      const headingText = chunk.paragraph.elements[0].textRun.content.trim();
      return ['',`<strong>${headingText}</strong>`.replace(/\{\{\{\{/, '{{').replace(/\}\}\}\}/, '}}')];
    }
    if (chunk.paragraph.paragraphStyle.namedStyleType === 'HEADING_5') {
      const headingText = chunk.paragraph.elements[0].textRun.content.trim();
      if (headingText === '--30--' || headingText === '-30-') return headingText;
      return [' ',`{\{${headingText}\}\}`.replace(/\{\{\{\{/, '{{').replace(/\}\}\}\}/, '}}')];
    }
    return chunk.paragraph.elements.map(element => {
      if (element.textRun && element.textRun.textStyle.link) {
        return `<a href="${element.textRun.textStyle.link.url}">${element.textRun.content.trim()}</a>`;
      }
      if (element.textRun) return element.textRun.content.trim();
      if (element.footnoteReference) return formatFootnote(element.footnoteReference.footnoteId, data.footnotes);      
      return null;
    }).join(' ');
  });
  const textString = textArray.flat().filter(Boolean).map(line => line && `<p>${line.replace(/\&/gm, '&amp;').replace(/\n\n\n+/gm, '\n\n').replace(/ +/gm, ' ')}</p>\n`).join('\n').trim();
  // textString.replace(/\n\n\n+/gm, '\n\n').replace(/ +/gm, ' ');
  // return textString.replace(/\n\n\n\n\{\{/gm, '\n\n\n{{').replace(/\}\}\n\n/gm, '}}\n').split('\n');
  return textString;
}

const chapters = [
  {
    name: 'Example',
    googleDocumentId: '1mhAQIzBflcx_jxIejYOrfWWgEnjCD6Kpa9eTxFTFdF0',
    evernoteId: '4d6bf3b8-0c94-44f1-a1fb-c0e37faf4213'
  },
  {}, {}, {},
  {
    name: 'Chapter 4',
    googleDocumentId: '13LhjdMQiQvQJfqy9EhcIICp5Zmp06hnjqRoDCC1shNI',
    evernoteId: ''
  },
  {
    name: 'Chapter 5',
    googleDocumentId: '1BsLoH3GnAWUMss04IcTxPQZkbv0suV3zuYg5r7ZHXgY',
    evernoteId: ''
  }
];

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */

/******************************************************************************
                                  EVERNOTE
 ******************************************************************************/

  var Evernote = require('evernote');

  function updateNote(noteStore, guid, noteTitle, noteBody, parentNotebook) {
    var nBody = '<?xml version="1.0" encoding="UTF-8"?>';
    nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    nBody += "<en-note>" + noteBody + "</en-note>";
   
    // Create note object
    var ourNote = new Evernote.Types.Note();
    ourNote.guid = guid;
    ourNote.title = noteTitle;
    ourNote.content = nBody;
   
    // parentNotebook is optional; if omitted, default notebook is used
    if (parentNotebook && parentNotebook.guid) {
      ourNote.notebookGuid = parentNotebook.guid;
    }
   
    // Attempt to create note in Evernote account (returns a Promise)
    noteStore.updateNote(ourNote)
      .then(function(note) {
        // Do something with `note`
        console.log(note);
      }).catch(function (err) {
        // Something was wrong with the note data
        // See EDAMErrorCode enumeration for error code explanation
        // http://dev.evernote.com/documentation/reference/Errors.html#Enum_EDAMErrorCode
        console.log(err);
      });
  }

  // var client = new Evernote.Client(token: token);
  // If we didn't have token we would have to fetch it now
  const TOKEN = process.env.EVERNOTE_TOKEN;
  var client = new Evernote.Client({
    token: TOKEN,
    sandbox: false,
    china: false
  });
  var noteStore = client.getNoteStore();


 /*****************************************************************************/

 function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth});
  const text = chapters[parseInt(process.argv[2], 10)];
  docs.documents.get({
    documentId: text.googleDocumentId,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(`The title of the document is: ${res.data.title}`);
    const bodyText = formatBody(res.data);

    updateNote(noteStore, text.evernoteId, res.data.title, bodyText);
  });
}