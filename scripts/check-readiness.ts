import { getCityReadiness } from '../lib/catalog/readiness';

const report = getCityReadiness('palermo');

console.log(JSON.stringify(report, null, 2));
