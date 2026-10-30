export function browserExitCode(report) {
 if(!report?.summary || !Array.isArray(report.results) || report.summary.errors>0 || report.results.some(r=>r.errors?.length||r.findings?.some(f=>f.kind==='incomplete')))return 2;
 return report.summary.findings>0 ? 1 : 0;
}
