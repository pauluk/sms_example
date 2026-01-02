# Bulk SMS Upload Guide

## Overview

The bulk SMS feature allows you to send multiple SMS messages at once by uploading a CSV file. This is useful for sending notifications to multiple recipients efficiently.

## Features

✅ **CSV Upload** - Drag and drop or click to upload
✅ **Real-time Validation** - Instant feedback on message validity
✅ **Character Counter** - Track 160 character SMS limit per message
✅ **Batch Processing** - Send multiple messages in one operation
✅ **Detailed Results** - See success/failure status for each message
✅ **Test Mode Support** - All messages sent to test number when configured
✅ **Template Download** - Get a pre-formatted CSV template

## How to Use

### 1. Access Bulk Upload

1. Navigate to the Dashboard
2. Click the **"Bulk Send"** button
3. The bulk upload interface will appear

### 2. Prepare Your CSV File

#### CSV Format

Your CSV file should have **2 columns**:

```csv
message,recipient
"Payment approved for Invoice #12345. Amount: £1,200.50",+447700900000
"Your shipment has been dispatched. Tracking: ABC123",+447700900001
"Meeting scheduled for tomorrow at 10am",+447700900002
```

#### Column Details

| Column | Required | Description | Max Length |
|--------|----------|-------------|------------|
| `message` | Yes | SMS message text | 160 characters |
| `recipient` | No* | Phone number in E.164 format | - |

*In test mode, the recipient column is ignored and all messages go to `TEST_PHONE_NUMBER`

#### CSV Template

Download a pre-formatted template by clicking **"Download Template"** in the upload interface.

### 3. Upload and Preview

1. **Upload CSV**:
   - Drag and drop your CSV file
   - Or click the upload area to browse files

2. **Review Preview**:
   - See all rows parsed from your CSV
   - Check character counts (colored badges)
   - Review validation errors if any

3. **Validation Indicators**:
   - 🟢 **Green**: Valid, ready to send (0-140 chars)
   - 🟡 **Yellow**: Warning zone (141-160 chars)
   - 🔴 **Red**: Invalid, exceeds limit (>160 chars)

### 4. Send Messages

1. Click **"Send X Messages"** button
2. Watch progress as messages are sent
3. Review detailed results when complete

### 5. Review Results

After sending, you'll see:
- ✅ **Success count**: Messages sent successfully
- ❌ **Failure count**: Messages that failed
- 📋 **Detailed log**: Row-by-row status with error messages

## CSV Examples

### Example 1: Payment Notifications

```csv
message,recipient
"AP Payment approved: Invoice #INV-001 for £500.00",+447700900000
"AP Payment approved: Invoice #INV-002 for £1250.75",+447700900001
"AP Payment approved: Invoice #INV-003 for £300.00",+447700900002
```

### Example 2: Status Updates

```csv
message,recipient
"Your application has been received. Reference: APP001",+447700900000
"Your request is being processed. Ref: REQ002",+447700900001
"Update: Your case has been assigned to a team member",+447700900002
```

### Example 3: Reminders

```csv
message,recipient
"Reminder: Payment due on 15/01/2026 for £450",+447700900000
"Reminder: Document submission deadline is tomorrow",+447700900001
"Reminder: Meeting scheduled for 10am today",+447700900002
```

## Technical Details

### API Endpoint

**POST** `/api/send-sms-bulk`

**Request Body**:
```json
{
  "rows": [
    {
      "message": "Your SMS message here",
      "recipient": "+447700900000",
      "teamId": "AP"
    }
  ],
  "teamId": "AP"
}
```

**Response**:
```json
{
  "success": true,
  "total": 3,
  "sent": 3,
  "failed": 0,
  "results": [
    {
      "row": 1,
      "recipient": "+447700900000",
      "status": "success"
    }
  ]
}
```

### Rate Limiting

- **Delay**: 100ms between each SMS send
- **Purpose**: Prevent GOV.UK Notify API rate limiting
- **Impact**: 10 messages per second maximum

### Database Logging

Every SMS (success or failure) is logged to the `sms_log` table:

```sql
INSERT INTO sms_log (
  id,
  team_id,
  user_id,
  message,
  recipient,
  status,
  sent_at
) VALUES (...)
```

### Test Mode Behavior

When `TEST_PHONE_NUMBER` environment variable is set:
- ✅ All messages sent to this number
- ✅ `recipient` column is ignored
- ✅ Results show "(test mode)" suffix
- ⚠️ Perfect for development/staging

## Validation Rules

### Message Validation

1. ✅ **Required**: Message must not be empty
2. ✅ **Length**: Must be ≤ 160 characters
3. ✅ **Encoding**: Standard GSM-7 character set recommended

### Recipient Validation (Production Mode)

1. ✅ **Format**: E.164 format (+[country code][number])
2. ✅ **Example**: +447700900000 (UK)
3. ✅ **Required**: Only when NOT in test mode

### CSV File Validation

1. ✅ **Extension**: Must be `.csv`
2. ✅ **Size**: Browser dependent (typically <10MB)
3. ✅ **Headers**: Optional (auto-detected)
4. ✅ **Rows**: At least 1 data row required

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Message is required" | Empty message column | Add message text |
| "Message exceeds 160 characters" | Message too long | Shorten message |
| "No valid rows to send" | All rows invalid | Fix validation errors |
| "Failed to parse CSV" | Invalid CSV format | Check CSV syntax |
| "Recipient is required" | Missing recipient (prod) | Add phone number |

### Failed Messages

Failed messages are:
- ❌ Logged to database with `status='failed'`
- ❌ Shown in results with error details
- ❌ Counted in failure statistics
- ✅ Can be retried by re-uploading

## Best Practices

### CSV Preparation

1. ✅ **Test First**: Upload 1-2 rows to test
2. ✅ **Character Count**: Keep messages under 140 chars when possible
3. ✅ **Quotes**: Wrap messages with commas in double quotes
4. ✅ **Encoding**: Save CSV as UTF-8
5. ✅ **Validation**: Check preview before sending

### Message Content

1. ✅ **Clear**: Use clear, concise language
2. ✅ **Action**: Include what the recipient should do
3. ✅ **Reference**: Add reference numbers when applicable
4. ✅ **Contact**: Provide contact info if needed
5. ✅ **Avoid**: Special characters that waste space

### Sending Strategy

1. ✅ **Small Batches**: Start with <50 messages
2. ✅ **Monitor**: Check results before scaling up
3. ✅ **Peak Times**: Avoid during system peak hours
4. ✅ **Test Mode**: Always test in staging first
5. ✅ **Backup**: Keep CSV file for records

## Character Count Tips

### GSM-7 Characters (1 char each)

Standard alphabet, numbers, and:
```
@ £ $ ¥ _ ! " # % & ' ( ) * + , - . / : ; < = > ?
```

### Extended Characters (2 chars each)

```
[ ] { } \ ^ ~ | €
```

### Optimization Tips

1. ✅ Use "and" instead of "&" (saves 1 char)
2. ✅ Use "GBP" instead of "£" if not critical
3. ✅ Abbreviate where appropriate
4. ✅ Remove extra spaces
5. ✅ Use short URLs if including links

## Audit Trail

All bulk sends are tracked:

### Database
- Individual SMS logged in `sms_log` table
- Includes: message, recipient, status, timestamp
- Searchable by team, user, date range

### Results Export
- Download results after sending
- CSV format with row, recipient, status
- Useful for compliance and records

## Security & Compliance

### Data Protection
- ✅ SMS content logged securely
- ✅ Encrypted in transit (HTTPS)
- ✅ Stored in secure database
- ✅ Access controlled by authentication

### GDPR Compliance
- ✅ Only send to consented recipients
- ✅ Include opt-out information
- ✅ Maintain audit trail
- ✅ Delete data when no longer needed

### GOV.UK Notify
- ✅ All messages sent via official API
- ✅ Template-based sending
- ✅ Delivery receipts available
- ✅ Compliant with government standards

## Troubleshooting

### Upload Issues

**CSV won't upload**
- Check file extension is `.csv`
- Verify file isn't corrupted
- Try saving from Excel as "CSV UTF-8"

**Rows show as invalid**
- Check message length
- Verify CSV format (commas, quotes)
- Look at error messages in preview

### Sending Issues

**"Failed to send bulk SMS"**
- Check `NOTIFY_API_KEY` is configured
- Verify GOV.UK Notify account is active
- Check server logs for details

**Some messages failed**
- Review error messages in results
- Check if recipients are valid
- Verify message content is acceptable

### Performance Issues

**Slow upload/sending**
- Large CSV files take time to parse
- Many messages = longer send time
- Check network connection

## Support

### Getting Help

1. **Documentation**: Check this guide first
2. **Error Messages**: Read detailed error in results
3. **Logs**: Check browser console (F12)
4. **Server Logs**: Admin can check server logs

### Useful Information to Provide

When reporting issues:
- CSV file sample (remove sensitive data)
- Error messages from UI
- Browser console errors (F12)
- Approximate time of attempt
- Number of rows attempted

---

**Version**: 1.0
**Last Updated**: January 2, 2026
**Feature Status**: ✅ Production Ready
