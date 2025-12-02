# Student Social Media / Wiki Platform  
CS 351 – Full Stack Group Project (Group 8)

## 1. Functionality
This project is a student-focused wiki/social platform where users can:
- Log in using their UIC email through Auth0 or continue as a guest
- Create, view, and bookmark posts
- Browse content by university or subject
- Search using autocomplete (Trie)
- View recently visited posts (Cuckoo Hash Map)

---

## 2. Prerequisites
Please ensure the following are installed:

- **Node.js:** https://nodejs.org/  
- **Python 3:** https://www.python.org/  
- **Git:** https://git-scm.com/download/win  
- **Visual Studio Code (Recommended):** https://code.visualstudio.com/  

---

## 3. How to Clone the Project
Open a terminal and run:

```bash
git clone https://github.com/mabde7/CS351Group8.git
cd CS351Group8
```

You should now see the project folders:

```
backend/
frontend/
```

---

# 4. Running the Backend (Flask)

## 4.1 Create a Virtual Environment (REQUIRED)

Navigate into backend:

```bash
cd backend
```

Create the virtual environment:

```bash
python -m venv venv
```

Activate the environment:

### PowerShell:
```bash
venv\Scripts\Activate.ps1
```

### Command Prompt:
```cmd
venv\Scripts\activate.bat
```

---

## 4.2 Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## 4.3 Create the Backend `.env` File  
Inside the **backend** folder, create a file named `.env` containing:

```
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_client_id
SECRET_KEY=your_flask_secret
DATABASE_URL=your_postgres_url
```

*(The backend requires this to run.)*

---

## 4.4 Start the Backend Server

```bash
flask run
```

The backend will run at:  
**http://localhost:5000**

---

# 5. Running the Frontend (React)

## 5.1 Navigate to the Frontend Folder

```bash
cd ../frontend
```

## 5.2 Install Dependencies

```bash
npm install
```

---

## 5.3 Create the Frontend `.env` File

Inside `/frontend`, create a `.env` file with:

```
REACT_APP_AUTH0_DOMAIN=your_auth0_domain
REACT_APP_AUTH0_CLIENT_ID=your_client_id
```

(Add any other required frontend variables your teammates use.)

---

## 5.4 Start the Frontend

```bash
npm start
```

This will open the app at:  
**http://localhost:3000**

---

# 6. How the App Works Together

- Frontend (React) runs at **localhost:3000**  
- Backend (Flask) runs at **localhost:5000**  
- React sends API requests to Flask  
- Flask returns results  
- Both must be running at the same time

---
