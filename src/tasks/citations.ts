export {};

const chalk = require("chalk");
const flow = require("lodash/fp/flow");
const { Client } = require("pg");

const byline = require("../components/byline");
const config = require("../config");
const delink = require("../components/delink");
const dequote = require("../components/dequote");
const link = require("../components/link");
const parse = require("../components/parse");
const sanitise = require("../components/sanitise");
const splitCitation = require("../components/splitCitation");
const thirty = require("../components/thirty");
const truncate = require("../components/truncate");
const tidyHtml = require("../components/tidyHtml");

const client = new Client(config.DB_CONNECTION);
client.connect();

const selectEvernoteNoteSql = `
  SELECT *
  FROM evernote_notes
  WHERE cloud_note_identifier = $1
  LIMIT 1
`;

const updateNoteSql = `
  UPDATE notes 
  SET cached_url = $2,
    cached_blurb_html = $3,
    cached_body_html = $4,
    groomed_at = NOW()
  WHERE id = $1
`;

const checkEvernoteNote = async () => {
  const results = await client.query(selectEvernoteNoteSql);
  return results.rows;
};

const updateNote = async (values: UpdateCitationValues) => {
  const result = await client.query(updateNoteSql, [
    values.id,
    values.path,
    values.blurb,
    values.body,
  ]);
  return result;
};

const createNote = async (values: UpdateCitationValues) => {
  const result = await client.query(updateNoteSql, [
    values.id,
    values.path,
    values.blurb,
    values.body,
  ]);
  return result;
};

const updateOrCreateNote = () => {
  checkEvernoteNote();
  updateNote(NoteValues);
  createNote(NoteValues);
}

module.exports = { updateOrCreateNote };
