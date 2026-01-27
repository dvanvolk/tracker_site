# Weight Tracker - Project Documentation

## Project Overview

A self-hosted web application for tracking weight progress across multiple users (up to 2) on an internal network. The application provides an intuitive interface for logging weight entries, visualizing progress over time, and exporting data for backup purposes.

## Features

### User Management
- Simple dropdown selection for switching between users
- Automatic detection and memory of last active user per device
- Support for up to 2 users maximum

### Weight Entry Logging
- Quick-entry form for recording weight
- Automatic timestamp using current date/time
- Optional backdating capability for missed entries
- Input validation to ensure data integrity

### Statistics Dashboard
- **Current Weight:** Most recent weight entry
- **Highest Weight:** Peak weight recorded across all entries
- **Pounds Lost:** Calculated difference between highest and current weight
- Real-time updates as new data is logged

### Data Visualization
- Interactive line graph showing weight progression
- Multiple time period views:
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - All time
- Clear visual indicators for trends

### Data Management
- CSV export functionality for complete data backup
- Export includes all entries with timestamps and user identification
- Easy import capability for data restoration

## Technical Architecture

### Technology Stack
- **Frontend:** React with functional components and hooks
- **Styling:** Tailwind CSS for responsive design
- **Charts:** Recharts library for data visualization
- **Storage:** Browser LocalStorage API for data persistence
- **State Management:** React useState and useEffect hooks

### Data Structure

#### User Object
```json
{
  "id": "user_1",
  "name": "Amanda"
}
```

#### Weight Entry Object
```json
{
  "id": "entry_1704067200000",
  "userId": "user_1",
  "weight": 150.5,
  "date": "2024-01-01T08:00:00.000Z",
  "timestamp": 1704067200000
}
```

#### Storage Keys
- `weight_tracker_users`: Array of user objects
- `weight_tracker_entries`: Array of weight entry objects
- `weight_tracker_last_user`: ID of last active user on device

### Security Considerations

#### Input Validation
- Weight values sanitized and validated (positive numbers only)
- Date inputs validated to prevent invalid timestamps
- User input escaped to prevent XSS attacks
- Maximum length restrictions on user names

#### Data Protection
- All data stored locally in browser (no external transmission)
- No authentication required (internal network trust model)
- CSV exports contain only user-authorized data
- No third-party analytics or tracking scripts

#### Best Practices Implemented
- Content Security Policy headers recommended for deployment
- Input sanitization on all user-provided data
- No eval() or dangerous JavaScript patterns
- Secure coding practices following OWASP guidelines
- Regular expression validation for user inputs

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment Guide

### Self-Hosting on Internal Network

#### Requirements
- Web server (Apache, Nginx, or simple HTTP server)
- Modern web browser on client devices
- Internal network connectivity

#### Installation Steps

1. **Download Application Files**
   - Save the HTML file to your web server directory
   - Ensure file permissions allow web server to read the file

2. **Configure Web Server**
   
   **For Nginx:**
   ```nginx
   server {
       listen 80;
       server_name weight-tracker.internal;
       root /var/www/weight-tracker;
       index index.html;
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       
       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

   **For Apache:**
   ```apache
   <VirtualHost *:80>
       ServerName weight-tracker.internal
       DocumentRoot /var/www/weight-tracker
       
       <Directory /var/www/weight-tracker>
           Options -Indexes +FollowSymLinks
           AllowOverride None
           Require all granted
       </Directory>
       
       # Security headers
       Header always set X-Frame-Options "SAMEORIGIN"
       Header always set X-Content-Type-Options "nosniff"
       Header always set X-XSS-Protection "1; mode=block"
   </VirtualHost>
   ```

3. **DNS Configuration** (Optional)
   - Add internal DNS entry for easy access
   - Example: `weight-tracker.internal` → server IP

4. **Access Application**
   - Navigate to http://[server-ip]/index.html or configured domain
   - Bookmark for easy access on devices

### Backup and Restore

#### Backing Up Data
1. Open the application in browser
2. Click "Export Data to CSV" button
3. Save the CSV file to secure location
4. Repeat periodically (weekly/monthly recommended)

#### Restoring Data
- Data restoration requires importing CSV back into LocalStorage
- Manual process or custom import feature can be added if needed

## Usage Guide

### Initial Setup
1. Access the application URL
2. Add user names (up to 2 users)
3. Begin logging weight entries

### Daily Usage
1. Open application (defaults to last user on device)
2. Enter current weight
3. Click "Log Weight" (or adjust date if backdating)
4. View updated statistics and graph

### Changing Time Periods
- Click time period buttons (7d, 30d, 90d, All) to adjust graph view
- Graph automatically updates to show selected timeframe

### Switching Users
- Use dropdown at top of page to select different user
- Application remembers selection for next visit on that device

### Exporting Data
- Click "Export Data to CSV" button
- Save file to preferred backup location
- File includes all users and all entries

## Maintenance

### Regular Tasks
- **Weekly:** Export CSV backup
- **Monthly:** Review data integrity
- **Quarterly:** Check browser compatibility updates

### Troubleshooting

**Data not saving:**
- Ensure browser allows LocalStorage
- Check browser isn't in private/incognito mode
- Verify no browser extensions blocking storage

**Graph not displaying:**
- Ensure at least 2 weight entries exist
- Check browser console for JavaScript errors
- Verify internet connectivity for CDN resources

**Export not working:**
- Check browser allows file downloads
- Verify popup blocker isn't interfering
- Try different browser if issues persist

## Future Enhancement Possibilities

### Potential Features
- Goal weight setting and progress indicators
- BMI calculation and tracking
- Photo progress comparison
- Reminders/notifications for logging
- Multi-device sync via network storage
- User authentication for shared device scenarios
- Weekly/monthly summary reports
- Weight prediction based on trends
- Notes/journal entries with weight logs

### Scalability Considerations
- Current design optimized for 2 users
- Can be extended to support more users with minimal changes
- Database backend could replace LocalStorage for larger deployments
- User authentication layer could be added for security in less trusted environments

## Support and Maintenance

### Updating the Application
- Replace HTML file with updated version
- User data persists in browser (no migration needed)
- Always backup data before updates

### Browser Updates
- Test application after major browser updates
- Monitor for deprecation warnings in console
- Update dependencies if compatibility issues arise

## License and Attribution

This is a custom-built application designed for internal use. All code follows best practices and uses open-source libraries:
- React (MIT License)
- Tailwind CSS (MIT License)
- Recharts (MIT License)

## Version History

### Version 1.0.0 (Initial Release)
- User management for 2 users
- Weight logging with timestamps
- Statistics dashboard
- Interactive graph with multiple timeframes
- CSV export functionality
- Responsive design for mobile and desktop