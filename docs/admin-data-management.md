# HR / Admin data management

The Data management navigation entry opens a common workspace for existing organization editors. Bulk imports now use a single guided workflow: template → local validation and preview → acknowledgement → confirmation → server results.

## Existing editors

Employee records and onboarding, exits, project allocations, clients, leave balances and requests, time records, inventory, holiday calendars and assignments, learning, KPI definitions, values, certifications, review windows, policies, announcements, events, forms, compliance, organization settings and integrations remain backed by their existing services and role rules. The access panel preserves additive role grants; replacing roles continues through Employee Directory. A confirmed role grant must still pass server authorization.

## Bulk import contracts

| Import | Behavior | Server format |
| --- | --- | --- |
| Employee updates | Update existing work-email matches; blanks leave fields unchanged | XLSX |
| User batch | Admin only; create/update; new accounts get Employee access | XLSX |
| Leave balances | Overwrite current-month balances under server caps | XLSX, fixed column order |
| Project allocations | Create allocations with server capacity/date checks | XLSX, fixed column order |
| Inventory | Create only; existing tags skipped | CSV |
| KPI definitions | Upsert the matching definition | CSV |
| Review history | Update existing submissions by ID or employee and month | CSV |
| Company holidays | Update company calendar | CSV |
| Holiday assignments | Assign calendar; blank clears custom assignment | CSV |

Users can prepare CSV or XLSX files. The browser converts validated records into the server's required format with canonical headers and column order. Templates contain headers, not realistic employee records. Limits: 5 MB, 5,000 rows, first worksheet. Validation checks headers, required fields, duplicate keys, numbers, booleans, actual calendar dates, date ordering and formula content. International phone prefixes are retained. No import is submitted until the user reviews and confirms it.

These checks support safe operation; they do not certify legal compliance. Backend authorization and business rules remain authoritative. Imports can partially succeed: inspect accepted/skipped/error counts before retrying. The UI does not fabricate an audit trail or promise rollback where the existing service provides neither.

## Service limitations

Bands and departments currently have read-only reference endpoints. Editing these requires backend CRUD support; a frontend control alone cannot persist them. Job designations support creation through onboarding. Other externally owned or calculated values retain their existing ownership. New legal retention rules, universal change history, transactional import rollback, or approval gates require explicit backend support before they can be represented as enforced product behavior.

## Verification

Pure validation tests cover positional schemas, calendar correctness, duplicate keys, invalid balances, formulas, date ordering, submission identity, CSV quoting and preservation of international phone numbers. Browser QA uses synthetic preview data only and does not import organizational records or grant access.
