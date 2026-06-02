from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import products, customers, orders, inventory

app = FastAPI(
    title="Inventory & Order Management System",
    description="API for managing products, customers, orders, and inventory tracking",
    version="1.0.0",
)

# CORS — allow all origins for development (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://inventory-management-gules-delta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(inventory.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "Inventory & Order Management API",
        "version": "1.0.0",
    }


@app.get("/api", tags=["Health"])
def api_info():
    return {
        "message": "Welcome to the Inventory & Order Management API",
        "docs": "/docs",
        "endpoints": {
            "products": "/api/products",
            "customers": "/api/customers",
            "orders": "/api/orders",
            "inventory": "/api/inventory",
        },
    }