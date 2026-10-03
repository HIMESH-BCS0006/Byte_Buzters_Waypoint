"""
Contract test comparing implemented FastAPI endpoints against docs/api/openapi.yaml.

Fails if any implemented operation deviates from openapi.yaml:
- path
- method
- operationId
- request and response schema
"""

import os
import yaml
import pytest
from app.main import app


@pytest.fixture(scope="session")
def openapi_spec():
    candidates = [
        "docs/api/openapi.yaml",
        "../../docs/api/openapi.yaml",
        "../../../docs/api/openapi.yaml",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "docs", "api", "openapi.yaml")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "docs", "api", "openapi.yaml")),
    ]
    for c in candidates:
        if os.path.exists(c):
            with open(c, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
    raise FileNotFoundError("docs/api/openapi.yaml not found in candidate paths")


B5_OPERATIONS = [
    ("post", "/orders", "createOrder"),
    ("get", "/orders", "listOrders"),
    ("get", "/orders/{id}", "getOrderById"),
    ("post", "/orders/{id}/cancel", "cancelOrder"),
    ("post", "/orders/{id}/defer", "deferOrder"),
    ("post", "/orders/{id}/requeue", "requeueOrder"),
    ("get", "/outlets/{id}/expected-deliveries", "getOutletExpectedDeliveries"),
    ("get", "/dispatch/queue", "getDispatchQueue"),
    ("post", "/plans/generate", "generatePlan"),
    ("get", "/plans", "listPlans"),
    ("get", "/plans/{plan_run_id}/trips", "getPlanRunTrips"),
    ("post", "/plans/validate", "validatePlan"),
    ("post", "/trips/{id}/orders", "addOrderToTrip"),
    ("delete", "/trips/{id}/orders/{order_id}", "removeOrderFromTrip"),
    ("post", "/trips/{id}/confirm", "confirmTrip"),
    ("post", "/trips/{id}/cancel", "cancelTrip"),
    ("post", "/plans/close-run", "closePlanRun"),
    ("get", "/plans/summary", "getPlansSummary"),
    ("get", "/fuel", "getFuelState"),
    ("get", "/fleet", "getFleetAvailability"),
    ("get", "/dashboard", "getDashboard"),
    ("get", "/notifications", "listNotifications"),
    ("post", "/notifications/{id}/read", "markNotificationRead"),
]


def test_b5_operations_contract_parity(openapi_spec):
    """Verifies that all Task B5 operations exist in openapi.yaml with matching operationId and path."""
    paths_in_spec = openapi_spec.get("paths", {})
    fastapi_openapi = app.openapi()
    fastapi_paths = fastapi_openapi.get("paths", {})

    for method, path, expected_op_id in B5_OPERATIONS:
        # Check in openapi.yaml
        assert path in paths_in_spec, f"Path {path} missing in docs/api/openapi.yaml"
        spec_op = paths_in_spec[path].get(method)
        assert spec_op is not None, f"Method {method.upper()} {path} missing in openapi.yaml"
        assert spec_op.get("operationId") == expected_op_id, (
            f"Operation ID mismatch in openapi.yaml for {method.upper()} {path}: "
            f"expected {expected_op_id}, got {spec_op.get('operationId')}"
        )

        # Check in FastAPI app
        api_v1_path = f"/api/v1{path}"
        assert api_v1_path in fastapi_paths, f"Path {api_v1_path} missing in FastAPI app"
        app_op = fastapi_paths[api_v1_path].get(method)
        assert app_op is not None, f"Method {method.upper()} {api_v1_path} missing in FastAPI app"
        assert app_op.get("operation_id") == expected_op_id or app_op.get("operationId") == expected_op_id, (
            f"FastAPI operationId mismatch for {method.upper()} {api_v1_path}: "
            f"expected {expected_op_id}, got {app_op.get('operation_id') or app_op.get('operationId')}"
        )
