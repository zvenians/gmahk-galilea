import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const websiteSource = fs.readFileSync(path.join(root, 'apps-script-backend/Website.gs'), 'utf8');
const adminSource = fs.readFileSync(path.join(root, 'apps-script-backend/Admin.gs'), 'utf8');

const ctx = vm.createContext({
  Utilities: { formatDate: () => '2026-09-23', getUuid: () => '1234567890abcdef' },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'admin@test.com' }), getActiveUser: () => ({ getEmail: () => 'admin@test.com' }) },
  GW: { SHEETS: { banners: 'Website Banner' }, UTC_OFFSET: '+0800', TIMEZONE: 'Asia/Makassar' },
  GA: { SHEETS: { admins: 'admins' }, ROLES: { EDITOR: 1, APPROVER: 2 } },
  Logger: { log: () => {} }
});

try {
  vm.runInContext(websiteSource, ctx);
  vm.runInContext('function gaWorkflowRows_() { return []; }; function gaEnsureEntityIds_() {}; function gwEnsureSettingsSheet_() {}; function gwReadSettings_() { return {}; } function gwChooseScheduleSheet_() {}; function gaHealthSources_() { return []; } function gwSpreadsheet_() { return mockSpreadsheet; } function gaCurrentUser_() { return { role: "SUPERADMIN", email: "admin@test.com", status: "AKTIF" }; }', ctx);
  vm.runInContext(adminSource, ctx);
} catch (e) {
  console.log(e);
}

const mockCode = `
  const mockBannersSheet = {
    getName: () => 'Website Banner',
    getLastRow: () => 2,
    getMaxColumns: () => 10,
    insertColumnsAfter: () => {},
    getRange: (r, c, rows, cols) => ({
      setValue: () => {},
      setValues: () => {},
      getValues: () => [['', '', 'B', 'Message A', '', '', '', 'PUBLISH', 'BAN-1']],
      getDisplayValues: () => [['', '', 'B', 'Message A', '', '', '', 'PUBLISH ', 'BAN-1']]
    })
  };

  const mockAdminsSheet = {
    getName: () => 'admins',
    getLastRow: () => 2,
    getLastColumn: () => 7,
    appendRow: () => {},
    getRange: () => ({ getDisplayValues: () => [['BAN-1', 'admin@test.com', 'Admin', 'SUPERADMIN', 'AKTIF', '', '']], setValues: () => {} })
  };

  const mockSpreadsheet = {
    getSheetByName: (name) => name === 'admins' ? mockAdminsSheet : mockBannersSheet
  };
  
  function gwSpreadsheet_() { return mockSpreadsheet; }
  function gaCurrentUser_() { return { email: 'admin@test.com', role: 'SUPERADMIN', status: 'AKTIF' }; }
`;

vm.runInContext(mockCode, ctx);

const testCode = `
  const now = new Date('2026-09-23T10:00:00Z');
  const websiteResult = gwReadBanners_(mockSpreadsheet, now);
  if (websiteResult.length !== 1) throw new Error('websiteResult.length ' + websiteResult.length);
  if (websiteResult[0].status !== 'publish') throw new Error('websiteResult[0].status ' + websiteResult[0].status);
  
  const adminUser = { email: 'admin@test.com', level: 2 };
  const adminResult = adminListEntity('banners');
  if (adminResult.records.length !== 1) throw new Error('adminResult.records.length ' + adminResult.records.length);
  if (adminResult.records[0].status !== 'PUBLISH') throw new Error('adminResult.records[0].status ' + adminResult.records[0].status);
`;

vm.runInContext(testCode, ctx);

console.log('OK - Ghost banner regression tests passed');
