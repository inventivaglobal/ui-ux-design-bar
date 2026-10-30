import test from 'node:test';
import assert from 'node:assert/strict';
import {browserExitCode} from '../engine/report-status.mjs';
test('browser CLI status consumes nested report results rather than nonexistent top-level findings',()=>{
 assert.equal(browserExitCode({summary:{errors:0,findings:0},results:[]}),0);
 assert.equal(browserExitCode({summary:{errors:0,findings:1},results:[]}),1);
 assert.equal(browserExitCode({summary:{errors:1,findings:0},results:[]}),2);
 assert.equal(browserExitCode({summary:{errors:0,findings:0},results:[{errors:[{}]}]}),2);
 assert.equal(browserExitCode({summary:{errors:0,findings:1},results:[{findings:[{kind:'incomplete'}]}]}),2);
 assert.equal(browserExitCode({}),2);
});
