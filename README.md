# 💼 JobPortal App (MERN Stack)

A full-stack Job Portal web application built using the MERN stack — **MongoDB**, **Express**, **React (Vite)**, and **Node.js**. This platform allows job seekers to browse and apply for jobs, while employers can post job listings and manage applicants.

---

## 🔗 Live Demo

- **Frontend**: [https://jobportal-app-mern-client.vercel.app/](https://jobportal-app-mern-client.vercel.app/)
- **Backend**: [https://jobportal-app-mern-server.onrender.com/](https://jobportal-app-mern-server.onrender.com/)

> Replace with your actual deployed URLs

---

## 📌 Tech Stack

### 🌐 Frontend
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Tailwind CSS / SCSS / React-Bootstrap] (if used)

### 🌍 Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)

### 🛠️ Deployment
- **Frontend**: [Vercel](https://vercel.com/)
- **Backend**: [Render](https://render.com/)

---

## 🚀 Features

### 👨‍💼 Job Seekers
- Browse job listings
- Filter/search jobs
- Apply for jobs
- Track application status
- Manage profile & resume

### 🏢 Employers
- Post new job listings
- View applicants
- Manage job posts
- Shortlist candidates

### 🔐 Authentication
- JWT-based secure login/signup
- Role-based access (Admin, Recruiter, User)

---

## 📁 Project Structure

jobportal-app/
├── client/ # React Vite Frontend
│ ├── src/
│ └── vite.config.js
├── server/ # Node.js Express Backend
│ ├── models/
│ ├── routes/
│ ├── controllers/
│ └── server.js

Backend (server/.env)
env
Copy
Edit
PORT=
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
