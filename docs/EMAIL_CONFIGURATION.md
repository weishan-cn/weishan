# weishan email configuration

## Current mailbox plan

1. `contact@weishan.ai`
   - Official public website contact
   - General consultation
   - Cooperation inquiries

2. `support@weishan.ai`
   - User feedback
   - Bug feedback
   - Usage questions
   - Download questions
   - MVP automated verification sender if no `verify@` mailbox yet

## Recommended later addition

3. `verify@weishan.ai` or `noreply@weishan.ai`
   - Registration verification
   - Login verification
   - Password reset
   - Automated notices only

## Password recovery flow

User clicks Forgot Password → enters email → system sends verification code/reset link → user sets a new password.

The system should never store plaintext passwords.
