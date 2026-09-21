# SolvedLedger

Personal expense demo. A silent-NaN acceptance bug was found and fixed:
POST /entries accepted string amounts, stored NaN, and still returned ok.
