const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

execSync('git tag -d ' + process.argv[2]);
execSync('git push origin :refs/tags/' + process.argv[2]);
