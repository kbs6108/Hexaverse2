"""route_intent (Bhu-Sahayak) is pure — regexes and keywords, no DB, no LLM."""

from landstack.services.ai_assist import route_intent


def test_extracts_application_id_and_defaults_to_status():
    r = route_intent("where is app-2026-000123?")
    assert r["app_id"] == "APP-2026-000123"
    assert r["intent"] == "status"


def test_extracts_ulpin_case_insensitively():
    r = route_intent("is tdr194z1a2b3c4 safe to buy?")
    assert r["ulpin"] == "TDR194Z1A2B3C4"
    assert r["intent"] == "buy"


def test_extracts_survey_number_variants():
    assert route_intent("tax dues on survey no 123/4")["survey_no"] == "123/4"
    assert route_intent("who owns sy. no. 126?")["survey_no"] == "126"


def test_succession_beats_transfer_keywords():
    r = route_intent("my father passed away, how do I transfer the land to my name?")
    assert r["intent"] == "succession"


def test_intent_keywords():
    assert route_intent("I want to fix a spelling mistake in the record")["intent"] == "correction"
    assert route_intent("neighbour encroached on my plot")["intent"] == "complaint"
    assert route_intent("can I construct two floors here?")["intent"] == "build"
    assert route_intent("any court case on this parcel?")["intent"] == "dispute"
    assert route_intent("how do I object to a notice?")["intent"] == "notice"


def test_default_is_help_with_no_entities():
    r = route_intent("namaste")
    assert r == {"intent": "help", "app_id": None, "ulpin": None, "survey_no": None}
