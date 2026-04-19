# Auth Service Test Automation

## Files
- `auth-test-common.ps1`: common logic for canonicalization checks, JWT generation, collection/environment generation, Newman orchestration, and cleanup hooks.
- `v1-f1-f3.ps1`: run Version 1 baseline/regression flow.
- `v2-f4-f5.ps1`: run Version 2 active bug-hunt flow.
- `v3-f6-f7.ps1`: run Version 3 active bug-hunt flow.
- `new-version-branches.ps1`: create local branch names from the release plan.

## Usage
- Export Postman-ready assets:
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\export-postman-assets.ps1`
- Generate assets only:
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v1-f1-f3.ps1 -GenerateOnly`
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v2-f4-f5.ps1 -GenerateOnly`
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v3-f6-f7.ps1 -GenerateOnly`
- Run full version suite:
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v1-f1-f3.ps1`
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v2-f4-f5.ps1`
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v3-f6-f7.ps1`
- Run retest subset:
  - `powershell.exe -ExecutionPolicy Bypass -File .\Testing\scripts\v2-f4-f5.ps1 -Mode retest -CaseIds TC_FP_03,TC_CP_04`

## Outputs
- Generated collection/environment: `Testing/.generated/`
- Postman import folder: `Testing/postman/`
- Per-run artifacts: `Testing/artifacts/<run-label>/`
- Canonical docs required before run:
  - `Testing/BVA-test.md`
  - `Testing/intergration-test.md`
  - `Testing/logbug.md`

## Postman Flow
- Run `export-postman-assets.ps1` to refresh all versioned collection/environment files.
- Import the matching `collection.json` and `environment.json` from `Testing/postman/` into Postman.
- Use Postman Collection Runner by version:
  - `v1`: baseline regression for Function `1-3`
  - `v2`: active queue for Function `4-5`
  - `v3`: security regression for Function `6-7`
- Tokens are captured automatically inside the generated request test scripts for the cases that need them.
