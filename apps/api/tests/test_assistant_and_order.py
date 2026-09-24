import pytest
from landstack.services.ai_assist import route_intent


def test_route_intent_new_features():
    # Privacy
    p1 = route_intent("How do I hide my private details under DPDP?")
    assert p1["intent"] == "privacy"
    p2 = route_intent("Why are my details masked?")
    assert p2["intent"] == "privacy"

    # Hierarchy
    h1 = route_intent("Explain the officer hierarchy from VRO to Tahsildar")
    assert h1["intent"] == "hierarchy"
    h2 = route_intent("What is the role of revenue inspector?")
    assert h2["intent"] == "hierarchy"

    # 7-Dimension Transfer
    t1 = route_intent("What gets transferred during a full transfer?")
    assert t1["intent"] == "transfer_7d"
    t2 = route_intent("Does everything transfer to the new owner?")
    assert t2["intent"] == "transfer_7d"

    # 3D Cadastre
    c1 = route_intent("Show me the 3D cadastre building units")
    assert c1["intent"] == "threed_cadastre"
