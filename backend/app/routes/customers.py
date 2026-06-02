from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database import supabase
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("/", response_model=list[CustomerResponse])
def list_customers(
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all customers with optional search and pagination."""
    query = supabase.table("customers").select("*")

    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%")

    response = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    return response.data


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int):
    """Get a single customer by ID."""
    response = supabase.table("customers").select("*").eq("id", customer_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Customer not found")

    return response.data[0]


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate):
    """Create a new customer. Email must be unique."""
    # Check for duplicate email
    existing = supabase.table("customers").select("id").eq("email", customer.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Customer with email '{customer.email}' already exists")

    data = customer.model_dump()
    response = supabase.table("customers").insert(data).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create customer")

    return response.data[0]


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer: CustomerUpdate):
    """Update a customer."""
    existing = supabase.table("customers").select("*").eq("id", customer_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If email is being changed, check uniqueness
    if "email" in update_data:
        dup = (
            supabase.table("customers")
            .select("id")
            .eq("email", update_data["email"])
            .neq("id", customer_id)
            .execute()
        )
        if dup.data:
            raise HTTPException(status_code=400, detail=f"Email '{update_data['email']}' is already in use")

    response = supabase.table("customers").update(update_data).eq("id", customer_id).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to update customer")

    return response.data[0]


@router.delete("/{customer_id}", status_code=200)
def delete_customer(customer_id: int):
    """Delete a customer by ID."""
    existing = supabase.table("customers").select("id").eq("id", customer_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check if customer has existing orders
    orders = supabase.table("orders").select("id").eq("customer_id", customer_id).limit(1).execute()
    if orders.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with existing orders."
        )

    supabase.table("customers").delete().eq("id", customer_id).execute()
    return {"message": "Customer deleted successfully"}
