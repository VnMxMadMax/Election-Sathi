export const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];

export const QUIZ_QUESTIONS = [
  { q: "What is the minimum voting age in India?", o: ["16", "18", "21", "25"], a: 1, e: "The 61st Amendment (1989) reduced the voting age from 21 to 18." },
  { q: "What does EVM stand for?", o: ["Election Voting Machine", "Electronic Voting Machine", "Electoral Vote Monitor", "Early Voting Method"], a: 1, e: "EVMs have been used in Indian elections since the late 1990s." },
  { q: "How many elected seats are in the Lok Sabha?", o: ["250", "543", "545", "552"], a: 1, e: "543 constituencies elect members to the Lok Sabha." },
  { q: "Who conducts Lok Sabha elections?", o: ["Supreme Court", "Parliament", "Election Commission of India", "President"], a: 2, e: "The ECI is the autonomous constitutional authority for elections." },
  { q: "Which body is the Upper House?", o: ["Lok Sabha", "Rajya Sabha", "Vidhan Sabha", "Zila Parishad"], a: 1, e: "Rajya Sabha is the Council of States (Upper House)." },
  { q: "What is a constituency?", o: ["A political party", "A voting machine", "A geographical area for representation", "A type of ballot"], a: 2, e: "An electoral district that elects one representative." },
  { q: "Can an NRI vote in Indian elections?", o: ["No", "Yes, online", "Yes, in person at constituency", "Yes, by post"], a: 2, e: "NRIs must be physically present at their polling booth." },
  { q: "How many phases did the 2024 General Election have?", o: ["5", "6", "7", "8"], a: 2, e: "The 2024 election was held in 7 phases from April to June." },
  { q: "Who appoints the Chief Election Commissioner?", o: ["Prime Minister", "Parliament", "President of India", "Supreme Court"], a: 2, e: "The President appoints the CEC on the advice of a selection committee." },
  { q: "What is VVPAT?", o: ["Voter Verified Paper Trail", "Voter Verifiable Paper Audit Trail", "Vote Validation Protocol", "Verified Voting Paper Token"], a: 1, e: "VVPAT provides a paper slip for the voter to verify their EVM vote." },
  { q: "Minimum age to contest Lok Sabha elections?", o: ["18", "21", "25", "30"], a: 2, e: "A candidate must be at least 25 years old for Lok Sabha." },
  { q: "What is the Model Code of Conduct?", o: ["A law passed by Parliament", "Guidelines during election period", "EVM operating manual", "Voter registration form"], a: 1, e: "MCC is a set of guidelines for parties/candidates during elections." },
  { q: "How many seats does Rajya Sabha have?", o: ["200", "245", "250", "300"], a: 2, e: "Rajya Sabha has a maximum of 250 members (238 elected + 12 nominated)." },
  { q: "What is Form 6 used for?", o: ["Voter ID correction", "New voter registration", "Candidate nomination", "Postal ballot request"], a: 1, e: "Form 6 is the application for new voter registration." }
];

// BOOTH_DATA removed — booth finder now uses Nominatim geocoding API

export const AI_RESPONSES = {
  "register": "To register, visit voters.eci.gov.in, fill Form 6, upload age/address proof, and submit. You must be 18+ and an Indian citizen. Track your application via the reference number or SMS to 1950.",
  "voting day": "Go to your assigned booth with valid photo ID (EPIC/Aadhaar/Passport). Officials verify identity, apply indelible ink, and you vote secretly on the EVM by pressing the button next to your candidate.",
  "evm": "An EVM (Electronic Voting Machine) records votes electronically via a Control Unit and Balloting Unit. It replaced paper ballots for secure, fast, and accurate voting and counting.",
  "prime minister": "The PM is not directly elected. Citizens elect MPs to Lok Sabha. The party/coalition with majority selects their leader, who the President appoints as Prime Minister.",
  "nota": "NOTA (None of the Above) lets you officially reject all candidates on the EVM. It ensures secrecy even when rejecting everyone, though NOTA votes don't affect the result.",
  "documents": "Carry any one: EPIC (Voter ID), Aadhaar, Passport, Driving Licence, PAN card, or any govt-issued photo ID. You also need to know your polling booth number and serial number on the voter list.",
  "model code": "The Model Code of Conduct (MCC) is guidelines for parties and candidates during elections. It covers speeches, polling day conduct, processions, and use of govt. machinery. It applies from announcement of elections until results.",
  "voter list": "Visit voters.eci.gov.in → 'Search in Electoral Roll'. Enter your details or EPIC number. You can also SMS your EPIC number to 1950 or call the ECI helpline.",
  "challenged": "If your vote is challenged, the Presiding Officer will ask you to prove identity. You may need to sign a declaration. If still denied, ask for a written reason. Call 1950 immediately and file a complaint on the ECI portal."
};

// PARTY_DATA — reference metadata only (name, abbreviation, color). Percentages come from live DB.
export const PARTY_DATA = {
  "Delhi": [{ a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "AAP", n: "Aam Aadmi Party", c: "#0072B9" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "BSP", n: "Bahujan Samaj Party", c: "#2962FF" }, { a: "JDU", n: "Janata Dal (United)", c: "#1B5E20" }],
  "Maharashtra": [{ a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "SHS", n: "Shiv Sena (UBT)", c: "#FF6F00" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "NCP", n: "NCP (Sharadchandra Pawar)", c: "#1565C0" }, { a: "MNS", n: "Maharashtra Navnirman Sena", c: "#FDD835" }],
  "Tamil Nadu": [{ a: "DMK", n: "Dravida Munnetra Kazhagam", c: "#E53935" }, { a: "ADMK", n: "All India Anna DMK", c: "#388E3C" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "PMK", n: "Pattali Makkal Katchi", c: "#FFC107" }],
  "West Bengal": [{ a: "TMC", n: "All India Trinamool Congress", c: "#00BFA5" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "CPIM", n: "Communist Party of India (Marxist)", c: "#D32F2F" }, { a: "SUCI", n: "Socialist Unity Centre", c: "#880E4F" }],
  "Karnataka": [{ a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "JDS", n: "Janata Dal (Secular)", c: "#43A047" }, { a: "AAP", n: "Aam Aadmi Party", c: "#0072B9" }, { a: "BSP", n: "Bahujan Samaj Party", c: "#2962FF" }],
  "Uttar Pradesh": [{ a: "SP", n: "Samajwadi Party", c: "#E53935" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "BSP", n: "Bahujan Samaj Party", c: "#2962FF" }, { a: "RLD", n: "Rashtriya Lok Dal", c: "#4CAF50" }],
  "Bihar": [{ a: "JDU", n: "Janata Dal (United)", c: "#1B5E20" }, { a: "RJD", n: "Rashtriya Janata Dal", c: "#43A047" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "HAM", n: "Hindustani Awam Morcha", c: "#7B1FA2" }],
  "Kerala": [{ a: "INC", n: "INC (UDF)", c: "#19AAAF" }, { a: "CPIM", n: "CPI(M) (LDF)", c: "#D32F2F" }, { a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "SDPI", n: "Social Democratic Party", c: "#1565C0" }, { a: "AAP", n: "Aam Aadmi Party", c: "#0072B9" }],
  "_default": [{ a: "BJP", n: "Bharatiya Janata Party", c: "#FF9933" }, { a: "INC", n: "Indian National Congress", c: "#19AAAF" }, { a: "AAP", n: "Aam Aadmi Party", c: "#0072B9" }, { a: "BSP", n: "Bahujan Samaj Party", c: "#2962FF" }, { a: "SP", n: "Samajwadi Party", c: "#E53935" }]
};

export const SCENARIOS = [
  { q: "My name is missing from the voter list", s: ["Check online at voters.eci.gov.in", "Visit your local BLO (Booth Level Officer)", "File Form 8 for inclusion", "Contact Helpline 1950"] },
  { q: "My Voter ID has wrong details", s: ["File Form 8A online via Voter Portal", "Visit ERO office with correct proof documents", "Carry Aadhaar, utility bill, or other address/age proof"] },
  { q: "I can't find my polling booth", s: ["SMS your EPIC number to 1950", "Check 'Know Your Polling Station' on ECI portal", "Ask your local BLO for directions"] },
  { q: "I was turned away at the booth", s: ["Ask for the reason in writing from Presiding Officer", "Contact Sector Magistrate or Returning Officer", "Call 1950 immediately", "File complaint on ECI cVIGIL app"] },
  { q: "I lost my Voter ID before election day", s: ["You can use any valid govt photo ID (Aadhaar, Passport, PAN, DL)", "Visit your ERO for duplicate EPIC application", "File Form 002 for duplicate Voter ID card"] },
  { q: "My polling booth has changed since last election", s: ["Booths are reassigned after delimitation or reorganization", "Check updated booth on voters.eci.gov.in", "SMS EPIC number to 1950 for latest booth info"] },
  { q: "I am unable to reach the booth due to disability", s: ["ECI mandates accessible polling stations with ramps", "Request postal ballot through Form 12D if eligible", "Wheelchair assistance is available — inform your BLO", "Companion assistance allowed for PwD voters"] },
  { q: "I received the wrong ballot paper", s: ["Immediately inform the Presiding Officer before marking", "A tendered ballot will be issued instead", "Your original ballot will be cancelled and reissued"] },
  { q: "Someone else has already voted using my name", s: ["Report to Presiding Officer immediately", "You can still cast a 'tendered vote'", "File FIR at nearest police station", "Complain on ECI portal and cVIGIL app"] },
  { q: "The EVM appears to be malfunctioning", s: ["Report to Presiding Officer immediately", "Voting will be paused and EVM replaced", "Your vote will be recorded on the replacement unit", "Request mock poll demonstration if suspicious"] },
  { q: "I am a first-time voter and don't know the process", s: ["Carry valid photo ID to your assigned booth", "Queue and wait for your turn", "Officer verifies identity and applies ink", "Press button on EVM next to your candidate", "Verify on VVPAT slip, then exit"] },
  { q: "My name is on the list but officer says it's not", s: ["Show your EPIC card or voter slip", "Ask officer to check supplementary list", "Contact Sector Magistrate on-site", "Call 1950 for immediate resolution"] },
  { q: "I am out of my home state on election day", s: ["Currently, you must vote in your registered constituency", "No postal ballot for general voters (only service/PwD/80+)", "Plan travel accordingly or apply for transfer via Form 6"] },
  { q: "I want to complain about voter bribery or intimidation", s: ["Use cVIGIL app to report with photo/video evidence", "Call 1950 immediately", "Report to nearest Flying Squad or Static Surveillance Team", "File written complaint with Returning Officer"] },
  { q: "I am a senior citizen and need assistance", s: ["Voters aged 80+ can apply for postal ballot (Form 12D)", "Priority entry at polling stations for 65+ voters", "Companion assistance allowed inside booth", "Wheelchair/mobility aid available — inform BLO"] },
  { q: "The polling booth is inaccessible", s: ["All booths must comply with ECI accessibility guidelines", "Report to District Election Officer immediately", "Call 1950 to register accessibility complaint", "ECI mandates ramps, signage, and PwD-friendly facilities"] },
  { q: "I accidentally pressed the wrong button on EVM", s: ["Unfortunately, once pressed, the vote is recorded", "There is no 'undo' on an EVM", "This is why ECI conducts voter awareness programs", "Check VVPAT slip carefully — if mismatch, report immediately"] },
  { q: "My postal ballot was not delivered", s: ["Contact your Returning Officer immediately", "File complaint with postal department", "Request reissue if within deadline", "Call 1950 for guidance on alternative options"] },
  { q: "I want to report a Model Code of Conduct violation", s: ["Use cVIGIL app — report with photo/video", "Call 1950 toll-free helpline", "Submit written complaint to District Election Officer", "Reports are acted upon within 100 minutes (ECI guideline)"] },
  { q: "The result in my constituency is disputed", s: ["Any candidate can file an Election Petition in High Court", "Petition must be filed within 45 days of result declaration", "Court may order recount or fresh election", "VVPAT audit trail can be used as evidence"] }
];

export const CHECKLIST_ITEMS = [
  "Check your name on the voter list at voters.eci.gov.in",
  "Know your EPIC (Voter ID) number",
  "Locate your assigned polling booth in advance",
  "Carry valid photo ID (Aadhaar, Passport, PAN, Driving Licence)",
  "Check voting date and timings for your constituency",
  "Understand EVM operation before voting day",
  "Review candidate list for your constituency (ECI website)",
  "Note ECI Helpline: 1950"
];

export const VOTER_ID_STEPS = [
  { title: "Visit Portal", desc: "Go to voters.eci.gov.in and click 'New Registration (Form 6)'. Create an account if you don't have one." },
  { title: "Basic Details", desc: "Enter full name, date of birth, gender, mobile number, and email address. Ensure details match your ID documents." },
  { title: "Address Details", desc: "Fill in your current residential address, PIN code, and Assembly constituency. This determines your polling booth." },
  { title: "Upload Documents", desc: "Age proof: Birth certificate / Aadhaar / Passport / Marksheet. Address proof: Aadhaar / Utility bill / Bank passbook. Plus a recent passport-size photo." },
  { title: "Declaration & Submit", desc: "Review all entered details. Check the declaration checkbox confirming accuracy. Submit the application." },
  { title: "Track Application", desc: "Note your Application Reference Number (ARN). Track status via the portal or SMS to 1950. Verification takes 30–45 days typically." }
];

export const ELECTION_TIMELINE = [
  { year: "1952", event: "First General Election — 17.3 crore voters, Nehru becomes PM" },
  { year: "1962", event: "Third General Election — Congress wins with large majority" },
  { year: "1977", event: "First non-Congress govt — Janata Party wins post-Emergency" },
  { year: "1989", event: "Voting age reduced from 21 to 18 (61st Amendment)" },
  { year: "1998", event: "EVMs introduced in select constituencies" },
  { year: "2004", event: "EVMs used nationwide for the first time" },
  { year: "2013", event: "NOTA option introduced on EVMs (SC order)" },
  { year: "2014", event: "Highest turnout at 66.4% — 81.4 crore voters" },
  { year: "2019", event: "VVPAT used in all constituencies for first time" },
  { year: "2024", event: "18th Lok Sabha — 96.8 crore registered voters" }
];

export const GLOSSARY = [
  { term: "EPIC", def: "Electoral Photo Identity Card — the official Voter ID issued by ECI" },
  { term: "NOTA", def: "None of the Above — option to reject all candidates on the EVM" },
  { term: "MCC", def: "Model Code of Conduct — guidelines for parties during election period" },
  { term: "Delimitation", def: "Process of redrawing constituency boundaries based on census data" },
  { term: "By-election", def: "Election held to fill a vacancy caused by death, resignation, or disqualification" },
  { term: "Hung Parliament", def: "When no party or coalition wins a majority of seats" },
  { term: "Anti-defection Law", def: "Prevents elected members from switching parties (52nd Amendment, 1985)" },
  { term: "Presiding Officer", def: "Senior official in charge of a polling station on election day" },
  { term: "BLO", def: "Booth Level Officer — grassroots ECI official assigned to each polling booth" },
  { term: "ERO", def: "Electoral Registration Officer — responsible for voter rolls in a constituency" },
  { term: "RO", def: "Returning Officer — oversees election conduct in a constituency" },
  { term: "Constituency", def: "A geographical area that elects one representative to the legislature" },
  { term: "Affidavit", def: "Sworn statement filed by candidates declaring assets, criminal cases, and education" },
  { term: "VVPAT", def: "Voter Verifiable Paper Audit Trail — paper slip confirming EVM vote" },
  { term: "ECI", def: "Election Commission of India — autonomous constitutional body conducting elections" }
];
