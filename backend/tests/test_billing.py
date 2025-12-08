from fastapi.testclient import TestClient


def test_plans_available(client: TestClient):
    response = client.get("/api/billing/plans")
    assert response.status_code == 200
    data = response.json()
    assert any(plan["name"] == "free" for plan in data)


def test_subscription_defaults_to_free(client: TestClient, auth_headers):
    response = client.get("/api/billing/subscription", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "free"
    assert data["status"] == "inactive"


def test_checkout_requires_stripe_config(client: TestClient, auth_headers):
    response = client.post(
        "/api/billing/checkout",
        headers=auth_headers,
        json={"price_id": "price_dummy"},
    )
    assert response.status_code == 503

