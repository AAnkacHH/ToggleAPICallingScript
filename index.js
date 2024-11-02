const axios = require('axios');
const fs = require('fs');
const { parse } = require('json2csv');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

// Set your Toggl API token from environment variable
const TOGGLE_API_TOKEN = process.env.TOGGLE_API_TOKEN;
// Set your workspace (organization) ID here
const WORKSPACE_ID = parseInt(process.env.TOGGLE_API_WORKSPACE_ID, 10);


async function fetchTimeEntries(startDate, endDate) {
    try {
        console.log("Start from:" + startDate);
        console.log("To (not include <): " + endDate);
        const auth = Buffer.from(`${TOGGLE_API_TOKEN}:api_token`).toString('base64');
        const response = await axios.get(`https://api.track.toggl.com/api/v9/me/time_entries`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            params: {
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
            }
        });

        console.log("API Response status code: " + response.status);
        return response.data.filter((timeEntry) => timeEntry.workspace_id === WORKSPACE_ID); // filter only entries for specific work space.
    } catch (error) {
        console.error('Error fetching time entries:', error);
    }
}

function saveToCsv(data, fileName) {
    try {
        const fields = [
            'id',
            'workspace_id',
            'project_id',
            'task_id',
            'billable',
            'start',
            'stop',
            'duration',
            'description',
            'tags',
            'tag_ids',
            'duronly',
            'at',
            'server_deleted_at',
            'user_id',
            'uid',
            'wid',
            'pid'
        ];
        const opts = { fields, delimiter: ';' };
        const csv = parse(data, opts);

        // Check if the exports folder exists, if not create it
        const exportFolder = 'exports';
        if (!fs.existsSync(exportFolder)) {
            fs.mkdirSync(exportFolder);
        }

        const file = (fileName ?? 'time_entries') + '.csv';
        fs.writeFileSync('exports/' + file, csv);
        console.log('Time entries saved to time_entries.csv');
    } catch (error) {
        console.error('Error saving to CSV:', error);
    }
}

// Get date range from command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Missing required options: "startDate", "endDate". Usage: node index.js <startDate> <endDate> <optionalExportFileName>');
    return;
}

const startDate = args[0];
const endDate = args[1];
const fileName = args[2];

fetchTimeEntries(startDate, endDate)
    .then(data => {
        const sum = data.map((entry) => entry.duration).reduce((partialSum, a) => partialSum + a, 0);
        console.log('Total hours: ' + (sum / 3600.0));
        saveToCsv(data, fileName);
    });