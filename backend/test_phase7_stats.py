import httpx
import sys

BASE_URL = "http://localhost:8000"

def test_dashboard_stats():
    print("Testing Phase 7 Dashboard Stats...")
    
    # 1. Login to get token
    login_data = {
        "username": "admin3@munaysys.com",
        "password": "adminpassword"
    }
    
    with httpx.Client(base_url=BASE_URL) as client:
        try:
            r = client.post("/api/v1/auth/login", data=login_data)
            r.raise_for_status()
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✓ Login successful")
            
            # 2. Get Dashboard Stats
            r = client.get("/api/v1/financial/dashboard-stats", headers=headers)
            r.raise_for_status()
            stats = r.json()
            
            print("\nDashboard Statistics:")
            print(f"- Total Sales: ${stats['total_sales']:.2f}")
            print(f"- Total Expenses: ${stats['total_expenses']:.2f}")
            print(f"- Net Profit: ${stats['net_profit']:.2f}")
            print(f"- Branch ID: {stats['branch_id']}")
            
            print("\nSales Trend (Last 30 days):")
            for entry in stats['sales_trend']:
                print(f"  {entry['date']}: ${entry['amount']:.2f}")
                
            print("\nCategory Distribution:")
            for cat in stats['category_distribution']:
                print(f"  {cat['category']}: ${cat['amount']:.2f} ({cat['percentage']:.1f}%)")
                
            if stats.get('occupancy_stats'):
                occ = stats['occupancy_stats']
                print(f"\nOccupancy: {occ['occupied_slots']}/{occ['total_slots']} ({occ['percentage']:.1f}%)")
            
            print("\n✓ Dashboard Stats API functional")
            
        except Exception as e:
            print(f"✗ Error: {e}")
            if hasattr(e, 'response'):
                print(f"Response: {e.response.text}")
            sys.exit(1)

if __name__ == "__main__":
    test_dashboard_stats()
