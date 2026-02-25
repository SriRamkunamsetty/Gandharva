import json
import os

def clean_json_str(s: str) -> str:
    s = s.strip()
    if (s.startswith("'") and s.endswith("'")) or \
       (s.startswith('"') and s.endswith('"')):
        s = s[1:-1]
    if '\\"' in s:
        s = s.replace('\\"', '"')
    return s

def test_parsing():
    test_cases = [
        # Normal
        '{"test": 1}',
        # With single quotes around
        '\'{"test": 1}\'',
        # With double quotes around
        '"{\\"test\\": 1}"',
        # With escaped newlines
        '{"test": "line1\\nline2"}',
    ]
    
    for tc in test_cases:
        cleaned = clean_json_str(tc)
        try:
            parsed = json.loads(cleaned)
            print(f"SUCCESS: {tc} -> {parsed}")
        except Exception as e:
            print(f"FAILED: {tc} -> {e}")

if __name__ == "__main__":
    test_parsing()
