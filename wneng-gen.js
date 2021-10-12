import { readLines } from "https://deno.land/std/io/mod.ts";
import { DB } from "./deps.ts";

const db = new DB("vendor/wnjpn.db");
const getWordsEngStmt1 = db.prepareQuery(
  "SELECT wordid FROM word WHERE lemma = ?",
);
// const getSensesEngStmt1 = db.prepareQuery("SELECT wordid FROM sense WHERE wordid = ? ORDER BY freq");
const getSensesEngStmt1 = db.prepareQuery(
  "SELECT synset FROM sense WHERE wordid = ? AND freq = (SELECT max(freq) FROM sense WHERE wordid = ?)",
);
// const getSensesEngStmt2 = db.prepareQuery("SELECT distinct wordid FROM sense WHERE synset = ? AND lang='eng' ORDER BY freq DESC LIMIT 10");
// const getWordsEngStmt2 = db.prepareQuery("SELECT lemma FROM word WHERE wordid = ?");
const getDefEngStmt = db.prepareQuery(
  "SELECT def FROM synset_def WHERE synset = ? AND lang='eng'",
);

function getWordsEng(lemma) {
  const defs = [];
  const synonyms = [];
  for (const [wordid1] of getWordsEngStmt1.all([lemma])) {
    // for ([wordid1] of getSensesEngStmt1.all(wordid1)) {
    for (const [synset1] of getSensesEngStmt1.all([wordid1, wordid1])) {
      for (const [def] of getDefEngStmt.all([synset1])) {
        defs.push(def);
      }
      // for (const [wordid2] of getSensesEngStmt2.all([synset1])) {
      //   for (const [lemma] of getWordsEngStmt2.all([wordid2])) {
      //     synonyms.push(lemma);
      //   }
      // }
    }
  }
  return [defs, synonyms];
}

function uniq(array) {
  return [...new Set(array)];
}

const fileReader = await Deno.open("3/mGSL.lst");
for await (const line of readLines(fileReader)) {
  const [lemma, _freq] = line.split("\t");
  const [defs, _words] = getWordsEng(lemma);
  // if (_words.length != 0) {
  //   const defString = defs.join(',');
  //   const lemmaString = words.filter(x => x != lemma).join(',');
  //   if (lemmaString != '') {
  //     // console.log(lemma + '\t' + defString + '\t' + lemmaString);
  //     console.log(lemma + '\t' + lemmaString);
  //   }
  // }
  if (defs.length != 0) {
    const defString = uniq(defs).join("|");
    console.log(lemma + "\t" + defString);
  }
}
