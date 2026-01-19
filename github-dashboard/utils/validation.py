import os


def validate_tokens() -> None:
    if not os.environ.get('GITHUB_API', '').strip():
        raise ValueError("No GITHUB_API token found")
    if not os.environ.get('OPENAI_API_KEY', '').strip():
        raise ValueError("No OPENAI_API_KEY found")
