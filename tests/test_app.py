from fastapi.testclient import TestClient
from src.app import app, activities
import pytest

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # basic smoke check for a known activity
    assert "Chess Club" in data


def test_signup_and_reflects():
    activity = "Math Club"
    email = "test_student@mergington.edu"

    # ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")
    assert email in activities[activity]["participants"]

    # cleanup
    activities[activity]["participants"].remove(email)


def test_signup_duplicate_returns_400():
    activity = "Chess Club"
    email = "dup@mergington.edu"

    # ensure the user is present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400

    # cleanup
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)


def test_unregister_success_and_not_found():
    activity = "Chess Club"
    email = "to_remove@mergington.edu"

    # ensure present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]

    # deleting again should return 404
    res2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res2.status_code == 404


def test_endpoints_for_unknown_activity():
    activity = "Nonexistent Club"
    email = "someone@mergington.edu"

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 404

    res2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res2.status_code == 404
