import fs, { promises as fsp } from 'fs';
import readline from 'readline';
import {
  google, drive_v3 as gdTypes,
} from 'googleapis';
import { config as setEnv } from 'dotenv';

setEnv();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const credentials = {
  clientID: process.env.CLIENT_ID,
  project_id: process.env.PROJECT_ID,
  cliendSecret: process.env.CLIENT_SECRET,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  redirectURI: 'urn:ietf:wg:oauth:2.0:oob',
};

const drive = {};

function getToken(client) {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      client.getToken(code, (err, token) => {
        if (err) {
          reject(err);
          return;
        }
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (e) => {
          if (e) {
            reject(e);
          }
          console.log('Token stored to', TOKEN_PATH);
          resolve(token);
        });
      });
    });
  });
}

drive.getClient = async function getClient() {
  const { clientID, cliendSecret, redirectURI } = credentials;
  const client = new google.auth.OAuth2(
    clientID, cliendSecret, redirectURI,
  );

  let token;
  try {
    token = await fsp.readFile(TOKEN_PATH);
  } catch (error) {
    token = await getToken(client);
  }
  client.setCredentials(JSON.parse(token));

  return client;
};


drive.listFiles = async function listFiles(client) {
  const driveAPI = google.drive({ version: 'v3', auth: client });
  const res = await driveAPI.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const { files } = res.data;
  if (files.length) {
    console.log('Files:');
    files.forEach((file) => {
      console.log(`${file.name} (${file.id})`);
    });
  } else {
    console.log('No files found.');
  }
};

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
// function getAccessToken(oAuth2Client, callback) {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   console.log('Authorize this app by visiting this url:', authUrl);
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   rl.question('Enter the code from that page here: ', (code) => {
//     rl.close();
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) return console.error('Error retrieving access token', err);
//       oAuth2Client.setCredentials(token);
//       // Store the token to disk for later program executions
//       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//         if (err) return console.error(err);
//         console.log('Token stored to', TOKEN_PATH);
//       });
//       callback(oAuth2Client);
//     });
//   });
// }

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
//   // eslint-disable-next-line camelcase
//   const { client_secret, client_id, redirect_uris } = credentials.installed;
//   const oAuth2Client = new google.auth.OAuth2(
//     client_id, client_secret, redirect_uris[0],
//   );

//   // Check if we have previously stored a token.
//   fs.readFile(TOKEN_PATH, (err, token) => {
//     if (err) return getAccessToken(oAuth2Client, callback);
//     oAuth2Client.setCredentials(JSON.parse(token));
//     callback(oAuth2Client);
//   });
// }

// /**
//  * Lists the names and IDs of up to 10 files.
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listFiles(auth) {
//   const drive = google.drive({ version: 'v3', auth });
//   drive.files.list({
//     pageSize: 10,
//     fields: 'nextPageToken, files(id, name)',
//   }, (err, res) => {
//     if (err) {
//       console.log(`The API returned an error: ${err}`);
//       return;
//     }
//     const { files } = res.data;
//     if (files.length) {
//       console.log('Files:');
//       files.forEach((file) => {
//         console.log(`${file.name} (${file.id})`);
//       });
//     } else {
//       console.log('No files found.');
//     }
//   });
// }

// // Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//   if (err) {
//     console.log('Error loading client secret file:', err);
//     return;
//   }
//   // Authorize a client with credentials, then call the Google Drive API.
//   authorize(JSON.parse(content), listFiles);
// });

export default drive;
