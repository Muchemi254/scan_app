# scan_app

Scan App
A web application that allows users to upload photos of purchase invoices. The app uses Google Gemini AI to automatically analyze and categorize invoices, then stores the structured data securely in Firestore. Authentication is handled with Firebase Authentication.

✨ Features
📸 Upload photos of purchase invoices

🤖 AI-powered categorization with Gemini API

🔐 Secure login/signup with Firebase Authentication

💾 Store processed invoice data in Firestore

🌐 Built with React for a fast, responsive UI

🛠 Tech Stack
React – frontend framework

Firebase Authentication – user login/signup

Firestore – cloud database

Gemini API – AI invoice categorization

🚀 Getting Started
Prerequisites
Node.js (>= 18)

Firebase project set up (with Authentication + Firestore enabled)

Gemini API key

Installation
# Clone the repo
git clone https://github.com/Muchemi254/scan_app.git

# Go into the project folder
cd scan_app

# Install dependencies
npm install
Environment Setup
Create a .env file in the root directory with the following:

REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
Run the app
npm start
📖 Usage
Sign up or log in with Firebase Authentication.

Upload an invoice photo.

The app will analyze and categorize it using Gemini AI.

Results are saved in Firestore and can be viewed later.

🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License
