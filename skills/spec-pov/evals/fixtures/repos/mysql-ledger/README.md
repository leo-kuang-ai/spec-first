# Ledger storage decision

Owner-supplied evaluation context: the write path uses the MySQL pool in `src/storage.js`. The team is considering PostgreSQL to share operational support with another service. Keeping the existing ledger available during migration is mandatory. No rollback drill, representative workload comparison or migration rehearsal has been completed. This is a decision fixture, not a runnable deployment. Do not install either database.
