// Beanlet Google Apps Script backend
// Instructions:
// 1) Replace SHEET_ID with your Google Spreadsheet ID (the long id in the sheet URL).
// 2) Create a sheet/tab named `users` with columns: username, password, clicks (optional — script will create the sheet if missing).
// 3) Deploy: 'Deploy' -> 'New deployment' -> select 'Web app'.
//    - Execute as: Me
//    - Who has access: Anyone or Anyone, even anonymous
// 4) Use the Web App URL (the /exec URL) as the `API` constant in `beanlet.html`.

const SHEET_ID = '1wfv_Oskcz91M_-EIP0_wXmhjqZ34Bhk-K4jXMKeEZXM';
const USER_SHEET_NAME = 'users';

function jsonResponse(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(USER_SHEET_NAME);
  if(!sh) sh = ss.insertSheet(USER_SHEET_NAME);
  return sh;
}

function findUserRow(sheet, username){
  const data = sheet.getDataRange().getValues();
  for(let i=0;i<data.length;i++){
    if(String(data[i][0]) === String(username)) return i+1; // sheet rows are 1-indexed
  }
  return -1;
}

function doPost(e){
  let body;
  try{
    body = JSON.parse(e.postData.contents);
  }catch(err){
    return jsonResponse({ success: false, message: 'Invalid JSON' });
  }

  const action = body.action;
  const sheet = getSheet();

  if(action === 'register'){
    const username = (body.username||'').trim();
    const password = body.password || '';
    if(!username || !password) return jsonResponse({ success:false, message:'Missing fields' });

    const row = findUserRow(sheet, username);
    if(row !== -1) return jsonResponse({ success:false, message:'User exists' });

    sheet.appendRow([username, password, 0]);
    return jsonResponse({ success:true });
  }

  if(action === 'login'){
    const username = (body.username||'').trim();
    const password = body.password || '';
    const row = findUserRow(sheet, username);
    if(row === -1) return jsonResponse({ success:false, message:'No such user' });

    const stored = sheet.getRange(row,1,1,3).getValues()[0];
    const storedPassword = String(stored[1]||'');
    const clicks = Number(stored[2]||0);
    if(storedPassword !== String(password)) return jsonResponse({ success:false, message:'Bad password' });

    return jsonResponse({ success:true, clicks: clicks });
  }

  if(action === 'click'){
    const username = (body.username||'').trim();
    const row = findUserRow(sheet, username);
    if(row === -1) return jsonResponse({ success:false, message:'No such user' });
    const clicksCell = sheet.getRange(row,3);
    const newClicks = Number(clicksCell.getValue()||0) + 1;
    clicksCell.setValue(newClicks);
    return jsonResponse({ success:true, clicks:newClicks });
  }

  return jsonResponse({ success:false, message:'Unknown action' });
}

function doGet(e){
  return jsonResponse({ success:true, message:'Web app alive' });
}
