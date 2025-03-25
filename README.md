# Schedulrr

Schedulrr is a scheduling application designed to help users efficiently manage and organize their appointments, tasks, and meetings.

## Features
- User authentication (Sign up, Login, Logout) using Clerk
- Create, edit, and delete schedules
- View all upcoming events in a calendar format
- Set reminders for scheduled tasks
- Automatically book events in Google Calendar
- Generate Google Meet links for scheduled events
- Shareable profile link to showcase schedules
- Responsive and user-friendly UI

## Tech Stack
- **Frontend**: Next.js
- **Backend**: Node.js, Express.js
- **Database**: NeonDB (PostgreSQL)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Integrations**: Google Calendar API, Google Meet

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Daksh-Goel12/Schedulrr.git
   ```
   

2. Navigate to the project directory:
   ```
   cd Schedulrr
   ```
   

3. Install dependencies:
   ```
   npm install
   ```


4. Set up environment variables in a \`.env\` file:
   ```
 
   DATABASE_URL=your_neondb_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_FRONTEND_API=your_clerk_frontend_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   GOOGLE_CALENDAR_ID=your_google_calendar_id
   ```


5. Start the development server:
   ``` 
   npm run dev
   ```


## Usage

- Sign up or log in to access your scheduling dashboard.
- Add new tasks or events with date and time.
- View upcoming schedules in an interactive calendar.
- Automatically book events in Google Calendar with a generated Google Meet link.
- Share your profile link to allow others to view or book meetings with you.  
  **Example:** \`https://schedulrr.app/profile/your-username\`
- Edit or delete existing schedules as needed.

## Google Calendar Integration

To enable Google Calendar event booking:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Calendar API**.
3. Generate OAuth credentials.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (\`feature/your-feature-name\`).
3. Commit your changes.
4. Push to your branch and create a pull request.
