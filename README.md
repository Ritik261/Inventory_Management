<div align="center">
  <h1>📦 Inventory & Order Management System</h1>
  <p><i>A modern, full-stack application built with FastAPI, React, and Supabase.</i></p>
  
  <p>
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

## 📖 Overview

The **Inventory & Order Management System** is a lightweight yet robust full-stack solution designed to streamline product inventory, manage customers, and track orders efficiently. It offers a well-structured REST API backend and a blazing fast frontend to handle everyday business operations with ease.

## ✨ Features

- **🛍️ Product Management**: Create, read, and manage products with inventory tracking.
- **👥 Customer Profiles**: Maintain detailed records of your clients and their contact information.
- **🛒 Order Processing**: Efficiently handle order creation with built-in stock validation and total price calculation.
- **📊 Inventory Tracking**: Track inbound/outbound stock movements and automatically update product quantities.
- **🚀 High Performance**: Built on top of FastAPI for exceptional API speed and React + Vite for a snappy UI.
- **🛡️ Secure Database**: Backed by Supabase (PostgreSQL) for scalable and reliable data storage.

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Validation**: Pydantic
- **Environment**: python-dotenv

### Frontend
- **Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linting**: ESLint

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints (products, customers, orders, inventory)
│   │   ├── schemas/         # Pydantic models for validation
│   │   ├── config.py        # App configuration settings
│   │   └── main.py          # FastAPI application entry point
│   ├── .env                 # Backend environment variables
│   ├── requirements.txt     # Python dependencies
│   └── supabase_schema.sql  # Database schema definitions
├── frontend/
│   ├── src/                 # React components and views
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies and scripts
│   └── vite.config.js       # Vite configuration
└── README.md                # Project documentation
```

## 🚀 Getting Started

Follow these steps to get the project running locally on your machine.

### Prerequisites

- Node.js (v16+)
- Python (3.9+)
- A Supabase account and project (for database credentials)

### 1. Database Setup

1. Create a new project in [Supabase](https://supabase.com/).
2. Run the SQL statements found in `backend/supabase_schema.sql` in the Supabase SQL Editor to create the necessary tables.

### 2. Backend Setup

Open a terminal and navigate to the project root, then proceed into the backend directory:

```bash
cd backend
```

Create a virtual environment and activate it:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Set up your environment variables:
Create a `.env` file in the `backend/` directory and add your Supabase credentials. You can use `.env.example` as a reference.

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

Run the FastAPI development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000/`. You can view the interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup

Open a new terminal window, navigate to the frontend directory:

```bash
cd frontend
```

Install the node modules:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The React application will be available at `http://localhost:5173/` (or the port specified in your terminal).

## 📡 API Endpoints

The backend provides the following core endpoints (detailed view in `/docs`):

- **`/api/products`**: GET, POST, PUT, DELETE for managing products.
- **`/api/customers`**: GET, POST, PUT, DELETE for handling customers.
- **`/api/orders`**: Create and list customer orders while deducting real-time stock.
- **`/api/inventory`**: Manage inventory movements (stock in, stock out).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request if you'd like to help improve this project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
