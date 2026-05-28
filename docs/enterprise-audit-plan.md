# weishan enterprise audit plan

One installer is used for personal, team, and enterprise users. The server reads account permissions and enables limits or enterprise features.

## Personal free
- Email registration and login
- Basic risk check
- Personal check history
- Limited usage

## Team / enterprise
- Organization members
- Role based permissions
- Operation audit logs
- Usage statistics
- Export records
- Whitelist / blacklist changes
- Enterprise domain memory

## Current v2 tables
- `organizations`
- `organization_members`
- `audit_logs`
- `email_risk_events`
- `email_verification_codes`

## Audit actions now written by server
- `validate_email`
- `signup_requested`
- `signup_blocked`
- `signup_failed`
- `login_success`
- `login_failed`
- `password_reset_requested`
- `password_reset_failed`
