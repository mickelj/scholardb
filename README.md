# ScholarsDB
**A new way to view faculty publications**

***Languages***: JavaScript, HTML (Pug templates), CSS  
***Requires***: node.js, PostgreSQL

ScholarsDB is a node.js based application for storing and citing scholarly publications for a university or other academic institution.  It uses PostgreSQL 9.5+ on the backend to leverage its ability to store semi-structured data since the various types of academic works each require differing fields.  The system interacts with Sherpa/RoMEO to determine open-access rights for publications and can direct users via OpenURL to a library system for checking on local availability.
